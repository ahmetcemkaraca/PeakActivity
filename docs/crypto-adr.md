# Crypto ADR: Sync V1

**Status: Proposed; independent review required.**

- Use XChaCha20-Poly1305 for chunk authenticated encryption. Its 192-bit nonce gives
  a large random-nonce space; each chunk still gets a fresh nonce and authenticates a
  canonical protocol/object/vault/epoch header.
- Use X25519 for device key agreement. Pairing uses fresh ephemeral keys and an
  out-of-band verification code. Long-term device identity keys identify a device;
  they are not reused as ephemeral session keys.
- Use Argon2id version 19 for the offline recovery phrase, with the V1 parameters
  stated in the protocol document. Derivation limits and memory use must be checked
  on supported low-memory devices before release.
- Use random account root and per-vault epoch keys. Separate those keys from the
  local SQLCipher key, egress alias/approval keys, and any future AI credential.
- On lost-device revocation, rotate the account root as well as the vault epoch key;
  otherwise the lost device could unwrap a replacement key with its copied root.
  Remaining devices must be verified again before they receive the new key family.
- Use the existing `ring` HKDF and secure random APIs; add no custom cipher, KDF,
  nonce scheme, or hand-rolled cryptographic primitive.
- The planned reference implementation will use [RustCrypto XChaCha20-Poly1305](https://docs.rs/chacha20poly1305/0.11.0/chacha20poly1305/),
  [x25519-dalek](https://docs.rs/x25519-dalek/3.0.0/x25519_dalek/), and
  [RustCrypto Argon2](https://docs.rs/argon2/0.6.0/argon2/). These dependencies and
  parameters remain subject to independent cryptographic audit and platform timing
  tests before the capability can be marketed.
