"""Export committed source and recursive Git pins without worktree caches or secrets."""
import argparse
import configparser
import gzip
import hashlib
import io
import json
import posixpath
import re
import subprocess
import tarfile
import tempfile
from pathlib import Path, PurePosixPath
from urllib.parse import urlsplit


def git(root, *args):
    return subprocess.run(["git", "-C", str(root), *args], capture_output=True, check=True).stdout


def safe_path(path):
    return (bool(path) and "\\" not in path and not re.match(r"^[A-Za-z]:", path)
            and not PurePosixPath(path).is_absolute()
            and not any(ord(char) < 32 for char in path)
            and all(part not in {"", ".", "..", ".git"} for part in path.split("/")))


def collect(root, revision, prefix="", url=None):
    try:
        if git(root, "rev-parse", "--show-toplevel").decode().strip() != str(root.resolve()):
            raise ValueError("missing module checkout")
        if git(root, "rev-parse", "HEAD").decode().strip() != revision:
            raise ValueError("module does not match recorded revision")
        if git(root, "status", "--porcelain", "--untracked-files=normal"):
            raise ValueError("dirty source checkout")
    except subprocess.CalledProcessError as error:
        raise ValueError("missing source checkout") from error
    entries = []
    for entry in git(root, "ls-tree", "-rz", revision).split(b"\0"):
        if entry:
            meta, name = entry.split(b"\t", 1)
            mode, kind, oid = meta.decode().split()
            name = name.decode()
            if not safe_path(name):
                raise ValueError("unsafe source path")
            entries.append((mode, kind, oid, name))
    modules = {}
    if any(name == ".gitmodules" for _, _, _, name in entries):
        config = configparser.ConfigParser(interpolation=None)
        config.read_string(git(root, "show", f"{revision}:.gitmodules").decode())
        for section in config.sections():
            path = config.get(section, "path")
            source_url = config.get(section, "url")
            parsed = urlsplit(source_url)
            if (not safe_path(path) or path in modules or parsed.scheme != "https"
                    or parsed.hostname != "github.com" or parsed.username or parsed.password
                    or parsed.query or parsed.fragment or config.has_option(section, "branch")):
                raise ValueError("unapproved module source")
            modules[path] = source_url
    files = []
    components = [{"path": prefix or ".", "commit": revision,
                   "tree": git(root, "rev-parse", f"{revision}^{{tree}}").decode().strip(),
                   "source_url": url,
                   "license_files": [prefix + name for _, kind, _, name in entries
                                     if kind == "blob" and "/" not in name
                                     and name.upper().startswith(("LICENSE", "COPYING", "NOTICE"))]}]
    for mode, kind, oid, name in entries:
        if mode == "160000":
            if name not in modules or not (root / name).resolve().is_relative_to(root):
                raise ValueError("module source is missing or escapes checkout")
            nested_files, nested_components = collect(root / name, oid, prefix + name + "/", modules[name])
            files.extend(nested_files)
            components.extend(nested_components)
        elif kind == "blob" and mode in {"100644", "100755", "120000"}:
            data = git(root, "cat-file", "blob", oid)
            if mode == "120000":
                target = data.decode()
                destination = posixpath.normpath(posixpath.join(posixpath.dirname(name), target))
                if not safe_path(destination) or target.startswith("/") or "\\" in target:
                    raise ValueError("unsafe source symlink")
            files.append({"path": prefix + name, "mode": mode, "git_blob": oid,
                          "sha256": hashlib.sha256(data).hexdigest(), "size": len(data), "data": data})
        else:
            raise ValueError("unsupported source entry")
    return files, components


def export(root: Path, output: Path):
    root, output = root.resolve(), output.resolve()
    if output.exists() or output.is_relative_to(root):
        raise ValueError("output must be a new directory outside the source checkout")
    revision = git(root, "rev-parse", "HEAD").decode().strip()
    files, components = collect(root, revision)
    files.sort(key=lambda item: item["path"])
    manifest = {"schema_version": 1, "scope": "committed source; not a binary SBOM or license clearance",
                "commit": revision, "components": sorted(components, key=lambda item: item["path"]),
                "files": [{key: value for key, value in item.items() if key != "data"} for item in files]}
    output.parent.mkdir(parents=True, exist_ok=True)
    # Publish the complete export atomically; never leave a success-looking partial archive.
    with tempfile.TemporaryDirectory(prefix=".source-export-", dir=output.parent) as temporary:
        staging = Path(temporary)
        with (staging / "source.tar.gz").open("wb") as stream:
            with gzip.GzipFile(filename="", fileobj=stream, mode="wb", mtime=0) as compressed:
                with tarfile.open(fileobj=compressed, mode="w", format=tarfile.PAX_FORMAT) as archive:
                    for item in files:
                        info = tarfile.TarInfo("source/" + item["path"])
                        info.mode = 0o755 if item["mode"] == "100755" else 0o644
                        info.uid = info.gid = info.mtime = 0
                        if item["mode"] == "120000":
                            info.type, info.linkname = tarfile.SYMTYPE, item["data"].decode()
                            archive.addfile(info)
                        else:
                            info.size = item["size"]
                            archive.addfile(info, io.BytesIO(item["data"]))
        (staging / "source-manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
        checksums = []
        for path in sorted(staging.iterdir()):
            with path.open("rb") as stream:
                checksums.append(f"{hashlib.file_digest(stream, 'sha256').hexdigest()}  {path.name}")
        (staging / "SHA256SUMS.unsigned").write_text("\n".join(checksums) + "\n")
        staging.rename(output)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        manifest = export(args.root, args.output)
    except (OSError, ValueError, subprocess.CalledProcessError, configparser.Error):
        print(json.dumps({"passed": False, "error": "source export rejected; check cleanliness, module pins and output path"}))
        return 1
    print(json.dumps({"passed": True, "commit": manifest["commit"], "files": len(manifest["files"]), "components": len(manifest["components"])}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
