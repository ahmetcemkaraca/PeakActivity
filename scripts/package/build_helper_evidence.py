"""Build fresh capture helpers with inspectable, unsigned source and freezer evidence.

Run Python helpers in their reviewed Poetry environment. Installed distributions
describe that build environment; actual archive contents describe included modules.
Neither is complete native dependency or independent builder acceptance.
"""
import argparse
import ast
from datetime import datetime, timezone
import hashlib
import importlib.metadata as metadata
import json
import os
from pathlib import Path
import platform as host
import re
import subprocess
import sys
import tempfile
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from build_evidence import check_worktree
from export_source import export, safe_path
from public_policy import strict_json
from release_evidence import FORBIDDEN_PACKAGES, sha256, source_inputs
from stage_helpers import HELPERS, PROHIBITED, inventory

STATUS = "unsigned same-build helper evidence; requires independent builder and dependency review"
FREEZER_TOCS = {"Analysis-00.toc", "PYZ-00.toc", "PKG-00.toc", "COLLECT-00.toc", "EXE-00.toc"}
FIELDS = {"schema_version", "helper", "platform", "architecture", "package_kind", "sources",
          "command", "started_at", "finished_at", "source_unchanged", "environment",
          "included_modules", "freezer_inputs", "files", "status", "limitations"}


def platform_name():
    return {"linux": "linux", "darwin": "macos", "win32": "windows"}.get(sys.platform)


def architecture_name(value):
    value = value.lower()
    return {"amd64": "x86_64", "arm64": "aarch64"}.get(value, value)


def prohibited(name):
    if not isinstance(name, str):
        raise ValueError("invalid module or package name")
    return PROHIBITED.search(name.replace(".", "/")) or FORBIDDEN_PACKAGES.fullmatch(name.replace("_", "-"))


def validate_sdk(manifest, package):
    """Compare code bytes; local and registry SDKs can have the same version."""
    expected = {item["path"].removeprefix("aw_client/"): item["sha256"] for item in manifest["files"]
                if item["path"].startswith("aw_client/") and item["path"].endswith(".py")}
    actual = {item["path"]: item["sha256"] for item in inventory(package)
              if item["path"].endswith(".py") and "sha256" in item}
    if "capture.py" not in expected or actual != expected:
        raise ValueError("installed SDK bytes differ from selected source")


def installed_environment():
    packages, origins = [], {}
    for distribution in metadata.distributions():
        name, version = distribution.metadata.get("Name", ""), distribution.version
        if not name or not version:
            raise ValueError("invalid installed distribution metadata")
        packages.append({"name": name, "version": version})
        for entry in distribution.files or []:
            path = Path(distribution.locate_file(entry)).resolve()
            if path.is_file():
                origins.setdefault(path, []).append({"scope": "installed-distribution", "name": name,
                                                     "version": version, "path": str(entry).replace("\\", "/")})
    return {"scope": "installed build distributions; not a shipping dependency list",
            "python": host.python_version(), "implementation": host.python_implementation(),
            "distributions": sorted(packages, key=lambda item: (item["name"].lower(), item["version"]))}, origins


def toc(path, count):
    try:
        value = ast.literal_eval(path.read_text(encoding="utf-8"))
    except (ValueError, SyntaxError) as error:
        raise ValueError("invalid freezer TOC syntax") from error
    if not isinstance(value, tuple) or len(value) != count:
        raise ValueError("unsupported freezer TOC shape")
    return value


def toc_entries(value):
    if (not isinstance(value, list) or any(not isinstance(item, tuple) or len(item) != 3
            or not isinstance(item[0], str) or not isinstance(item[2], str)
            or item[1] is not None and not isinstance(item[1], str) for item in value)):
        raise ValueError("invalid freezer TOC entries")
    return value


