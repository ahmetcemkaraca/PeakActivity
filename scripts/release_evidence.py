"""Bind native artifacts, exact source and Syft SBOMs in an unsigned release lock.

This tool does not publish or sign. A release owner must separately verify the
platform signatures, public source URL and license/audit acceptance.
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

from public_policy import strict_json


FORBIDDEN_PACKAGES = re.compile(
    r"^(?:pyqt\d*(?:-.*)?|pyside\d*|aw-qt|aw-sync|aw-notify|aw-watcher-input|"
    r"ollama|llama-cpp(?:-python)?|transformers|torch|tensorflow(?:-.*)?|onnxruntime(?:-.*)?)$", re.I
)


def sha256(path):
    if path.is_symlink() or not path.is_file():
        raise ValueError("release input must be a regular, non-symlink file")
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def source_inputs(directory):
    sums = {}
    for line in (directory / "SHA256SUMS.unsigned").read_text().splitlines():
        digest, name = line.split("  ", 1)
        if name not in {"source.tar.gz", "source-manifest.json"} or name in sums or not re.fullmatch(r"[a-f0-9]{64}", digest):
            raise ValueError("invalid source checksum manifest")
        sums[name] = digest
    if set(sums) != {"source.tar.gz", "source-manifest.json"} or any(sha256(directory / name) != digest for name, digest in sums.items()):
        raise ValueError("source checksum mismatch")
    manifest = strict_json((directory / "source-manifest.json").read_bytes())
    if not manifest.get("files") or not manifest.get("components") or not re.fullmatch(r"[a-f0-9]{40}", manifest.get("commit", "")):
        raise ValueError("incomplete source manifest")
    return manifest, sums


def check_sbom(spdx, cyclone):
    if not str(spdx.get("spdxVersion", "")).startswith("SPDX-") or cyclone.get("bomFormat") != "CycloneDX":
        raise ValueError("unrecognized SBOM format")
    packages = spdx.get("packages", [])
    components = cyclone.get("components", [])
    if not packages or not components:
        raise ValueError("empty SBOM cannot support artifact acceptance")
    unknown = []
    for package in packages + components:
        name = package.get("name", "")
        if not isinstance(name, str) or not name:
            raise ValueError("invalid SBOM package")
        if FORBIDDEN_PACKAGES.fullmatch(name.replace("_", "-")):
            raise ValueError("prohibited runtime dependency in artifact")
        if not package.get("licenses") and package.get("licenseDeclared", "NOASSERTION") in {"NOASSERTION", "NONE", ""}:
            unknown.append(name)
    return sorted(set(unknown))


def create(source, artifacts, notices, instructions, output, release_id, syft="syft"):
    if not re.fullmatch(r"peakactivity-v[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?", release_id):
        raise ValueError("invalid release identifier")
    if output.exists() or not artifacts or len({path.name for path in artifacts}) != len(artifacts):
        raise ValueError("output must be new and artifact names must be unique")
    source_manifest, sums = source_inputs(source)
    sha256(notices)
    sha256(instructions)
    if not notices.read_text().strip() or not instructions.read_text().strip():
        raise ValueError("notices and build instructions must be non-empty")
    digests = {artifact.name: sha256(artifact) for artifact in artifacts}
    version = subprocess.run([syft, "version", "-o", "json"], capture_output=True, text=True, check=True).stdout
    tool = strict_json(version)
    if not tool.get("version"):
        raise ValueError("missing SBOM tool version")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".release-evidence-", dir=output.parent) as directory:
        staging = Path(directory)
        evidence = []
        for index, artifact in enumerate(artifacts):
            spdx_path = staging / f"artifact-{index}.spdx.json"
            cyclone_path = staging / f"artifact-{index}.cyclonedx.json"
            command = [syft, "scan", str(artifact.resolve()), "--source-name", release_id,
                       "--source-version", digests[artifact.name], "-q",
                       "-o", f"spdx-json={spdx_path}", "-o", f"cyclonedx-json={cyclone_path}"]
            subprocess.run(command, capture_output=True, check=True)
            unknown = check_sbom(strict_json(spdx_path.read_bytes()), strict_json(cyclone_path.read_bytes()))
            if sha256(artifact) != digests[artifact.name]:
                raise ValueError("artifact changed while scanning")
            evidence.append({"name": artifact.name, "sha256": digests[artifact.name],
                             "spdx": {"path": spdx_path.name, "sha256": sha256(spdx_path)},
                             "cyclonedx": {"path": cyclone_path.name, "sha256": sha256(cyclone_path)},
                             "unresolved_license_packages": unknown})
        for name in sums:
            shutil.copyfile(source / name, staging / name)
            if sha256(staging / name) != sums[name]:
                raise ValueError("source changed while assembling evidence")
        shutil.copyfile(notices, staging / "THIRD_PARTY_NOTICES.txt")
        shutil.copyfile(instructions, staging / "BUILD.md")
        lock = {
            "schema_version": 1, "release_id": release_id, "source_commit": source_manifest["commit"],
            "source": sums, "components": source_manifest["components"], "artifacts": evidence,
            "notices_sha256": sha256(staging / "THIRD_PARTY_NOTICES.txt"),
            "build_instructions_sha256": sha256(staging / "BUILD.md"),
            "sbom_tool": tool,
            "sbom_command": "syft scan <artifact> --source-name <release-id> --source-version <artifact-sha256> -q -o spdx-json=<output> -o cyclonedx-json=<output>",
            "status": "unsigned candidate; not approved for publication",
            "pending_acceptance": ["platform signing and notarization", "public exact-source URL", "license and asset review", "privacy and security audit"],
        }
        (staging / "release.lock.json").write_text(json.dumps(lock, indent=2, sort_keys=True) + "\n")
        checksums = [f"{sha256(path)}  {path.name}" for path in sorted(staging.iterdir())]
        (staging / "SHA256SUMS.unsigned").write_text("\n".join(checksums) + "\n")
        staging.rename(output)
    return lock


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--artifact", type=Path, action="append", required=True)
    parser.add_argument("--notices", type=Path, required=True)
    parser.add_argument("--instructions", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--release-id", required=True)
    parser.add_argument("--syft", default="syft")
    args = parser.parse_args()
    try:
        lock = create(args.source, args.artifact, args.notices, args.instructions, args.output, args.release_id, args.syft)
    except (OSError, ValueError, TypeError, KeyError, subprocess.CalledProcessError):
        parser.exit(1, "Release evidence rejected: invalid input, failed scanner or prohibited runtime.\n")
    print(json.dumps({"release_id": lock["release_id"], "artifacts": len(lock["artifacts"]), "status": lock["status"]}))


if __name__ == "__main__":
    main()
