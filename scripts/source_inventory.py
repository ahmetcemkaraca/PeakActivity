"""Inventory declared source/build dependencies; not artifact or release evidence."""
import argparse
from collections import Counter
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile

from export_source import safe_path
from public_policy import strict_json
from release_evidence import sha256, source_inputs


CATALOGERS = ("rust-cargo-lock-cataloger", "javascript-lock-cataloger",
              "python-package-cataloger", "java-gradle-lockfile-cataloger")
SCAN_CONFIG = {
    "check-for-app-update": False, "parallelism": 1, "enrich": [],
    "cache": {"dir": "", "ttl": "0s"},
    # CycloneDX file nodes leak absolute paths; verified lock bytes/hashes are retained separately.
    "file": {"metadata": {"selection": "none"}},
    "java": {"use-network": False, "use-maven-local-repository": False,
             "resolve-transitive-dependencies": False},
    "javascript": {"search-remote-licenses": False, "include-dev-dependencies": True},
    "python": {"search-remote-licenses": False},
}


def recognized_lock(path):
    name = Path(path).name
    return name in {"Cargo.lock", "package-lock.json", "poetry.lock", "buildscript-gradle.lockfile"} or name.startswith("gradle.lockfile")


def extract_locks(source, manifest, destination):
    expected, manifest_paths = {}, set()
    for item in manifest["files"]:
        if (not isinstance(item, dict) or not isinstance(item.get("path"), str)
                or not safe_path(item["path"]) or item["path"] in manifest_paths):
            raise ValueError("invalid or duplicate source manifest path")
        path = item["path"]
        manifest_paths.add(path)
        if recognized_lock(path):
            if (item.get("mode") not in {"100644", "100755"}
                    or not isinstance(item.get("sha256"), str)
                    or not re.fullmatch(r"[a-f0-9]{64}", item["sha256"])
                    or type(item.get("size")) is not int or item["size"] < 0):
                raise ValueError("invalid lock manifest entry")
            expected[path] = item
    if not expected:
        raise ValueError("no recognized dependency locks in source")
    inputs, seen, scan_paths = [], set(), set()
    with tarfile.open(source / "source.tar.gz", "r:gz") as archive:
        for member in archive:
            path = member.name.removeprefix("source/")
            relevant_parent = any(name.startswith(path + "/") for name in expected)
            if relevant_parent and (member.issym() or member.islnk()):
                raise ValueError("source lock parent is an archive link")
            if not recognized_lock(path):
                continue
            if (not member.name.startswith("source/") or not safe_path(path)
                    or path not in expected or path in seen or not member.isfile()):
                raise ValueError("unsafe, duplicate or unrecorded lock archive member")
            seen.add(path)
            item = expected[path]
            if member.size != item["size"]:
                raise ValueError("lock archive size mismatch")
            data = archive.extractfile(member).read()
            if hashlib.sha256(data).hexdigest() != item["sha256"]:
                raise ValueError("lock archive digest mismatch")
            # Syft 1.50 does not match Gradle's standard buildscript lock filename.
            scan_path = str(Path(path).with_name("gradle.lockfile-buildscript")) if Path(path).name == "buildscript-gradle.lockfile" else path
            if scan_path in scan_paths:
                raise ValueError("lock scanner path collision")
            scan_paths.add(scan_path)
            target = destination / scan_path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
            inputs.append({"path": path, "sha256": item["sha256"], "scan_path": scan_path})
    if seen != set(expected):
        raise ValueError("source archive is missing recorded locks")
    return sorted(inputs, key=lambda item: item["path"])


