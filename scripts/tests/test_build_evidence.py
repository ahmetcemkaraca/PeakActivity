"""Real subprocess checks for source/artifact binding, using only synthetic inputs."""
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parents[1]))
import build_evidence
import release_evidence


@pytest.fixture
def source(tmp_path):
    root = tmp_path / "checkout"
    root.mkdir()
    subprocess.run(["git", "init", "-q", str(root)], check=True)
    (root / ".gitignore").write_text("build/\n")
    (root / "input.txt").write_text("synthetic input\n")
    (root / "build.py").write_text(
        "from pathlib import Path\n"
        "Path('build').mkdir(exist_ok=True)\n"
        "Path('build/app').write_bytes(Path('input.txt').read_bytes())\n"
    )
    subprocess.run(["git", "-C", str(root), "add", "."], check=True)
    subprocess.run(["git", "-C", str(root), "-c", "user.name=Build Test",
                    "-c", "user.email=build@example.invalid", "commit", "-qm", "source"], check=True)
    return root


def test_build_binds_fresh_artifact_and_rejects_later_tampering(source, tmp_path):
    output = tmp_path / "evidence"
    result = build_evidence.build(source, ["build/app"], output, [sys.executable, "build.py"])
    assert result["artifacts"][0]["sha256"] == release_evidence.sha256(source / "build/app")
    manifest, sums = release_evidence.source_inputs(output / "source")
    assert result["source"] == sums
    assert result["source_commit"] == manifest["commit"]
    record = output / "build-record.json"
    assert json.loads(record.read_text()) == result
    release_evidence.check_build_record(record, manifest, sums, [source / "build/app"])
    (source / "build/app").write_bytes(b"different binary")
    with pytest.raises(ValueError, match="artifact"):
        release_evidence.check_build_record(record, manifest, sums, [source / "build/app"])


def test_build_rejects_stale_artifact_before_running_command(source, tmp_path):
    (source / "build").mkdir()
    (source / "build/app").write_bytes(b"stale")
    with pytest.raises(ValueError, match="exist"):
        build_evidence.build(source, ["build/app"], tmp_path / "evidence", [sys.executable, "build.py"])
    assert (source / "build/app").read_bytes() == b"stale"
    assert not (tmp_path / "evidence").exists()


def test_build_rejects_source_changed_during_build(source, tmp_path):
    command = [sys.executable, "-c", "exec(open('build.py').read()); open('input.txt', 'w').write('changed')"]
    with pytest.raises(ValueError):
        build_evidence.build(source, ["build/app"], tmp_path / "evidence", command)
    assert not (tmp_path / "evidence").exists()


def test_build_rejects_hidden_worktree_change(source, tmp_path):
    subprocess.run(["git", "-C", str(source), "update-index", "--assume-unchanged", "input.txt"], check=True)
    (source / "input.txt").write_bytes(b"not the exported source")
    with pytest.raises(ValueError, match="worktree"):
        build_evidence.build(source, ["build/app"], tmp_path / "evidence", [sys.executable, "build.py"])
    assert not (source / "build/app").exists()


def test_failed_build_has_no_evidence(source, tmp_path):
    with pytest.raises(subprocess.CalledProcessError):
        build_evidence.build(source, ["build/app"], tmp_path / "evidence", [sys.executable, "-c", "raise SystemExit(3)"])
    assert not (tmp_path / "evidence").exists()


def test_build_record_rejects_unrecognized_content(source, tmp_path):
    output = tmp_path / "evidence"
    record = build_evidence.build(source, ["build/app"], output, [sys.executable, "build.py"])
    manifest, sums = release_evidence.source_inputs(output / "source")
    record["unexpected_environment"] = "must not be copied into release output"
    path = output / "build-record.json"
    path.write_text(json.dumps(record))
    with pytest.raises(ValueError, match="build record"):
        release_evidence.check_build_record(path, manifest, sums, [source / "build/app"])


@pytest.mark.skipif(os.name == "nt", reason="POSIX symlink permissions")
def test_build_rejects_old_artifact_through_a_new_directory_symlink(source, tmp_path):
    (source / "build/old").mkdir(parents=True)
    (source / "build/old/app").write_bytes(b"old artifact")
    command = [sys.executable, "-c", "from pathlib import Path; Path('build/linked').symlink_to('old', target_is_directory=True)"]
    with pytest.raises(ValueError, match="artifact"):
        build_evidence.build(source, ["build/linked/app"], tmp_path / "evidence", command)
    assert not (tmp_path / "evidence").exists()


@pytest.mark.skipif(os.name == "nt", reason="POSIX executable mode")
def test_build_rejects_hidden_owner_executable_mode_change(source, tmp_path):
    tool = source / "tool.sh"
    tool.write_text("#!/bin/sh\nexit 0\n")
    tool.chmod(0o755)
    subprocess.run(["git", "-C", str(source), "add", "tool.sh"], check=True)
    subprocess.run(["git", "-C", str(source), "-c", "user.name=Build Test",
                    "-c", "user.email=build@example.invalid", "commit", "-qm", "executable"], check=True)
    subprocess.run(["git", "-C", str(source), "update-index", "--assume-unchanged", "tool.sh"], check=True)
    tool.chmod(0o645)
    with pytest.raises(ValueError, match="executable mode"):
        build_evidence.build(source, ["build/app"], tmp_path / "evidence", [sys.executable, "build.py"])
    assert not (source / "build/app").exists()


@pytest.mark.parametrize("field,value", [
    ("started_at", None),
    ("finished_at", {"invalid": True}),
    ("started_at", "2026-10-12T12:00:00"),
    ("finished_at", "2000-01-01T00:00:00+00:00"),
])
def test_build_record_rejects_invalid_timestamps(source, tmp_path, field, value):
    output = tmp_path / "evidence"
    record = build_evidence.build(source, ["build/app"], output, [sys.executable, "build.py"])
    manifest, sums = release_evidence.source_inputs(output / "source")
    record[field] = value
    path = output / "build-record.json"
    path.write_text(json.dumps(record))
    with pytest.raises(ValueError, match="build record"):
        release_evidence.check_build_record(path, manifest, sums, [source / "build/app"])


@pytest.mark.parametrize("artifact_path", ["../../outside", "build/unrelated"])
def test_build_record_rejects_invalid_artifact_paths(source, tmp_path, artifact_path):
    output = tmp_path / "evidence"
    record = build_evidence.build(source, ["build/app"], output, [sys.executable, "build.py"])
    manifest, sums = release_evidence.source_inputs(output / "source")
    record["artifacts"][0]["path"] = artifact_path
    path = output / "build-record.json"
    path.write_text(json.dumps(record))
    with pytest.raises(ValueError, match="build record"):
        release_evidence.check_build_record(path, manifest, sums, [source / "build/app"])
