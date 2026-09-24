PeakActivity packaging

Run make package with the reviewed component revisions. The native Tauri bundler
owns application IDs, installer metadata and icons. Only window/idle collectors
and the Linux Wayland collector are staged as resources. No Qt UI, standalone
server, legacy sync daemon, notification service or input watcher is included.

Use a fresh PACKAGE_STAGE path for each build. Retain helper-manifest.json with
release evidence. Signing, notarization and publication require verified identities
and corresponding source/SBOM/notices; a successful build does not authorize them.
