# Documentation

This documentation describes the pre-alpha source bootstrap. It is English-only
and does not advertise a production download or supported device release.

- [Build](build.md)
- [Usage](usage.md)
- [API](api.md)
- [Privacy](privacy.md)
- [Security](security.md)
- [Provenance](provenance.md)
- [Source export](source.md)
- [Roadmap](roadmap.md)
- [Capability registry](capabilities.json)
- [Product experience contract](experience.json)

## Capability status contract

Available means implemented in the specified source scope. Beta means implemented
with a stated beta support contract. Experimental means a limited foundation or
prototype. Planned means a requirement without a shipped implementation.
Unsupported means outside the product's supported behavior.

The registry is authoritative. A capability paragraph carries an adjacent
`<!-- capability:identifier:Status -->` annotation in the same paragraph. Each
non-Available claim must state its status in visible text. Do not turn a source
feature, research checkout or passing unit test into a release claim.
