# Source distribution

This source bootstrap has no published PeakActivity binary. A future binary must
identify its immutable source revisions, corresponding covered source archive,
dependency inventory, notices and checksums. A signing identity and public download
or source endpoint are not asserted until verified.

The source exporter reads committed Git objects and recursively pinned modules.
It excludes untracked files, caches, build outputs and Git metadata; it does not
export arbitrary working-directory contents. A dirty or incomplete checkout fails
instead of silently exporting different inputs.

```sh
python3 scripts/export_source.py --root . --output ../peakactivity-source-export
```

The output contains a normalized source archive, per-file hashes, component source
revisions and an unsigned checksum manifest. This is source provenance, not a
binary SBOM, signature or license approval. Inventory declared dependencies from
the verified source export separately:

```sh
python3 scripts/source_inventory.py --source ../peakactivity-source-export \
  --output ../peakactivity-source-inventory
```

The command reads only recorded Cargo, npm, Poetry and Gradle lock files, verifies
their archive bytes against the source manifest, and retains SPDX, CycloneDX and
Syft inventories with input hashes, scanner configuration and unresolved licenses.
It includes development and build declarations. Gradle buildscript locks retain
their original path/hash even when the scanner needs a filename alias. Missing or
unrecognized locks remain outside this inventory.

These declarations can include unused and other-platform packages. They do not
prove which dependencies entered a binary, establish runtime completeness or
approve licenses. Scan the final binary separately before distribution; an empty
artifact inventory still fails the release-evidence checks.

ActivityWatch-derived files remain covered by the [MPL 2.0](../LICENSE.txt).
Preserve their notices and provide corresponding source for distributed
modifications. Review third-party component and asset obligations for the actual
artifact; do not infer them from the superproject license alone.

Run the build from a clean checkout with the reviewed, recursively pinned
component graph. Artifacts must not exist before the command starts. The wrapper
exports source before and after, compares the actual worktree bytes to the export,
and binds newly produced artifact hashes to that source. Choose the artifact path
for the target platform:

```sh
python3 scripts/build_evidence.py --root . \
  --artifact aw-tauri/src-tauri/target/release/bundle/deb/peakactivity-installer.deb \
  --output ../peakactivity-build -- make build
```

The wrapper records command arguments; do not put credentials in them. Use a clean
reviewed build environment. The record does not attest to the compiler, downloaded
dependencies, environment, or reproducibility, and is not signed builder evidence.
Local component overrides outside the pinned checkout are unsuitable for this
release procedure. The pre/post check rejects source or generated tracked-file
changes; development builds can run without the evidence wrapper.

To assemble unsigned release evidence from that build, use:

```sh
python3 scripts/release_evidence.py --source ../peakactivity-build/source \
  --build-record ../peakactivity-build/build-record.json \
  --artifact aw-tauri/src-tauri/target/release/bundle/deb/peakactivity-installer.deb \
  --notices ../artifacts/THIRD_PARTY_NOTICES.txt --instructions docs/build.md \
  --release-id peakactivity-v0.1.0 --output ../release-evidence
```

The command requires Syft and records its version, both SBOM formats, artifact and
source hashes, the matching build record, notices and build instructions in
`release.lock.json`. Missing or mismatched build records are rejected. Unsupported
or empty scanner results fail. Unresolved license metadata remains visible; the
output is an unsigned candidate and never an automatic publication approval.
