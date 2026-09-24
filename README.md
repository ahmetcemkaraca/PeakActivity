# PeakActivity

PeakActivity is an independent ActivityWatch derivative for personal activity
insights. This checkout is a **pre-alpha source bootstrap**, not an installable
PeakActivity release. It preserves the upstream source and component revisions.
ActivityWatch does not endorse or maintain PeakActivity.
The verified upstream base is commit `25e34c71882fd4cf054731bf7f74ca92b934b0d6`.

## Current source capabilities

Available: upstream local window/idle activity collection, bucket/event storage,
HTTP API and web interface. Operating-system permissions and collector support
still apply. These inherited capabilities are not a cross-platform certification.
<!-- capability:local-capture:Available -->
<!-- capability:local-api:Available -->
<!-- capability:web-interface:Available -->

Experimental: the Tauri desktop shell, Rust pre-storage filtering and optional
SQLCipher builds. The default desktop database remains ordinary SQLite.
<!-- capability:desktop:Experimental -->
<!-- capability:storage-filter:Experimental -->
<!-- capability:sqlcipher:Experimental -->

Planned: encrypted-by-default storage and E2EE synchronization. These are future
product requirements, not properties of this source bootstrap.
<!-- capability:encrypted-default:Planned -->
<!-- capability:e2ee-sync:Planned -->

Planned: Peak AI and Custom Endpoint services. AI must be Off by default and an
endpoint failure must never cause an automatic provider or mode switch.
<!-- capability:peak-ai:Planned -->
<!-- capability:custom-endpoint:Planned -->

Unsupported: bundled LLM execution and model download management.
<!-- capability:local-llm:Unsupported -->

## Source and documentation

- [Documentation index](docs/README.md)
- [Build scope and prerequisites](docs/build.md)
- [Usage and current limitations](docs/usage.md)
- [Privacy limitations](docs/privacy.md)
- [Capability registry](docs/capabilities.json)
- [High-level roadmap](docs/roadmap.md)
- [Source provenance](FORKED_FROM.md)
- [Source distribution](docs/source.md)
- [Security reporting status](SECURITY.md)

ActivityWatch-derived files retain their Mozilla Public License 2.0 terms and
notices. See [LICENSE.txt](LICENSE.txt). Corresponding source for distributed
modifications to covered files must accompany the applicable release. Source
availability is not a claim that an unreviewed binary is ready to distribute.
