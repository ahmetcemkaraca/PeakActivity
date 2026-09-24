# Local API baseline

Available: the inherited bucket/event HTTP API under `/api/0`. This is an upstream
compatibility surface, not a new versioned PeakActivity API promise.
<!-- capability:local-api:Available -->

Both Python and Rust server implementations exist. Buckets group events; events
carry a timestamp, duration and data object. Collectors send heartbeat updates.
The server also exposes query and settings operations. Consult the implementation
for the exact routes of the selected server revision.

Never expose a development server to a public interface. A loopback address alone
does not establish caller authorization. Scoped product tokens, endpoint permission
separation and the complete local authentication contract are still pending.

Do not put credentials in query strings, URLs, logs or example payloads. Examples
and tests must use synthetic event data. The desktop's embedded server revision
must be recorded separately from the top-level Rust module revision.
