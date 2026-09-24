# Sync protocol V1

**Status: Planned.** V1 is a public protocol proposal plus local reference-code
candidate. Do not treat it as an audited release protocol.

## Keys and envelopes

Each account has a random 32-byte root key. Each vault epoch has an independent
random 32-byte data key wrapped by the root key. The local SQLCipher key is separate
from both. Root/data keys remain inside the encrypted local vault or a verified
device's memory; they are never sent to a relay.

Each chunk is encrypted with XChaCha20-Poly1305. Every message uses a new random
24-byte nonce. The authenticated additional data is the byte concatenation
`PeakActivity-Sync-v1\0`, the schema version as big-endian `u32`, 16-byte object ID,
16-byte vault ID, and key epoch as big-endian `u64`. Changing any header field or
ciphertext makes authentication fail. The plaintext is capped at 1 MiB per chunk.

The relay object contains the protocol version, random opaque object ID, random
opaque vault ID, key epoch, nonce, and ciphertext plus tag. Bucket/device names,
event timestamps, payloads, correction values, tombstone contents, and conflict
records are inside encrypted chunks. Base64url is used only for the JSON envelope
representation.

## Pairing and recovery

Each device creates an X25519 identity. Pairing uses an invitation, response and
completed offer so each device contributes its own fresh ephemeral X25519 key and
neither side invents the other's private value. The completed offer includes both
device IDs and identity public keys, both ephemeral public keys, an opaque offer ID,
and a random 32-byte challenge. Both devices derive the same 8-digit verification
code from `SHA256("PeakActivity-Sync-Pairing-v1\0" || schema_version_u32_be ||
issuer_device_id_16 || recipient_device_id_16 || issuer_static_public_key_32 ||
recipient_static_public_key_32 || issuer_ephemeral_key_32 ||
recipient_ephemeral_key_32 || challenge_32)`: interpret the first four digest bytes
as big-endian `u32`, reduce modulo 100,000,000, and display as eight zero-padded
digits. The code is only an out-of-band comparison, never a key. Both native sides
require local confirmation and a transcript-bound peer confirmation before creating
or accepting a key transfer. A code or identity/ephemeral key mismatch, replayed
offer, or revoked device transfers no keys.

An offline recovery kit wraps the root key using Argon2id version 19 (64 MiB, 3
iterations, 4 lanes, 16-byte random salt), then encrypts the derived key package with
XChaCha20-Poly1305. Recovery is tested on a clean device. A wrong phrase, modified kit,
or failed restore preserves the active vault and input kit.

## Versions, conflicts, deletion

Objects are immutable. An encrypted manifest lists object IDs, key epoch, revision
and parent hash. Existing devices persist the highest accepted revision and reject
lower versions, malformed ancestry, duplicate operation IDs, and same-revision
forks. A first-time device obtains the current head during verified pairing.

Events are identified by their originating device ID and local event ID. Operations
are append-only and carry a per-device logical counter. Concurrent field changes
resolve by `(counter, device ID bytes)`; a tombstone wins a tie. Wall-clock time is
display metadata only. Capture/privacy/egress policy conflicts require a local user
choice. Tombstones remain until active devices acknowledge them or the user explicitly
removes an offline device.

Revoking a lost device rotates both the account root and the vault data key. Rotating
only the data key is insufficient because the lost device already holds the old
account root and could unwrap a new key wrapped by it. Remaining devices become stale
and must complete verified pairing again before receiving the new root and epoch.
Revocation prevents access to future epochs; it cannot erase ciphertext or keys
already copied by a lost device.

## Relay contract

Hosted relay, S3, WebDAV, NAS and local-folder adapters use the same immutable opaque
object operations: `put_if_absent`, `get`, `list_opaque_heads`, and
`delete_after_tombstone`. File adapters use only opaque object IDs as filenames and
an atomic no-replace write. A delete is refused until every active device in the
current key epoch has acknowledged the corresponding tombstone.

Remote HTTP uses one versioned request envelope and passes through the signed
destination registry and outbound gateway with the exact `sync-object-v1` purpose.
The request exposes only the operation, opaque object/vault IDs, key epoch, and an
optional `SyncEnvelopeV1`; tombstone proofs and activity identifiers stay on the
verified client. List results use an opaque object-ID cursor and bounded pages.
Responses contain only opaque IDs and encrypted envelopes.
Sending requires explicit local sync consent for that destination/purpose, a saved
recovery kit, a verified current-epoch device, and the global outbound kill switch
off; key rotation, recovery and revocation turn consent off. The server's loopback
object routes require an Admin-scoped session and store only ciphertext and opaque
metadata. This candidate has no configured remote destination or release signing key,
so it must report remote sync unavailable and send zero requests.
