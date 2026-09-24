# Privacy scope

The baseline collectors record local activity. Application names, titles and URLs
may contain sensitive information. Review the selected collector's fields and
permissions before starting it. This bootstrap does not make a blanket no-network
claim: inherited update checks and other upstream surfaces still require removal
from the future branded application.

Experimental: Rust pre-storage filtering can drop or redact matching event fields.
The complete outbound Privacy Firewall, destination approval and exact-payload
consent contract are Planned.
<!-- capability:storage-filter:Experimental -->
<!-- capability:privacy-firewall:Planned -->

Planned: encrypted-by-default storage and E2EE synchronization. The default desktop
database is currently ordinary SQLite. File permissions are not encryption.
<!-- capability:encrypted-default:Planned -->
<!-- capability:e2ee-sync:Planned -->

Planned: Peak AI and Custom Endpoint, with AI Off by default, explicit destination
and payload approval, credential removal and no automatic fallback between modes.
These are requirements, not implemented service guarantees.
<!-- capability:peak-ai:Planned -->
<!-- capability:custom-endpoint:Planned -->

Unsupported: bundled LLM or on-device LLM execution and model management.
Deterministic local statistics and rules do not require a language model.
<!-- capability:local-llm:Unsupported -->

The product direction keeps pause, privacy controls, export, correction, deletion
and local data protection outside premium gates. No regulatory certification or
independent cryptographic audit is claimed by this source bootstrap.