def pyinstaller_modules(binary, directory, work):
    """Inspect the produced executable, not Analysis's planned module list."""
    from PyInstaller.archive.readers import CArchiveReader
    analysis = toc(work / "Analysis-00.toc", 19)
    pyz = toc(work / "PYZ-00.toc", 2)
    pkg = toc(work / "PKG-00.toc", 11)
    collected = toc(work / "COLLECT-00.toc", 1)
    inputs = {}
    for entries in [analysis[13], analysis[14], analysis[15], analysis[18], pyz[1], pkg[2], collected[0]]:
        for name, source, kind in toc_entries(entries):
            inputs[(name, kind)] = source
    modules, archive = [], CArchiveReader(str(binary))
    for name, entry in sorted(archive.toc.items()):
        kind = entry[-1]
        if kind == "z":
            embedded = archive.open_embedded_archive(name)
            for module, details in sorted(embedded.toc.items()):
                namespace = details[0] == 3
                data = None if namespace else embedded.extract(module, raw=True)
                modules.append({"name": module, "kind": "namespace" if namespace else "PYMODULE",
                                "archive": name, "sha256": None if data is None else hashlib.sha256(data).hexdigest()})
        elif kind in {"m", "M", "s"}:
            modules.append({"name": name, "kind": "PYSOURCE" if kind == "s" else "PYMODULE",
                            "archive": "executable", "sha256": hashlib.sha256(archive.extract(name)).hexdigest()})
    base = directory / "base_library.zip"
    if not base.is_file() or not modules:
        raise ValueError("missing actual freezer archive content")
    with zipfile.ZipFile(base) as library:
        for entry in sorted(library.namelist()):
            if entry.endswith(".pyc"):
                if not safe_path(entry):
                    raise ValueError("unsafe base library member")
                modules.append({"name": entry.removesuffix(".pyc").replace("/", "."), "kind": "stdlib-bytecode",
                                "archive": "base_library.zip", "sha256": hashlib.sha256(library.read(entry)).hexdigest()})
    for name, source, kind in toc_entries(analysis[15]):
        if kind == "EXTENSION":
            path = directory / name
            if not safe_path(name):
                raise ValueError("unsafe extension output")
            modules.append({"name": name, "kind": kind, "archive": "external", "sha256": sha256(path)})
    for module in modules:
        if prohibited(module["name"]):
            raise ValueError("prohibited included module")
        candidates = [(name, source) for (name, kind), source in inputs.items()
                      if name == module["name"] and kind.startswith(module["kind"])]
        paths = {path for _, path in candidates if path not in {None, "-"}}
        if len(paths) > 1:
            raise ValueError("ambiguous freezer module input")
        module["input_path"] = next(iter(paths), None)
    return modules, {path.name: sha256(path) for path in sorted(work.glob("*-00.toc"))}


def bind_modules(modules, collector, client, manifests, sdk, origins, helper):
    by_source = {key: {item["path"]: item for item in manifest["files"]} for key, manifest in manifests.items()}
    for module in modules:
        source = module.pop("input_path")
        if source is None:
            module["input"] = {"scope": "stdlib" if module["kind"] == "stdlib-bytecode" else "unmapped"}
            continue
        path = Path(source).absolute()
        digest = sha256(path)
        if path.is_relative_to(collector):
            key, relative = "collector", path.relative_to(collector).as_posix()
            generated = f"build/{helper}/localpycs/"
            if relative.startswith(generated) and Path(relative).parent.as_posix() == generated.rstrip("/") and path.suffix == ".pyc":
                module["input"] = {"scope": "generated-freezer-bytecode", "path": relative, "sha256": digest}
                continue
        elif client is not None and path.is_relative_to(sdk):
            key, relative = "client", "aw_client/" + path.relative_to(sdk).as_posix()
        else:
            candidates = origins.get(path.resolve(), [])
            if len(candidates) > 1:
                raise ValueError("ambiguous installed module origin")
            origin = candidates[0] if candidates else {"scope": "stdlib-or-native-unmapped", "path": path.name}
            if prohibited(origin.get("name", "")):
                raise ValueError("prohibited included distribution")
            module["input"] = {**origin, "sha256": digest}
            continue
        if relative not in by_source[key] or digest != by_source[key][relative]["sha256"]:
            raise ValueError("freezer source input differs from selected source")
        module["input"] = {"scope": key, "path": relative, "sha256": digest}
    required = {"aw_client.client": "client", "aw_client.capture": "client",
                "aw_watcher_window.main" if helper == "aw-watcher-window" else "aw_watcher_afk.afk": "collector"}
    for name, scope in required.items():
        if not any(module["name"] == name and module["input"]["scope"] == scope for module in modules):
            raise ValueError("required collector or SDK module missing from actual package")
    return modules


