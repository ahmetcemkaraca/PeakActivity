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
binary SBOM, signature or license approval. Generate the dependency SBOM with the
reviewed SBOM tool against the exact release inputs and retain its version and
command. Scan the final binary separately before distribution.

ActivityWatch-derived files remain covered by the [MPL 2.0](../LICENSE.txt).
Preserve their notices and provide corresponding source for distributed
modifications. Review third-party component and asset obligations for the actual
artifact; do not infer them from the superproject license alone.

To assemble unsigned evidence for already-built native artifacts, use:

```sh
python3 scripts/release_evidence.py --source ../peakactivity-source-export \
  --artifact ../artifacts/peakactivity-installer.deb \
  --notices ../artifacts/THIRD_PARTY_NOTICES.txt --instructions docs/build.md \
  --release-id peakactivity-v0.1.0 --output ../release-evidence
```

The command requires Syft and records its version, both SBOM formats, artifact and
source hashes, notices and build instructions in `release.lock.json`. Unsupported
or empty scanner results fail. Unresolved license metadata remains visible; the
output is an unsigned candidate and never an automatic publication approval.
