import hashlib
import importlib.util
import json
import subprocess
import tarfile
from pathlib import Path

import pytest


spec = importlib.util.spec_from_file_location("export_source", Path(__file__).parents[1] / "export_source.py")
exporter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(exporter)


def git(root, *args):
    return subprocess.check_output(["git", "-C", str(root), *args], stderr=subprocess.DEVNULL).decode().strip()


@pytest.fixture
def source(tmp_path):
    root = tmp_path / "source"
    root.mkdir()
    git(root, "init", "-q")
    git(root, "config", "user.name", "Export Test")
    git(root, "config", "user.email", "test@example.invalid")
    (root / "README.md").write_text("Synthetic source\n")
    (root / ".gitignore").write_text("cache/\n")
    git(root, "add", ".")
    git(root, "commit", "-qm", "source")
    return root


def test_export_is_deterministic_and_excludes_ignored_bytes(source, tmp_path):
    (source / "cache").mkdir()
    (source / "cache/private.txt").write_text("not source")
    first, second = tmp_path / "one", tmp_path / "two"
    exporter.export(source, first)
    exporter.export(source, second)
    assert (first / "source.tar.gz").read_bytes() == (second / "source.tar.gz").read_bytes()
    manifest = json.loads((first / "source-manifest.json").read_text())
    assert {item["path"] for item in manifest["files"]} == {"README.md", ".gitignore"}
    with tarfile.open(first / "source.tar.gz") as archive:
        for item in manifest["files"]:
            assert hashlib.sha256(archive.extractfile("source/" + item["path"]).read()).hexdigest() == item["sha256"]


def test_export_rejects_dirty_checkout_without_output(source, tmp_path):
    (source / "README.md").write_text("modified")
    output = tmp_path / "export"
    with pytest.raises(ValueError, match="dirty"):
        exporter.export(source, output)
    assert not output.exists()


def test_export_rejects_external_symlink_and_existing_output(source, tmp_path):
    (source / "link").symlink_to("../../outside")
    git(source, "add", "link")
    git(source, "commit", "-qm", "unsafe link")
    with pytest.raises(ValueError, match="symlink"):
        exporter.export(source, tmp_path / "export")
    with pytest.raises(ValueError, match="output"):
        exporter.export(source, source)


def test_missing_submodule_never_exports_incomplete_source(source, tmp_path):
    (source / ".gitmodules").write_text('[submodule "module"]\npath = module\nurl = https://github.com/example/module.git\n')
    git(source, "add", ".gitmodules")
    git(source, "update-index", "--add", "--cacheinfo", "160000", git(source, "rev-parse", "HEAD"), "module")
    git(source, "commit", "-qm", "module")
    with pytest.raises(ValueError):
        exporter.export(source, tmp_path / "export")
