"""Declared dependency evidence from real source archives, without building code."""
import hashlib
import importlib.util
import io
import json
import subprocess
import sys
import tarfile
from pathlib import Path
from types import SimpleNamespace

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))
from release_evidence import sha256


def inventory():
    path = Path(__file__).parents[1] / "source_inventory.py"
    assert path.is_file(), "declared-source inventory tool is missing"
    spec = importlib.util.spec_from_file_location("source_inventory", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def export_fixture(tmp_path, files=None, members=None):
    files = files or {"core/Cargo.lock": b'[[package]]\nname = "example"\nversion = "1.0.0"\n'}
    source = tmp_path / "export"
    source.mkdir()
    entries = [{"path": path, "mode": "100644", "sha256": hashlib.sha256(data).hexdigest(),
                "size": len(data)} for path, data in files.items()]
    manifest = {"schema_version": 1, "commit": "a" * 40, "components": [{"path": ".", "commit": "a" * 40}],
                "files": entries}
    (source / "source-manifest.json").write_text(json.dumps(manifest))
    with tarfile.open(source / "source.tar.gz", "w:gz") as archive:
        for path, data, kind in members or [("source/" + path, data, tarfile.REGTYPE) for path, data in files.items()]:
            member = tarfile.TarInfo(path)
            member.type = kind
            if kind == tarfile.REGTYPE:
                member.size = len(data)
                archive.addfile(member, io.BytesIO(data))
            else:
                member.linkname = "../../outside"
                archive.addfile(member)
    refresh_checksums(source)
    return source, manifest


def refresh_checksums(source):
    (source / "SHA256SUMS.unsigned").write_text("".join(
        f"{sha256(source / name)}  {name}\n" for name in ("source.tar.gz", "source-manifest.json")))


def scanner(monkeypatch, module, *, empty=False, fail=False):
    calls = []

    def run(command, **kwargs):
        calls.append((command, kwargs))
        if "version" in command:
            return SimpleNamespace(stdout=json.dumps({"version": "1.50.0"}))
        if fail:
            raise subprocess.CalledProcessError(1, command)
        scan_path = command[command.index("scan") + 1].removeprefix("dir:")
        root = Path(kwargs["cwd"]) / scan_path
        source_name = command[command.index("--source-name") + 1] if "--source-name" in command else scan_path
        source_version = command[command.index("--source-version") + 1] if "--source-version" in command else ""
        config = json.loads((Path(kwargs["cwd"]) / command[command.index("-c") + 1]).read_text())
        files = [] if config.get("file", {}).get("metadata", {}).get("selection") == "none" else [
            {"name": str(root / "Cargo.lock"), "type": "file"}]
        packages = [{"id": str(index), "name": path.parent.name or "example", "version": "1.0.0",
                     "type": "rust-crate", "foundBy": "rust-cargo-lock-cataloger", "licenses": [],
                     "locations": [{"path": "/" + path.relative_to(root).as_posix()}]}
                    for index, path in enumerate(sorted(root.rglob("*"))) if path.is_file()]
        if empty:
            packages = []
        formats = {
            "syft-json": {"artifacts": packages, "source": {"name": source_name, "version": source_version,
                                                                         "metadata": {"path": scan_path}}},
            "spdx-json": {"spdxVersion": "SPDX-2.3", "name": source_name, "packages": [{"name": p["name"]} for p in packages]
                          + [{"name": "source-root", "primaryPackagePurpose": "FILE"}]},
            "cyclonedx-json": {"bomFormat": "CycloneDX", "metadata": {"component": {"name": source_name, "version": source_version}},
                              "components": [{"name": p["name"], "type": "library"} for p in packages]
                              + files},
        }
        for index, arg in enumerate(command):
            if arg == "-o":
                format_name, output = command[index + 1].split("=", 1)
                (Path(kwargs["cwd"]) / output).write_text(json.dumps(formats[format_name]))
        return SimpleNamespace(stdout="")

    monkeypatch.setattr(module.subprocess, "run", run)
    return calls


def test_inventory_retains_exact_inputs_and_explicit_declared_scope(tmp_path, monkeypatch):
    source, manifest = export_fixture(tmp_path, {"core/Cargo.lock": b"rust lock", "ui/package-lock.json": b"npm lock",
                                                "android/buildscript-gradle.lockfile": b"gradle lock"})
    module = inventory()
    monkeypatch.setenv("SYFT_JAVASCRIPT_INCLUDE_DEV_DEPENDENCIES", "false")
    monkeypatch.setenv("SYFT_ENRICH", "all")
    calls = scanner(monkeypatch, module)
    output = tmp_path / "inventory"
    record = module.create(source, output, "fixture-syft")
    assert record["source_commit"] == manifest["commit"]
    assert record["components"] == manifest["components"]
    assert "declared" in record["scope"] and "not" in record["status"]
    assert record["package_counts"]["total"] == 3
    assert len(record["unresolved_license_packages"]) == 3
    assert {item["path"]: item["sha256"] for item in record["inputs"]} == {
        item["path"]: item["sha256"] for item in manifest["files"]}
    gradle = next(item for item in record["inputs"] if item["path"].endswith("buildscript-gradle.lockfile"))
    assert gradle["scan_path"] == "android/gradle.lockfile-buildscript"
    assert (output / "scan-inputs" / gradle["scan_path"]).read_bytes() == b"gradle lock"
    config = json.loads((output / "syft-config.json").read_text())
    assert config["javascript"]["include-dev-dependencies"] is True
    assert config["enrich"] == [] and config["cache"]["dir"] == ""
    assert not config["check-for-app-update"]
    assert all(not any(name.startswith("SYFT_") for name in kwargs["env"]) for _, kwargs in calls)
    assert {p.name for p in output.iterdir()} >= {
        "source.syft.json", "source.spdx.json", "source.cyclonedx.json", "source-inventory.json", "SHA256SUMS.unsigned"}
    assert not (output / "release.lock.json").exists()
    for line in (output / "SHA256SUMS.unsigned").read_text().splitlines():
        digest, path = line.split("  ", 1)
        assert sha256(output / path) == digest


def test_changed_archive_lock_is_rejected_even_with_valid_outer_checksums(tmp_path, monkeypatch):
    source, _ = export_fixture(tmp_path, {"core/Cargo.lock": b"original"},
                               [("source/core/Cargo.lock", b"tampered", tarfile.REGTYPE)])
    module = inventory()
    scanner(monkeypatch, module)
    with pytest.raises(ValueError, match="lock"):
        module.create(source, tmp_path / "inventory", "scanner-must-not-run")
    assert not (tmp_path / "inventory").exists()


def test_private_output_parent_does_not_enter_inventory_metadata(tmp_path, monkeypatch):
    source, manifest = export_fixture(tmp_path)
    private_parent = tmp_path / "peakactivity-internal" / "private-build-folder"
    module = inventory()
    calls = scanner(monkeypatch, module)
    output = private_parent / "inventory"
    record = module.create(source, output, "fixture-syft")
    for name in ("source.syft.json", "source.spdx.json", "source.cyclonedx.json", "source-inventory.json"):
        assert "peakactivity-internal" not in (output / name).read_text()
        assert str(private_parent) not in (output / name).read_text()
    command = next(command for command, _ in calls if "scan" in command)
    assert command[command.index("--source-name") + 1] == "peakactivity-source"
    assert command[command.index("--source-version") + 1] == manifest["commit"]
    assert command[command.index("scan") + 1] == "dir:scan-inputs"
    assert record["scan_command"] == [Path(command[0]).name, *command[1:]]
    assert not any(str(private_parent) in argument for command, _ in calls for argument in command)


@pytest.mark.parametrize("members", [
    [("source/core/Cargo.lock", b"one", tarfile.REGTYPE), ("source/core/Cargo.lock", b"two", tarfile.REGTYPE)],
    [("source/../Cargo.lock", b"unsafe", tarfile.REGTYPE)],
    [("source/core/Cargo.lock", b"", tarfile.SYMTYPE)],
    [("source/core/Cargo.lock", b"", tarfile.LNKTYPE)],
    [("source/core", b"", tarfile.SYMTYPE), ("source/core/Cargo.lock", b"lock", tarfile.REGTYPE)],
])
def test_inventory_rejects_ambiguous_or_unsafe_archive_members(tmp_path, members):
    source, _ = export_fixture(tmp_path, {"core/Cargo.lock": b"one"}, members)
    module = inventory()
    with pytest.raises(ValueError):
        module.create(source, tmp_path / "inventory", "scanner-must-not-run")
    assert not (tmp_path / "inventory").exists()


@pytest.mark.parametrize("empty,fail", [(True, False), (False, True)])
def test_empty_or_failed_scanner_never_leaves_success_evidence(tmp_path, monkeypatch, empty, fail):
    source, _ = export_fixture(tmp_path)
    module = inventory()
    scanner(monkeypatch, module, empty=empty, fail=fail)
    with pytest.raises((ValueError, subprocess.CalledProcessError)):
        module.create(source, tmp_path / "inventory", "fixture-syft")
    assert not (tmp_path / "inventory").exists()


def test_scanner_cannot_change_the_retained_lock_inputs(tmp_path, monkeypatch):
    source, _ = export_fixture(tmp_path)
    module = inventory()
    scanner(monkeypatch, module)
    original = module.subprocess.run

    def change_input(command, **kwargs):
        result = original(command, **kwargs)
        if "scan" in command:
            root = Path(kwargs["cwd"]) / command[command.index("scan") + 1].removeprefix("dir:")
            (root / "core/Cargo.lock").write_bytes(b"changed while scanning")
        return result

    monkeypatch.setattr(module.subprocess, "run", change_input)
    with pytest.raises(ValueError, match="lock"):
        module.create(source, tmp_path / "inventory", "fixture-syft")
    assert not (tmp_path / "inventory").exists()


def test_existing_output_and_missing_lock_are_rejected(tmp_path):
    source, _ = export_fixture(tmp_path, {"README.md": b"no locked dependencies"})
    module = inventory()
    with pytest.raises(ValueError, match="lock"):
        module.create(source, tmp_path / "inventory", "scanner-must-not-run")
    output = tmp_path / "existing"
    output.mkdir()
    (output / "preserved").write_text("existing evidence")
    with pytest.raises(ValueError, match="output"):
        module.create(source, output, "scanner-must-not-run")
    assert (output / "preserved").read_text() == "existing evidence"