def produce(collector, client, helper, output, platform, architecture):
    collector, output = collector.absolute(), output.absolute()
    architecture = architecture_name(architecture)
    if helper not in HELPERS or platform != platform_name() or architecture != architecture_name(host.machine()):
        raise ValueError("helper platform or architecture differs from builder")
    if helper == "aw-awatcher" and (platform != "linux" or client is not None):
        raise ValueError("Wayland uses Cargo on Linux without the Python SDK")
    if helper != "aw-awatcher" and client is None:
        raise ValueError("Python helper requires selected SDK source")
    if (output.exists() or output.resolve() != output or output.is_relative_to(collector)
            or collector.resolve() != collector):
        raise ValueError("evidence must be new and outside the collector")
    client = client.absolute() if client is not None else None
    if client and (client.resolve() != client or output.is_relative_to(client)):
        raise ValueError("invalid SDK source or evidence output")
    suffix = ".exe" if platform == "windows" else ""
    package = collector / ("target/release/awatcher" if helper == "aw-awatcher" else f"dist/{helper}")
    work = collector / "build" / helper
    if package.exists() or package.resolve() != package or work.exists() or work.resolve() != work:
        raise ValueError("package and freezer outputs must be fresh")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".helper-evidence-", dir=output.parent) as temporary:
        staging = Path(temporary)
        roots = {"collector": collector, **({"client": client} if client else {})}
        manifests = {key: export(root, staging / f"{key}-source") for key, root in roots.items()}
        for key, root in roots.items():
            check_worktree(root, manifests[key])
        sources = {key: {"commit": manifest["commit"], "components": manifest["components"],
                         "source": source_inputs(staging / f"{key}-source")[1]} for key, manifest in manifests.items()}
        environment, origins = installed_environment() if client else ({"scope": "Cargo build tools; native included dependencies unproven"}, {})
        started = datetime.now(timezone.utc).isoformat()
        if client:
            sdk = Path(metadata.distribution("aw-client").locate_file("aw_client")).absolute()
            validate_sdk(manifests["client"], sdk)
            version = metadata.version("pyinstaller")
            if version not in {"6.11.0", "6.11.1"}:
                raise ValueError("unsupported PyInstaller evidence version")
            environment["pyinstaller"] = version
            if platform == "macos" and helper == "aw-watcher-window":
                swift = collector / "aw_watcher_window/aw-watcher-window-macos"
                if swift.exists() or swift.resolve() != swift:
                    raise ValueError("Swift helper output must be fresh")
                environment["native_helper_command"] = ["make", "build-swift"]
                environment["swiftc"] = subprocess.run(["swiftc", "--version"], capture_output=True, text=True, check=True).stdout.strip()
                subprocess.run(["make", "build-swift"], cwd=collector, check=True)
            command = [sys.executable, "-m", "PyInstaller", f"{helper}.spec", "--clean", "--noconfirm"]
        else:
            if os.environ.get("CARGO_BUILD_TARGET"):
                raise ValueError("native helper requires the builder host target")
            environment["cargo"] = subprocess.run(["cargo", "--version"], capture_output=True, text=True, check=True).stdout.strip()
            environment["rustc"] = subprocess.run(["rustc", "-vV"], capture_output=True, text=True, check=True).stdout.strip()
            environment["target"] = next((line.removeprefix("host: ") for line in environment["rustc"].splitlines()
                                          if line.startswith("host: ")), None)
            if not environment["target"]:
                raise ValueError("missing compiler host target")
            environment["features"] = "manifest defaults; no feature override"
            lock = next((item for item in manifests["collector"]["files"] if item["path"] == "Cargo.lock"), None)
            if not lock:
                raise ValueError("native helper requires recorded Cargo.lock")
            environment["lock"] = {"path": "Cargo.lock", "sha256": lock["sha256"]}
            command = ["cargo", "build", "--locked", "--release"]
        subprocess.run(command, cwd=collector, check=True)
        binary = package / (helper + suffix) if client else package
        sha256(binary)
        if platform != "windows" and not binary.stat().st_mode & 0o100:
            raise ValueError("produced helper is not executable")
        files = inventory(package, helper + suffix)
        modules, freezer_inputs = (pyinstaller_modules(package / (helper + suffix), package, work) if client else ([], {}))
        if client:
            bind_modules(modules, collector, client, manifests, sdk, origins, helper)
            validate_sdk(manifests["client"], sdk)
            if installed_environment()[0] != {key: value for key, value in environment.items()
                                             if key not in {"pyinstaller", "native_helper_command", "swiftc"}}:
                raise ValueError("installed environment changed while packaging")
        for key, root in roots.items():
            after = export(root, staging / f"{key}-after")
            check_worktree(root, after)
            if manifests[key] != after:
                raise ValueError("source changed while packaging")
        if inventory(package, helper + suffix) != files:
            raise ValueError("package changed after build or during inspection")
        record = {"schema_version": 1, "helper": helper, "platform": platform, "architecture": architecture,
                  "package_kind": "pyinstaller-onedir" if client else "cargo-executable", "sources": sources,
                  "command": [Path(command[0]).name, *command[1:]], "started_at": started,
                  "finished_at": datetime.now(timezone.utc).isoformat(), "source_unchanged": True,
                  "environment": environment, "included_modules": modules, "freezer_inputs": freezer_inputs,
                  "files": files, "status": STATUS,
                  "limitations": ["Unsigned local evidence; independent builder trust remains unproven.",
                                  "Installed distributions include build tools and unused packages.",
                                  "Native dependency completeness, licenses and platform signing remain unproven."]}
        (staging / "helper-build-record.json").write_text(json.dumps(record, indent=2, sort_keys=True) + "\n")
        verify_record(staging, package, helper, platform, architecture, sources["collector"]["commit"],
                      sources.get("client", {}).get("commit"))
        staging.rename(output)
    return record


