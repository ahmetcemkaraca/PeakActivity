import importlib.util
import json
from pathlib import Path

import pytest

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
    inputs = sources(tmp_path)
    output = tmp_path / "output"
    with pytest.raises(ValueError, match="helper set"):
        helpers.stage(inputs, output, "linux")
    manifest = helpers.stage(inputs, output, "macos")
    assert len(manifest["files"]) == 2
    config = json.loads((output / "tauri-resources.json").read_text())
    assert config["bundle"]["resources"] == {str(output / "modules") + "/": "modules/"}
    with pytest.raises(ValueError, match="exists"):
        helpers.stage(inputs, output, "macos")
