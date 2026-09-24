# Component provenance

The [origin record](../FORKED_FROM.md) pins the superproject source base. Its
[.gitmodules](../.gitmodules) lists eleven top-level components. Gitlinks pin each
component to a commit; nested web interface and media gitlinks add recursive inputs.

The desktop also resolves its embedded Rust server through Cargo. The current
Tauri lockfile records `7c33810cd44393b3ecad64277b7e69bfeaee817b`; the top-level
Rust server gitlink records `59eaae3b2e945143dd841cc440db468a3c254de7`.
These are distinct source inputs and must both appear in an artifact's provenance.

Upstream licenses and author notices remain intact. A module's root license is not
a substitute for dependency and asset review. Media provenance and incomplete
package license metadata must be resolved before a branded distribution.

Source-only material includes legacy UI components that are excluded from the
intended desktop distribution. Source inclusion does not authorize their inclusion
in a proprietary binary. No binary/license acceptance is asserted here.
