# Security limitations

The bootstrap is development source. It does not establish a reviewed installer,
authenticated local API, native credential lifecycle, safe database migration,
verified update channel or operational incident-response service.

Experimental: optional SQLCipher support is present in the Rust source. An ordinary
build does not enable it, and a build flag alone is insufficient evidence of secure
key generation, storage, recovery or deletion.
<!-- capability:sqlcipher:Experimental -->

Product release acceptance requires authenticated local access, verified dependency
and asset provenance, migration and recovery checks, negative privacy tests and
platform acceptance. A passing source-policy check only establishes the rules it
actually inspected. Follow [the reporting policy](../SECURITY.md) for disclosures.

The E2EE sync protocol is still Planned and unaudited. Its current threat model,
versioned protocol proposal, and crypto decision record are documented in the
[threat model](e2ee-threat-model.md), [protocol V1](e2ee-protocol-v1.md), and
[crypto ADR](crypto-adr.md). Those documents do not claim an available relay or a
production-ready cryptographic audit. <!-- capability:e2ee-sync:Planned -->
