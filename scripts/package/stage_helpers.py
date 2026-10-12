"""Stage only supported capture helpers as native Tauri resources."""
import argparse
import hashlib
import json
import os
import re
import shutil
import stat
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


HELPERS = {"aw-watcher-afk", "aw-watcher-window", "aw-awatcher"}
PROHIBITED = re.compile(
    r"(?:^|/)(?:pyqt\d*|pyside\d*|aw-qt|aw-sync|aw-notify|aw-watcher-input|"
    r"llama_cpp|llama\.cpp|ollama|transformers|torch|tensorflow)(?:[/.\-_]|$)|"
    r"\.(?:gguf|ggml|onnx|safetensors|tflite|ckpt|pth)$", re.I
)


def inventory(root, filename=None):
    from export_source import safe_path
    root = root.absolute()
    if root.resolve() != root or root.is_symlink():
        raise ValueError("helper input uses a symlink parent")
    if not root.exists():
        raise ValueError("missing helper input")
    files = []
    paths = [root, *sorted(root.rglob("*"))] if root.is_dir() else [root]
    for path in paths:
        relative = path.relative_to(root).as_posix() if root.is_dir() else (filename or root.name)
        if relative != "." and not safe_path(relative):
            raise ValueError("unsafe helper path")
        if PROHIBITED.search(relative):
            raise ValueError("prohibited package content")
        if path.is_symlink():
            target = os.readlink(path)
            if (Path(target).is_absolute() or "\\" in target or any(ord(char) < 32 for char in target)
                    or not path.resolve().is_relative_to(root)
                    or not path.exists()):
                raise ValueError("unsafe helper symlink")
            files.append({"path": relative, "symlink": target})
        elif path.is_file():
            with path.open("rb") as stream:
                files.append({"path": relative, "sha256": hashlib.file_digest(stream, "sha256").hexdigest(),
                              "mode": stat.S_IMODE(path.stat().st_mode)})
        elif path.is_dir():
            files.append({"path": relative, "directory": True, "mode": stat.S_IMODE(path.stat().st_mode)})
        else:
            raise ValueError("unsupported helper file type")
    return files


def stage(helpers, output, platform, records=None, architecture=None, source_commits=None, client_commit=None):
    if platform not in {"linux", "macos", "windows"}:
        raise ValueError("unknown helper platform")
    required = HELPERS if platform == "linux" else HELPERS - {"aw-awatcher"}
    if set(helpers) != required:
        raise ValueError("exact platform helper set is required")
    if output.exists() or output.is_symlink() or output.absolute().resolve() != output.absolute():
        raise ValueError("output already exists; choose a new staging directory")
    suffix = ".exe" if platform == "windows" else ""
    for name, source in helpers.items():
        if source.is_symlink() or not source.exists():
            raise ValueError("missing helper input")
        binary = source / (name + suffix) if source.is_dir() else source
        if not binary.is_file() or binary.is_symlink():
            raise ValueError("missing helper executable")
        if platform != "windows" and not binary.stat().st_mode & 0o100:
            raise ValueError("helper is not executable")
        if source.is_dir():
            inventory(source)
    if (not records or set(records) != required or not architecture
            or not source_commits or set(source_commits) != required or not client_commit):
        raise ValueError("same-build evidence and exact source selections are required")
    # Imported here because the producer shares the inventory without staging anything.
    from build_helper_evidence import verify_record
    verified = {name: verify_record(records[name], source, name, platform, architecture,
                                    source_commits[name], client_commit)
                for name, source in helpers.items()}
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".helpers-", dir=output.parent) as directory:
        staging = Path(directory)
        modules = staging / "modules"
        modules.mkdir()
        for name, source in helpers.items():
            destination = modules / name
            if source.is_dir():
                shutil.copytree(source, destination, symlinks=True)
            else:
                destination.mkdir()
                shutil.copy2(source, destination / (name + suffix))
            if source.is_dir():
                copied = inventory(destination)
            else:
                copied = inventory(destination / (name + suffix))
            if copied != verified[name]["files"]:
                raise ValueError("helper bytes or modes changed during staging")
        evidence = staging / "evidence"
        evidence.mkdir()
        for name, directory in records.items():
            shutil.copytree(directory, evidence / name, symlinks=False)
            if verify_record(evidence / name, helpers[name], name, platform, architecture,
                             source_commits[name], client_commit) != verified[name]:
                raise ValueError("helper evidence changed during staging")
        for name, source in helpers.items():
            copied = modules / name if source.is_dir() else modules / name / (name + suffix)
            if inventory(copied) != verified[name]["files"]:
                raise ValueError("helper bytes or modes changed during staging")
        manifest = {"schema_version": 1, "platform": platform, "helpers": sorted(helpers),
                    "architecture": architecture, "files": inventory(modules),
                    "evidence": {name: {"sources": verified[name]["sources"],
                                        "record_sha256": hashlib.sha256((evidence / name / "helper-build-record.json").read_bytes()).hexdigest()}
                                 for name in sorted(helpers)},
                    "scope": "same-build helper inputs and bytes; unsigned, not a license review"}
        (staging / "helper-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
        # Absolute build input is generated locally; it is never committed as public source.
        config = {"bundle": {"resources": {str((output / "modules").resolve()) + "/": "modules/"}}}
        (staging / "tauri-resources.json").write_text(json.dumps(config, indent=2) + "\n")
        staging.rename(output)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--platform", choices=["linux", "macos", "windows"], required=True)
    parser.add_argument("--helper", action="append", default=[], metavar="NAME=PATH")
    parser.add_argument("--record", action="append", required=True, metavar="NAME=DIRECTORY")
    parser.add_argument("--source", action="append", required=True, metavar="NAME=COMMIT")
    parser.add_argument("--client-commit", required=True)
    parser.add_argument("--architecture", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        helpers = {}
        for pair in args.helper:
            name, path = pair.split("=", 1)
            if name not in HELPERS or name in helpers:
                raise ValueError("unknown or duplicate helper")
            helpers[name] = Path(path).absolute()
        def pairs(values, paths=False):
            result = {}
            for pair in values:
                name, value = pair.split("=", 1)
                if name not in HELPERS or name in result:
                    raise ValueError("unknown or duplicate helper")
                result[name] = Path(value).absolute() if paths else value
            return result
        manifest = stage(helpers, args.output.absolute(), args.platform, pairs(args.record, True),
                         args.architecture, pairs(args.source), args.client_commit)
    except (OSError, ValueError, RuntimeError, TypeError, KeyError) as error:
        parser.exit(1, f"Helper staging rejected: {error}\n")
    print(json.dumps({"passed": True, "helpers": manifest["helpers"], "files": len(manifest["files"])}))


if __name__ == "__main__":
    main()
