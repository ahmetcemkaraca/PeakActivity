import importlib.util
import json
from pathlib import Path
import subprocess
import sys

import pytest
from test_build_helper_evidence import recorded_helper

spec = importlib.util.spec_from_file_location("stage_helpers", Path(__file__).parents[1] / "package/stage_helpers.py")
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


def sources(tmp_path):
    result = {}
    for name in ("aw-watcher-window", "aw-watcher-afk"):
        path = tmp_path / name
        path.mkdir()
        binary = path / name
        binary.write_text("#!/bin/sh\nexit 0\n")
        binary.chmod(0o755)
        result[name] = path
    return result


def test_rejects_qt_and_escape_before_creating_output(tmp_path):
    inputs = sources(tmp_path)
    prohibited = inputs["aw-watcher-afk"] / "PyQt6"
    prohibited.mkdir()
    output = tmp_path / "output"
    with pytest.raises(ValueError, match="prohibited"):
        helpers.stage(inputs, output, "macos")
    assert not output.exists()
    prohibited.rmdir()
    (inputs["aw-watcher-afk"] / "leak").symlink_to(tmp_path / "outside")
    with pytest.raises(ValueError, match="symlink"):
        helpers.stage(inputs, output, "macos")
    assert not output.exists()


def test_stage_binds_resources_and_requires_wayland_helper_on_linux(tmp_path):
    entries = {name: recorded_helper(tmp_path, name) for name in ("aw-watcher-window", "aw-watcher-afk")}
    inputs = {name: entry[0] for name, entry in entries.items()}
    records = {name: entry[1] for name, entry in entries.items()}
    commits = {name: entry[2]["sources"]["collector"]["commit"] for name, entry in entries.items()}
    client_commit = next(iter(entries.values()))[2]["sources"]["client"]["commit"]
    output = tmp_path / "output"
    with pytest.raises(ValueError, match="helper set"):
        helpers.stage(inputs, output, "linux")
    manifest = helpers.stage(inputs, output, "macos", records, "x86_64", commits, client_commit)
    assert sum("sha256" in item for item in manifest["files"]) == 2
    config = json.loads((output / "tauri-resources.json").read_text())
    assert config["bundle"]["resources"] == {str(output / "modules") + "/": "modules/"}
    assert (output / "evidence/aw-watcher-afk/helper-build-record.json").is_file()
    assert not list((output / "modules").rglob("helper-build-record.json"))
    with pytest.raises(ValueError, match="exists"):
        helpers.stage(inputs, output, "macos")


@pytest.mark.parametrize("mutation", ["bytes", "mode", "source", "symlink"])
def test_staging_rejects_package_and_source_tampering(tmp_path, mutation):
    entries = {name: recorded_helper(tmp_path, name) for name in ("aw-watcher-window", "aw-watcher-afk")}
    package, directory, record = entries["aw-watcher-afk"]
    if mutation == "bytes":
        (package / "aw-watcher-afk").write_bytes(b"changed")
    elif mutation == "mode":
        (package / "aw-watcher-afk").chmod(0o744)
    elif mutation == "source":
        (directory / "client-source/source.tar.gz").write_bytes(b"changed source")
    else:
        (package / "unrecorded-link").symlink_to("aw-watcher-afk")
    output = tmp_path / "output"
    with pytest.raises(ValueError):
        helpers.stage({name: entry[0] for name, entry in entries.items()}, output, "macos",
                      {name: entry[1] for name, entry in entries.items()}, "x86_64",
                      {name: entry[2]["sources"]["collector"]["commit"] for name, entry in entries.items()},
                      record["sources"]["client"]["commit"])
    assert not output.exists()


def test_staging_rejects_change_while_copying_and_has_no_partial_output(tmp_path, monkeypatch):
    entries = {name: recorded_helper(tmp_path, name) for name in ("aw-watcher-window", "aw-watcher-afk")}
    original = helpers.shutil.copytree

    def tamper(source, destination, *args, **kwargs):
        result = original(source, destination, *args, **kwargs)
        if source == entries["aw-watcher-afk"][0]:
            (destination / "aw-watcher-afk").write_bytes(b"tampered copied helper")
        return result

    monkeypatch.setattr(helpers.shutil, "copytree", tamper)
    output = tmp_path / "output"
    with pytest.raises(ValueError, match="during staging"):
        helpers.stage({name: entry[0] for name, entry in entries.items()}, output, "macos",
                      {name: entry[1] for name, entry in entries.items()}, "x86_64",
                      {name: entry[2]["sources"]["collector"]["commit"] for name, entry in entries.items()},
                      entries["aw-watcher-afk"][2]["sources"]["client"]["commit"])
    assert not output.exists()


def test_staging_cli_from_an_unrelated_working_directory(tmp_path):
    entries = {name: recorded_helper(tmp_path, name) for name in ("aw-watcher-window", "aw-watcher-afk")}
    command = [sys.executable, str(Path(helpers.__file__)), "--platform", "macos", "--architecture", "x86_64",
               "--client-commit", entries["aw-watcher-afk"][2]["sources"]["client"]["commit"], "--output", str(tmp_path / "output")]
    for name, (package, directory, record) in entries.items():
        command.extend(["--helper", f"{name}={package}", "--record", f"{name}={directory}",
                        "--source", f"{name}={record['sources']['collector']['commit']}"])
    result = subprocess.run(command, cwd=tmp_path, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr


def test_staged_helper_changed_during_evidence_copy_is_rejected(tmp_path, monkeypatch):
    entries = {name: recorded_helper(tmp_path, name) for name in ("aw-watcher-window", "aw-watcher-afk")}
    original = helpers.shutil.copytree

    def tamper(source, destination, *args, **kwargs):
        result = original(source, destination, *args, **kwargs)
        if source == entries["aw-watcher-afk"][1]:
            window = destination.parent.parent / "modules/aw-watcher-window/aw-watcher-window"
            window.write_bytes(b"late mutation after first helper verification")
        return result

    monkeypatch.setattr(helpers.shutil, "copytree", tamper)
    output = tmp_path / "output"
    with pytest.raises(ValueError, match="during staging"):
        helpers.stage({name: entry[0] for name, entry in entries.items()}, output, "macos",
                      {name: entry[1] for name, entry in entries.items()}, "x86_64",
                      {name: entry[2]["sources"]["collector"]["commit"] for name, entry in entries.items()},
                      entries["aw-watcher-afk"][2]["sources"]["client"]["commit"])
    assert not output.exists()


def test_unrecorded_helpers_are_rejected(tmp_path):
    output = tmp_path / "unrecorded"
    with pytest.raises(ValueError, match="evidence"):
        helpers.stage(sources(tmp_path), output, "macos")
    assert not output.exists()


def test_inventory_detects_mode_only_changes_and_directory_links(tmp_path):
    root = tmp_path / "tree"
    (root / "data").mkdir(parents=True)
    (root / "data/content").write_bytes(b"same bytes")
    (root / "alias").symlink_to("data", target_is_directory=True)
    before = helpers.inventory(root)
    (root / "data/content").chmod(0o755)
    assert before != helpers.inventory(root)
    assert any(item.get("symlink") == "data" for item in before)


def test_inventory_rejects_a_symlink_parent(tmp_path):
    source = tmp_path / "source"
    source.mkdir()
    (source / "binary").write_bytes(b"bytes")
    (tmp_path / "alias").symlink_to(source, target_is_directory=True)
    with pytest.raises(ValueError, match="symlink"):
        helpers.inventory(tmp_path / "alias/binary")