def create(source, output, syft="syft"):
    source = source.resolve()
    if output.exists() or output.is_symlink() or output.resolve().is_relative_to(source):
        raise ValueError("output must be new and outside the source export")
    manifest, sums = source_inputs(source)
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".source-inventory-", dir=output.parent) as directory:
        staging = Path(directory)
        scan_root = staging / "scan-inputs"
        inputs = extract_locks(source, manifest, scan_root)
        config = staging / "syft-config.json"
        config.write_text(json.dumps(SCAN_CONFIG, indent=2, sort_keys=True) + "\n")
        # Environment overrides must not turn this fixed offline scan into enrichment.
        env = {name: value for name, value in os.environ.items() if not name.upper().startswith("SYFT_")}
        tool = strict_json(subprocess.run([syft, "-c", config.name, "version", "-o", "json"],
                                         env=env, cwd=staging, capture_output=True, text=True, check=True).stdout)
        if not isinstance(tool, dict) or not isinstance(tool.get("version"), str) or not tool["version"]:
            raise ValueError("missing SBOM tool version")
        formats = {"syft-json": "source.syft.json", "spdx-json": "source.spdx.json",
                   "cyclonedx-json": "source.cyclonedx.json"}
        command = [syft, "scan", "dir:scan-inputs", "-c", config.name,
                   "--source-name", "peakactivity-source", "--source-version", manifest["commit"],
                   "--override-default-catalogers", ",".join(CATALOGERS), "--parallelism", "1", "-q"]
        for format_name, path in formats.items():
            command.extend(["-o", f"{format_name}={path}"])
        subprocess.run(command, env=env, cwd=staging, capture_output=True, check=True)
        documents = {name: strict_json((staging / path).read_bytes()) for name, path in formats.items()}
        packages = documents["syft-json"].get("artifacts", [])
        cyclone_entries = documents["cyclonedx-json"].get("components", [])
        if not isinstance(cyclone_entries, list) or any(not isinstance(item, dict) for item in cyclone_entries):
            raise ValueError("invalid CycloneDX components")
        # CycloneDX also emits file components; they are not declared packages.
        cyclone_packages = [item for item in cyclone_entries if item.get("type") != "file"]
        if (not isinstance(packages, list) or not packages
                or not str(documents["spdx-json"].get("spdxVersion", "")).startswith("SPDX-")
                or documents["cyclonedx-json"].get("bomFormat") != "CycloneDX"
                or len(documents["spdx-json"].get("packages", [])) < len(packages)
                or len(cyclone_packages) != len(packages)):
            raise ValueError("empty or inconsistent declared dependency inventory")
        by_path = {item["scan_path"]: item for item in inputs}
        unknown, ids = [], set()
        counts = {path: set() for path in by_path}
        for package in packages:
            if (not isinstance(package, dict) or any(not isinstance(package.get(field), str) or not package[field]
                    for field in ("id", "name", "version", "type")) or package["id"] in ids
                    or package.get("foundBy") not in CATALOGERS
                    or not isinstance(package.get("locations"), list)
                    or not isinstance(package.get("licenses", []), list)):
                raise ValueError("invalid declared dependency package")
            ids.add(package["id"])
            locations = {location["path"].removeprefix("/") for location in package["locations"]
                         if isinstance(location, dict) and isinstance(location.get("path"), str)}
            known_paths = locations & by_path.keys()
            if not known_paths:
                raise ValueError("dependency package has no recorded lock evidence")
            for path in known_paths:
                counts[path].add(package["id"])
            licenses = package.get("licenses", [])
            if not licenses or all(not isinstance(license, dict) or license.get("value", "") in {"", "NOASSERTION", "NONE"}
                                   for license in licenses):
                unknown.append({field: package[field] for field in ("id", "name", "version")})
        for item in inputs:
            item["cataloged_package_count"] = len(counts[item["scan_path"]])
            if sha256(scan_root / item["scan_path"]) != item["sha256"]:
                raise ValueError("lock input changed while scanning")
        if source_inputs(source) != (manifest, sums):
            raise ValueError("source changed while inventorying dependencies")
        record = {
            "schema_version": 1, "scope": "declared source/build dependencies including development declarations",
            "status": "unsigned declared-source inventory; not artifact or release evidence",
            "source_commit": manifest["commit"], "source": sums, "components": manifest["components"],
            "inputs": inputs, "sbom_tool": tool, "scan_config": {"path": config.name, "sha256": sha256(config)},
            "scan_command": [Path(syft).name, *command[1:]],
            "catalogers": list(CATALOGERS),
            "package_counts": {"total": len(packages), "by_type": dict(sorted(Counter(p["type"] for p in packages).items())),
                               "by_cataloger": dict(sorted(Counter(p["foundBy"] for p in packages).items()))},
            "format_entry_counts": {"syft_packages": len(packages),
                                    "spdx_packages_including_source_root": len(documents["spdx-json"]["packages"]),
                                    "cyclonedx_components_including_files": len(cyclone_entries),
                                    "cyclonedx_non_file_components": len(cyclone_packages)},
            "unresolved_license_packages": sorted(unknown, key=lambda package: (package["name"], package["version"], package["id"])),
            "sboms": {name: {"path": path, "sha256": sha256(staging / path)} for name, path in formats.items()},
            "limitations": ["Lock declarations can include unused, development, build and other-platform dependencies.",
                            "Unrecognized or missing locks, native libraries and build tools are not inventoried.",
                            "No artifact was scanned or bound; runtime presence, absence and completeness are unproven.",
                            "License metadata is not license clearance."],
        }
        (staging / "source-inventory.json").write_text(json.dumps(record, indent=2, sort_keys=True) + "\n")
        files = sorted(path for path in staging.rglob("*") if path.is_file())
        (staging / "SHA256SUMS.unsigned").write_text("".join(
            f"{sha256(path)}  {path.relative_to(staging).as_posix()}\n" for path in files))
        staging.rename(output)
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--syft", default="syft")
    args = parser.parse_args()
    try:
        record = create(args.source, args.output, args.syft)
    except (OSError, ValueError, TypeError, KeyError, AttributeError, tarfile.TarError, subprocess.CalledProcessError):
        parser.exit(1, "Source inventory rejected: invalid export, unsafe lock or failed scanner.\n")
    print(json.dumps({"source_commit": record["source_commit"], "packages": record["package_counts"]["total"], "status": record["status"]}))


if __name__ == "__main__":
    main()
