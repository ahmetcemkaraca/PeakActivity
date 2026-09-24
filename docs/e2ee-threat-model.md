# Sync threat model

**Status: Planned.** This document describes the candidate EPIC-06 E2EE protocol and
its limits. It is not evidence that a hosted relay, product build, or cryptographic
audit has passed. <!-- capability:e2ee-sync:Planned -->

The design protects activity content from a relay/storage operator, a network
observer, and an unauthorized tenant administrator. Device keys decrypt content only
on a device the user has explicitly verified. A compromised device while unlocked can
read local activity; encryption does not hide data from the user’s own unlocked endpoint.

The relay sees ciphertext, opaque object and vault IDs, protocol/key-epoch numbers,
ciphertext lengths, request timing, endpoint addresses, and whether an object is
created, fetched, or deleted. It does not receive bucket IDs, hostnames, event times,
titles, URLs, paths, categories, conflict values, account root keys, or vault data
keys. The ciphertext size and traffic timing may still reveal usage patterns.

A verified device holds the account root as well as its current vault key. A lost-
device response therefore rotates both keys; changing only the vault key would let
the lost device unwrap its replacement. Remaining devices must be verified again.
This protects future epochs only: it cannot erase keys or ciphertext the lost device
copied while trusted.

Tampering with an envelope fails authenticated decryption. Replayed or older
manifests are rejected against a locally persisted revision/hash high-water mark. A
new device receives the current head during verified pairing. A relay can withhold or
delete data and cause sync to fail; it cannot recover deleted ciphertext or force a
silent local rollback. Offline devices may temporarily have stale data until they
reconnect and acknowledge tombstones.

Device clock changes do not decide concurrent-edit winners. Sync operations use
logical counters and device IDs. Activity timestamps are preserved as recorded; the
current design performs no automatic device-clock correction. Multi-device alignment
is therefore disclosed as unknown when clocks cannot be verified.

The candidate has no production relay URL, release trust key, hosted tenant-auth
service, or independent cryptography review. Remote sync must remain unavailable until
those inputs and all platform/recovery checks are independently verified. Sync
ciphertext is a separate purpose from AI service requests; AI Off sends no AI requests.
