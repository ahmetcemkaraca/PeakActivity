"""Stage only supported capture helpers as native Tauri resources."""
import argparse
import hashlib
import json
import os
import re
import shutil
import tempfile
from pathlib import Path


HELPERS = {"aw-watcher-afk", "aw-watcher-window", "aw-awatcher"}
PROHIBITED = re.compile(
    r"(?:^|/)(?:pyqt\d*|pyside\d*|aw-qt|aw-sync|aw-notify|aw-watcher-input|"
    r"llama_cpp|llama\.cpp|ollama|transformers|torch|tensorflow)(?:[/.\-_]|$)|"
    r"\.(?:gguf|ggml|onnx|safetensors|tflite|ckpt|pth)$", re.I
)


def inventory(root):
    files = []
    for path in sorted(root.rglob("*")):
        relative = path.relative_to(root).as_posix()
        if PROHIBITED.search(relative):
            raise ValueError("prohibited package content")
        if path.is_symlink():
            if not path.resolve().is_relative_to(root.resolve()) or not path.exists():
                raise ValueError("unsafe helper symlink")
            files.append({"path": relative, "symlink": os.readlink(path)})
        elif path.is_file():
            with path.open("rb") as stream:
                files.append({"path": relative, "sha256": hashlib.file_digest(stream, "sha256").hexdigest()})
        elif not path.is_dir():
            raise ValueError("unsupported helper file type")
    return files


def stage(helpers, output, platform):
    required = HELPERS if platform == "linux" else HELPERS - {"aw-awatcher"}
    if set(helpers) != required:
        raise ValueError("exact platform helper set is required")
    if output.exists():
        raise ValueError("output already exists; choose a new staging directory")
    suffix = ".exe" if platform == "windows" else ""
    for name, source in helpers.items():
        if source.is_symlink() or not source.exists():
            raise ValueError("missing helper input")
        binary = source / (name + suffix) if source.is_dir() else source
        if not binary.is_file() or binary.is_symlink():
            raise ValueError("missing helper executable")
        if platform != "windows" and not binary.stat().st_mode & 0o111:
            raise ValueError("helper is not executable")
        if source.is_dir():
            inventory(source)
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
        manifest = {"schema_version": 1, "platform": platform, "helpers": sorted(helpers),
                    "files": inventory(modules), "scope": "staged helper bytes; not a signature or license review"}
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
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        helpers = {}
        for pair in args.helper:
            name, path = pair.split("=", 1)
            if name not in HELPERS or name in helpers:
                raise ValueError("unknown or duplicate helper")
            helpers[name] = Path(path).absolute()
        manifest = stage(helpers, args.output.absolute(), args.platform)
    except (OSError, ValueError) as error:
        parser.exit(1, f"Helper staging rejected: {error}\n")
    print(json.dumps({"passed": True, "helpers": manifest["helpers"], "files": len(manifest["files"])}))


if __name__ == "__main__":
    main()
