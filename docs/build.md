# Build the source baseline

The source baseline includes Python collectors/libraries, Rust services, Vue web
interfaces and an Experimental Tauri desktop shell. Branded installers are not
available from this bootstrap.
<!-- capability:desktop:Experimental -->

Initialize the pinned modules from a checkout of this source:

```sh
git submodule update --init --recursive
git submodule status --recursive
```

Use the versions and lockfiles in each component. The inherited root
`.tool-versions` file is historical; it is not a validated modern toolchain matrix.
Python packages use Poetry, the web interface uses npm, and Rust components use
Cargo. Desktop builds also require the native Tauri prerequisites for the target OS.
Do not regenerate dependency locks as part of a routine build.

For an isolated development environment with those prerequisites installed:

```sh
make build
```

This development build stages only the window/idle collectors and the Linux
Wayland collector, then invokes the native Tauri bundler. Use the corresponding
reviewed PeakActivity component revisions; inherited component pins alone do not
contain those changes. Build completion does not establish release acceptance. Use a separate OS account
for collector smoke tests so the
inherited data directories cannot collide with an existing ActivityWatch install.

To inspect the Rust server independently:

```sh
cd aw-server-rust
cargo build --locked -p aw-server
```

Experimental: SQLCipher support requires an explicit encryption feature. Normal
builds do not establish encrypted storage or native key management.
<!-- capability:sqlcipher:Experimental -->

The inherited Tauri pin selects its Rust server independently through Cargo.
The reviewed PeakActivity component candidate instead consumes the sibling
`aw-server-rust` workspace with mandatory encryption features. Record the actual
selected component commits and build inputs; do not mix these two source graphs.

Public policy tooling requires Python 3.11 or later and Git; it has no runtime
Python dependencies. Its fixture tests use pytest from the development environment.

For separate reviewed component checkouts, select `DESKTOP_DIR`, `WEBUI_DIR`,
`WINDOW_DIR`, `AFK_DIR`, `CLIENT_DIR` and `WAYLAND_DIR` explicitly. Use a new `PACKAGE_STAGE`
directory per build; staging refuses to overwrite an existing evidence input.
Native installers are produced by Tauri, without the former Qt, standalone server
or legacy sync packaging paths. Keep the generated helper manifest with the build.

The helper packaging step installs the reviewed local Python client into each
collector environment, so scoped session renewal is included in the actual helper
binary. Using an unrelated published client version is not an equivalent build.

Helper evidence is produced during packaging, before staging. The producer runs
inside each collector's Poetry environment, compares installed SDK code bytes with
the selected source export, and checks both collector and SDK source before and
after the build. Python evidence currently supports the component locks' PyInstaller
6.11.0 and 6.11.1 with a Python 3.11–3.13 builder. It inspects the resulting CArchive,
embedded PYZ, base library and extension files; the planned Analysis module list
alone cannot prove that a module shipped. Installed distribution versions describe
the build environment and can include unused packages and build tools.

Use clean component checkouts with fresh helper output paths. Existing `dist`
helper directories, freezer work directories, a compiled macOS Swift helper or the
Linux Wayland release executable must be preserved elsewhere before a new evidence
build; the producer refuses to overwrite them. Select a new `PACKAGE_STAGE` for
staging and its sibling evidence directory. The Linux helper records its locked
Cargo command, compiler host target and default feature selection separately from
Python freezer evidence.

Staging requires records for every platform helper, matching selected collector
and SDK commits, architecture, complete output bytes, executable modes and safe
relative links. It checks the copied tree again. Records and source exports are
retained under `PACKAGE_STAGE/evidence/`; only `PACKAGE_STAGE/modules/` is mapped
into Tauri resources. Keep the evidence with the build. These unsigned local
records do not approve a release or establish complete native dependency coverage.
