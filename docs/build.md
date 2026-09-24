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
