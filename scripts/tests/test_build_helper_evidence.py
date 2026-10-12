"""Bounded synthetic packaging checks; never start a collector."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from types import SimpleNamespace
import zipfile

import pytest

sys.path.insert(0, str(Path(__file__).parents[1] / "package"))
import build_helper_evidence as builder


def repository(path, files):
    path.mkdir()
    (path / ".gitignore").write_text("build/\ndist/\ntarget/\n")
    for name, data in files.items():
        target = path / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(data)
    subprocess.run(["git", "init", "-q", str(path)], check=True)
    subprocess.run(["git", "-C", str(path), "add", "."], check=True)
    subprocess.run(["git", "-C", str(path), "-c", "user.name=Fixture", "-c",
                    "user.email=fixture@example.invalid", "commit", "-qm", "fixture"], check=True,
                   env={**os.environ, "GIT_AUTHOR_DATE": "2026-10-12T00:00:00Z", "GIT_COMMITTER_DATE": "2026-10-12T00:00:00Z"})
    return path


@pytest.fixture
def inputs(tmp_path, monkeypatch):
    collector = repository(tmp_path / "aw-watcher-afk", {"aw_watcher_afk/afk.py": "# collector\n"})
    client = repository(tmp_path / "aw-client", {"aw_client/client.py": "# client\n",
                                                "aw_client/capture.py": "# capture\n"})
    sdk = tmp_path / "site/aw_client"
    sdk.mkdir(parents=True)
    for path in (client / "aw_client").glob("*.py"):
        (sdk / path.name).write_bytes(path.read_bytes())
    monkeypatch.setattr(builder.metadata, "distribution", lambda _: SimpleNamespace(locate_file=lambda _: sdk))
    monkeypatch.setattr(builder.metadata, "version", lambda _: "6.11.0")
    monkeypatch.setattr(builder, "installed_environment", lambda: ({"scope": "synthetic installed build environment", "distributions": []}, {}))
    real_run = subprocess.run

    def package(command, **kwargs):
        if "PyInstaller" not in command:
            return real_run(command, **kwargs)
        directory = collector / "dist/aw-watcher-afk"
        directory.mkdir(parents=True)
        binary = directory / "aw-watcher-afk"
        binary.write_bytes(b"synthetic fresh executable")
        binary.chmod(0o755)
        return SimpleNamespace(returncode=0)

    monkeypatch.setattr(builder.subprocess, "run", package)
    modules = [{"name": name, "kind": "PYMODULE", "archive": "PYZ-00.pyz", "sha256": "1" * 64,
                "input_path": str(path)} for name, path in [
                    ("aw_client.client", sdk / "client.py"), ("aw_client.capture", sdk / "capture.py"),
                    ("aw_watcher_afk.afk", collector / "aw_watcher_afk/afk.py")]]
    monkeypatch.setattr(builder, "pyinstaller_modules", lambda *_: (json.loads(json.dumps(modules)), {name: "2" * 64 for name in builder.FREEZER_TOCS}))
    return collector, client, sdk, modules


def produce(inputs, tmp_path):
    collector, client, _, _ = inputs
    return builder.produce(collector, client, "aw-watcher-afk", tmp_path / "evidence",
                           builder.platform_name(), builder.host.machine())


def test_same_build_binds_sources_sdk_and_fresh_package(inputs, tmp_path):
    result = produce(inputs, tmp_path)
    package = inputs[0] / "dist/aw-watcher-afk"
    assert result["files"] == builder.inventory(package)
    assert {module["input"]["scope"] for module in result["included_modules"]} == {"collector", "client"}
    builder.verify_record(tmp_path / "evidence", package, "aw-watcher-afk", result["platform"],
                          result["architecture"], result["sources"]["collector"]["commit"],
                          result["sources"]["client"]["commit"])


def test_same_version_sdk_with_wrong_bytes_is_rejected_before_packaging(inputs, tmp_path):
    (inputs[2] / "capture.py").write_text("# unrelated registry client, same version\n")
    with pytest.raises(ValueError, match="SDK bytes"):
        produce(inputs, tmp_path)
    assert not (inputs[0] / "dist").exists()
    assert not (tmp_path / "evidence").exists()


@pytest.mark.parametrize("stale", ["dist/aw-watcher-afk", "build/aw-watcher-afk"])
def test_stale_package_or_freezer_toc_is_rejected(inputs, tmp_path, stale):
    target = inputs[0] / stale
    target.mkdir(parents=True)
    (target / "old.toc").write_text("stale")
    with pytest.raises(ValueError, match="fresh"):
        produce(inputs, tmp_path)
    assert (target / "old.toc").read_text() == "stale"


def test_planned_sdk_module_missing_from_actual_archive_is_rejected(inputs, tmp_path):
    inputs[3].pop(1)
    with pytest.raises(ValueError, match="missing from actual package"):
        produce(inputs, tmp_path)
    assert not (tmp_path / "evidence").exists()


def test_generated_bootstrap_bytecode_is_distinct_from_selected_source(inputs, tmp_path):
    generated = inputs[0] / "build/aw-watcher-afk/localpycs/struct.pyc"
    real_package = builder.subprocess.run

    def package(command, **kwargs):
        result = real_package(command, **kwargs)
        if "PyInstaller" in command:
            generated.parent.mkdir(parents=True)
            generated.write_bytes(b"synthetic generated bootstrap bytecode")
        return result

    inputs[3].append({"name": "struct", "kind": "PYMODULE", "archive": "executable",
                      "sha256": "3" * 64, "input_path": str(generated)})
    builder.subprocess.run = package
    try:
        result = produce(inputs, tmp_path)
    finally:
        builder.subprocess.run = real_package
    assert result["included_modules"][-1]["input"]["scope"] == "generated-freezer-bytecode"


def test_untracked_collector_code_is_not_accepted_as_generated_bytecode(inputs, tmp_path):
    untracked = inputs[0] / "ignored.py"
    untracked.write_text("# arbitrary outside selected source\n")
    inputs[3][2]["input_path"] = str(untracked)
    # Hide the file from Git status without changing its bytes read by the freezer.
    (inputs[0] / ".git/info/exclude").write_text("ignored.py\n")
    with pytest.raises(ValueError, match="selected source"):
        produce(inputs, tmp_path)


def test_binary_changed_after_archive_inspection_cannot_keep_old_module_evidence(inputs, tmp_path, monkeypatch):
    original = builder.pyinstaller_modules

    def inspect(binary, *args):
        result = original(binary, *args)
        binary.write_bytes(b"replacement after module inspection")
        return result

    monkeypatch.setattr(builder, "pyinstaller_modules", inspect)
    with pytest.raises(ValueError, match="package changed"):
        produce(inputs, tmp_path)
    assert not (tmp_path / "evidence").exists()


def test_platform_or_architecture_mismatch_is_rejected(inputs, tmp_path):
    with pytest.raises(ValueError, match="architecture"):
        builder.produce(inputs[0], inputs[1], "aw-watcher-afk", tmp_path / "evidence",
                        builder.platform_name(), "unrelated-target")


def test_freezer_toc_does_not_execute_python(tmp_path):
    marker = tmp_path / "executed"
    toc = tmp_path / "Analysis-00.toc"
    toc.write_text(f"__import__('pathlib').Path({str(marker)!r}).touch()")
    with pytest.raises(ValueError):
        builder.toc(toc, 19)
    assert not marker.exists()


def test_actual_embedded_module_is_checked_when_not_visible_in_package(tmp_path, monkeypatch):
    work, dist = tmp_path / "work", tmp_path / "dist"
    work.mkdir()
    dist.mkdir()
    analysis = [None] * 19
    for index in (13, 14, 15, 18):
        analysis[index] = []
    (work / "Analysis-00.toc").write_text(repr(tuple(analysis)))
    (work / "PYZ-00.toc").write_text(repr(("archive", [])))
    pkg = [None] * 11
    pkg[2] = []
    (work / "PKG-00.toc").write_text(repr(tuple(pkg)))
    (work / "COLLECT-00.toc").write_text(repr(([],)))
    with zipfile.ZipFile(dist / "base_library.zip", "w") as library:
        library.writestr("encodings.pyc", b"synthetic bytecode")
    binary = dist / "aw-watcher-afk"
    binary.write_bytes(b"opaque binary without prohibited visible filename")
    archive = SimpleNamespace(toc={"PYZ-00.pyz": (0, 0, 0, 0, "z")},
                              open_embedded_archive=lambda _: SimpleNamespace(toc={"PyQt6.QtCore": (0, 0, 0)},
                                                                              extract=lambda *_, **__: b"hidden bytecode"))
    readers = SimpleNamespace(CArchiveReader=lambda _: archive)
    monkeypatch.setitem(sys.modules, "PyInstaller.archive.readers", readers)
    with pytest.raises(ValueError, match="prohibited included module"):
        builder.pyinstaller_modules(binary, dist, work)


def test_native_helper_has_locked_cargo_record_without_freezer_claims(tmp_path, monkeypatch):
    collector = repository(tmp_path / "awatcher", {"Cargo.toml": "# synthetic cargo source\n", "Cargo.lock": "# synthetic locked declarations\n"})
    real_run = subprocess.run

    def cargo(command, **kwargs):
        if command[:2] == ["cargo", "--version"]:
            return SimpleNamespace(stdout="cargo synthetic-version\n")
        if command[:2] == ["rustc", "-vV"]:
            return SimpleNamespace(stdout="rustc synthetic-version\nhost: synthetic-host-target\n")
        if command[:2] == ["cargo", "build"]:
            binary = collector / "target/release/awatcher"
            binary.parent.mkdir(parents=True)
            binary.write_bytes(b"synthetic native helper")
            binary.chmod(0o755)
            return SimpleNamespace(returncode=0)
        return real_run(command, **kwargs)

    monkeypatch.setattr(builder.subprocess, "run", cargo)
    monkeypatch.delenv("CARGO_BUILD_TARGET", raising=False)
    result = builder.produce(collector, None, "aw-awatcher", tmp_path / "evidence", "linux", builder.host.machine())
    assert result["included_modules"] == []
    assert result["freezer_inputs"] == {}
    assert result["files"][0]["path"] == "aw-awatcher"
    assert result["environment"]["target"] == "synthetic-host-target"
    assert "native" in result["limitations"][-1].lower()


def recorded_helper(root, name, platform="macos"):
    """Synthetic record producer for staging fixtures, separate from real builds."""
    base = root / name
    base.mkdir()
    package = base / "package"
    package.mkdir()
    executable = package / name
    executable.write_bytes(b"synthetic staged helper")
    executable.chmod(0o755)
    entry = "aw_watcher_window.main" if name == "aw-watcher-window" else "aw_watcher_afk.afk"
    collector_path = entry.replace(".", "/") + ".py"
    collector = repository(base / "collector", {collector_path: "# selected collector\n"})
    client = repository(base / "client", {"aw_client/capture.py": "# selected SDK\n", "aw_client/client.py": "# selected client\n"})
    evidence = base / "evidence"
    evidence.mkdir()
    sources = {}
    for key, path in (("collector", collector), ("client", client)):
        manifest = builder.export(path, evidence / (key + "-source"))
        builder.export(path, evidence / (key + "-after"))
        sources[key] = {"commit": manifest["commit"], "components": manifest["components"],
                        "source": builder.source_inputs(evidence / (key + "-source"))[1]}
    record = {"schema_version": 1, "helper": name, "platform": platform, "architecture": "x86_64",
              "package_kind": "pyinstaller-onedir", "sources": sources, "command": ["synthetic-fixture"],
              "started_at": "2026-10-12T00:00:00+00:00", "finished_at": "2026-10-12T00:00:01+00:00",
              "source_unchanged": True, "environment": {"scope": "synthetic fixture, not shipping evidence"},
              "included_modules": [{"name": module, "kind": "PYMODULE", "archive": "PYZ-00.pyz", "sha256": "1" * 64,
                                    "input": {"scope": scope, "path": path,
                                              "sha256": builder.sha256((client if scope == "client" else collector) / path)}}
                                   for module, scope, path in (("aw_client.client", "client", "aw_client/client.py"),
                                                              ("aw_client.capture", "client", "aw_client/capture.py"),
                                                              (entry, "collector", collector_path))],
              "freezer_inputs": {name: "2" * 64 for name in builder.FREEZER_TOCS}, "files": builder.inventory(package),
              "status": builder.STATUS, "limitations": ["synthetic fixture"]}
    (evidence / "helper-build-record.json").write_text(json.dumps(record))
    return package, evidence, record