def verify_record(directory, package, helper, platform, architecture, collector_commit, client_commit):
    directory = directory.absolute()
    if directory.resolve() != directory:
        raise ValueError("evidence uses a symlink")
    keys = {"collector"} if helper == "aw-awatcher" else {"collector", "client"}
    expected_paths = {".", "helper-build-record.json"}
    for key in keys:
        for suffix in ("source", "after"):
            parent = f"{key}-{suffix}"
            expected_paths.update({parent, *(parent + "/" + name for name in
                                           ("source.tar.gz", "source-manifest.json", "SHA256SUMS.unsigned"))})
    entries = inventory(directory)
    if set(item["path"] for item in entries) != expected_paths or any("symlink" in item for item in entries):
        raise ValueError("unexpected or linked helper evidence content")
    record = strict_json((directory / "helper-build-record.json").read_bytes())
    if (not isinstance(record, dict) or set(record) != FIELDS or type(record["schema_version"]) is not int
            or record["schema_version"] != 1
            or record["helper"] != helper or record["platform"] != platform
            or record["architecture"] != architecture_name(architecture)
            or record["source_unchanged"] is not True or record["status"] != STATUS
            or record["files"] != inventory(package, helper + (".exe" if platform == "windows" else ""))):
        raise ValueError("helper evidence does not match selected package")
    if (not isinstance(record["command"], list) or not record["command"]
            or any(not isinstance(arg, str) or not arg for arg in record["command"])
            or not isinstance(record["environment"], dict)
            or not isinstance(record["limitations"], list) or not record["limitations"]
            or any(not isinstance(item, str) or not item for item in record["limitations"])
            or not isinstance(record["freezer_inputs"], dict)
            or any(not isinstance(name, str) or not safe_path(name) or not isinstance(digest, str)
                   or not re.fullmatch(r"[a-f0-9]{64}", digest)
                   for name, digest in record["freezer_inputs"].items())):
        raise ValueError("invalid helper build command, environment or freezer evidence")
    try:
        started, finished = (datetime.fromisoformat(record[field]) for field in ("started_at", "finished_at"))
    except (TypeError, ValueError) as error:
        raise ValueError("invalid helper evidence timestamps") from error
    if started.tzinfo is None or finished.tzinfo is None or finished < started:
        raise ValueError("invalid helper evidence timestamps")
    if not isinstance(record["sources"], dict) or set(record["sources"]) != keys:
        raise ValueError("helper evidence source set differs")
    manifests = {}
    for key in keys:
        manifest, sums = source_inputs(directory / f"{key}-source")
        if (record["sources"][key] != {"commit": manifest["commit"], "components": manifest["components"], "source": sums}
                or manifest["commit"] != (collector_commit if key == "collector" else client_commit)):
            raise ValueError("helper evidence source selection differs")
        after, after_sums = source_inputs(directory / f"{key}-after")
        if after != manifest or after_sums != sums:
            raise ValueError("helper evidence source changed")
        manifests[key] = {item["path"]: item for item in manifest["files"]}
    modules = record["included_modules"]
    if not isinstance(modules, list):
        raise ValueError("invalid included module evidence")
    identities = set()
    for module in modules:
        if (not isinstance(module, dict) or set(module) != {"name", "kind", "archive", "sha256", "input"}
                or any(not isinstance(module[field], str) or not module[field] for field in ("name", "kind", "archive"))
                or prohibited(module["name"]) or not isinstance(module["input"], dict)
                or not isinstance(module["input"].get("scope"), str)
                or module["kind"] != "namespace" and (not isinstance(module["sha256"], str)
                    or not re.fullmatch(r"[a-f0-9]{64}", module["sha256"]))
                or module["kind"] == "namespace" and module["sha256"] is not None):
            raise ValueError("prohibited or invalid included module evidence")
        identity = (module["archive"], module["name"])
        if identity in identities:
            raise ValueError("duplicate included module evidence")
        identities.add(identity)
        origin = module["input"]
        if origin["scope"] in manifests:
            source = manifests[origin["scope"]].get(origin.get("path"))
            if (set(origin) != {"scope", "path", "sha256"} or not source
                    or origin["sha256"] != source["sha256"]):
                raise ValueError("included module does not bind selected source")
        elif origin["scope"] == "installed-distribution":
            if (set(origin) != {"scope", "name", "version", "path", "sha256"}
                    or any(not isinstance(origin[key], str) or not origin[key] for key in ("name", "version", "path", "sha256"))
                    or prohibited(origin["name"]) or not re.fullmatch(r"[a-f0-9]{64}", origin["sha256"])
                    or {"name": origin["name"], "version": origin["version"]} not in record["environment"].get("distributions", [])):
                raise ValueError("included distribution lacks installed evidence")
        elif origin["scope"] == "generated-freezer-bytecode":
            if (set(origin) != {"scope", "path", "sha256"} or not isinstance(origin["path"], str)
                    or not safe_path(origin["path"])
                    or Path(origin["path"]).parent.as_posix() != f"build/{helper}/localpycs"
                    or Path(origin["path"]).suffix != ".pyc" or not isinstance(origin["sha256"], str)
                    or not re.fullmatch(r"[a-f0-9]{64}", origin["sha256"])):
                raise ValueError("invalid generated freezer input")
        elif origin["scope"] not in {"stdlib", "unmapped", "stdlib-or-native-unmapped"}:
            raise ValueError("unknown included module origin")
    if helper != "aw-awatcher":
        required = {"aw_client.client": "client", "aw_client.capture": "client",
                    "aw_watcher_window.main" if helper == "aw-watcher-window" else "aw_watcher_afk.afk": "collector"}
        for name, scope in required.items():
            if not any(module.get("name") == name and module.get("input", {}).get("scope") == scope for module in modules):
                raise ValueError("required module missing from helper evidence")
        if record["package_kind"] != "pyinstaller-onedir" or set(record["freezer_inputs"]) != FREEZER_TOCS:
            raise ValueError("missing actual freezer evidence")
    elif record["package_kind"] != "cargo-executable" or modules or record["freezer_inputs"]:
        raise ValueError("invalid native helper evidence")
    else:
        environment = record["environment"]
        lock = manifests["collector"].get("Cargo.lock")
        if (record["command"] != ["cargo", "build", "--locked", "--release"] or not lock
                or environment.get("lock") != {"path": "Cargo.lock", "sha256": lock["sha256"]}
                or environment.get("features") != "manifest defaults; no feature override"
                or any(not isinstance(environment.get(field), str) or not environment[field]
                       for field in ("cargo", "rustc", "target"))):
            raise ValueError("missing locked native build selection")
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--collector", type=Path, required=True)
    parser.add_argument("--client", type=Path)
    parser.add_argument("--helper", choices=sorted(HELPERS), required=True)
    parser.add_argument("--platform", choices=["linux", "macos", "windows"], required=True)
    parser.add_argument("--architecture", default=host.machine())
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        record = produce(args.collector, args.client, args.helper, args.output, args.platform, args.architecture)
    except (OSError, ValueError, TypeError, KeyError, RuntimeError, subprocess.CalledProcessError) as error:
        parser.exit(1, f"Helper build evidence rejected: {error}\n")
    print(json.dumps({"helper": record["helper"], "files": len(record["files"]), "status": record["status"]}))


if __name__ == "__main__":
    main()
