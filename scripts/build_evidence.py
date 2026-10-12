"""Run a build between verified source snapshots and record its fresh artifacts.

The record is unsigned local evidence, not a hermetic build attestation. Run this
inside a reviewed clean builder; environment and dependency trust remain separate.
"""
import argparse
import hashlib
import json
import os
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from export_source import export, safe_path
from release_evidence import sha256, source_inputs


def check_worktree(root, manifest):
    # Git status can hide assume-unchanged files; compare the bytes the compiler reads.
    for item in manifest["files"]:
        path = root / item["path"]
        if not path.resolve().is_relative_to(root):
            raise ValueError("worktree path escapes source")
        if item["mode"] == "120000":
            digest = hashlib.sha256(os.readlink(path).encode()).hexdigest()
        else:
            digest = sha256(path)
            if os.name != "nt" and bool(path.stat().st_mode & 0o100) != (item["mode"] == "100755"):
                raise ValueError("worktree executable mode differs from source")
        if digest != item["sha256"]:
            raise ValueError("worktree bytes differ from exported source")


def build(root, artifacts, output, command):
    root, output = root.resolve(), output.resolve()
    if output.exists() or output.is_relative_to(root):
        raise ValueError("output must be new and outside source")
    if not command or not artifacts or any(not safe_path(name) for name in artifacts):
        raise ValueError("command and relative artifact paths are required")
    paths = [root / name for name in artifacts]
    if len({path.name for path in paths}) != len(paths):
        raise ValueError("artifact names must be unique")
    for path in paths:
        if path.exists() or path.resolve() != path:
            raise ValueError("artifact must not exist and must stay inside source")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".build-evidence-", dir=output.parent) as temporary:
        staging = Path(temporary)
        before = export(root, staging / "source")
        check_worktree(root, before)
        started = datetime.now(timezone.utc).isoformat()
        subprocess.run(command, cwd=root, check=True)
        after = export(root, staging / "after")
        check_worktree(root, after)
        if before != after:
            raise ValueError("source changed during build")
        _, sums = source_inputs(staging / "source")
        evidence = []
        for name, path in zip(artifacts, paths):
            if path.resolve() != path:
                raise ValueError("artifact path changed or uses a symlink")
            evidence.append({"path": name, "name": path.name, "sha256": sha256(path)})
        record = {
            "schema_version": 1, "source_commit": before["commit"],
            "source": sums, "components": before["components"],
            "command": command, "started_at": started,
            "finished_at": datetime.now(timezone.utc).isoformat(),
            "source_unchanged": True, "artifacts": evidence,
            "status": "unsigned local build record; requires independent builder review",
        }
        (staging / "build-record.json").write_text(json.dumps(record, indent=2, sort_keys=True) + "\n")
        # The second export is comparison evidence; retain it for independent inspection.
        staging.rename(output)
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--artifact", action="append", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ["--"] else args.command
    try:
        record = build(args.root, args.artifact, args.output, command)
    except (OSError, ValueError, subprocess.CalledProcessError):
        parser.exit(1, "Build evidence rejected: build failed, inputs changed or artifacts were not fresh.\n")
    print(json.dumps({"source_commit": record["source_commit"], "artifacts": len(record["artifacts"]), "status": record["status"]}))


if __name__ == "__main__":
    main()
