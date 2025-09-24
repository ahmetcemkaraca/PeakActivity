# Key Management Technical Guide

## 1. Introduction
This document provides a detailed technical guide to the Key Management System (KMS) implemented in PeakActivity. The KMS is crucial for ensuring the confidentiality and integrity of user data, both local and in the cloud, by managing encryption keys securely.

## 2. Key Management Architecture

The PeakActivity Key Management System is designed with a multi-layered approach to provide robust security and user control over their data.

### 2.1. Master Password System
- **Purpose:** The master password serves as the primary authentication factor for deriving user-specific encryption keys. It is never stored directly.
- **Key Derivation Function (KDF):** Argon2id is used as the KDF to convert the user's master password into a strong, cryptographically secure master key. Argon2id is chosen for its resistance against brute-force and side-channel attacks.
  - **Parameters:** Minimum 3 passes and 64MB of memory are used during derivation to ensure computational intensity.

### 2.2. User-Specific Keys
- **Generation:** From the derived master key, unique, user-specific encryption keys are generated for different data types or purposes (e.g., activity data, external service credentials).
- **Scope:** Each user has their own set of keys, ensuring data isolation.

### 2.3. Key Storage
- **Principle:** Encryption keys are never stored in plaintext. They are protected using the operating system's secure storage mechanisms.
- **OS Keychain Integration:**
  - **Windows:** Windows Credential Store is utilized.
  - **macOS:** macOS Keychain is utilized.
  - **Linux:** Linux Secret Service (e.g., GNOME Keyring, KWallet) is utilized.
- **Benefits:** This integration leverages OS-level security features, such as hardware-backed storage and user session locking, to protect sensitive keys.

### 2.4. Key Rotation
- **Mechanism:** An automatic key rotation mechanism is implemented to enhance forward secrecy and limit the impact of a potential key compromise.
- **Frequency:** Keys are rotated quarterly.
- **Process:** During rotation, old keys are used to decrypt existing encrypted data, and new keys are then used to re-encrypt the data. This process ensures data remains accessible under the new key.

## 3. Core Services and Their Interactions

The following services play a critical role in the Key Management System:

### 3.1. `MasterKeyService` (`functions/src/services/encryption/MasterKeyService.ts`)
- **Purpose:** Manages the lifecycle of the user's master key, including setting, verifying, and deleting it.
- **Dependencies:** Relies on `SecureStorageService` for secure storage and `KeyDerivationService` for key derivation.

### 3.2. `KeyRotationService` (`functions/src/services/encryption/KeyRotationService.ts`)
- **Purpose:** Orchestrates the rotation of user encryption keys and re-encryption of associated data.
- **Dependencies:** Interacts with `MasterKeyService` to retrieve current keys and `SecureStorageService` to manage encrypted data, and `NodeEncryptionService` for encryption/decryption operations.

### 3.3. `KeyRecoveryService` (`functions/src/services/KeyRecoveryService.ts`)
- **Purpose:** Provides mechanisms for users to recover their master key in case it is lost or forgotten.
- **Dependencies:** Relies on `SecureStorageService` to access stored recovery information (e.g., security question hashes, backup codes).

### 3.4. `UserKeyManager` (`functions/src/services/encryption/UserKeyManager.ts`)
- **Purpose:** A high-level abstraction for managing user-specific encryption keys derived from the master key.
- **Dependencies:** Utilizes `KeyDerivationService` and interacts with a storage mechanism (e.g., `SecureStorageService` or a mock in frontend contexts).

### 3.5. `KeyDerivationService` (`functions/src/services/encryption/KeyDerivationService.ts`)
- **Purpose:** Implements the Argon2id KDF to securely derive encryption keys from passwords or other secrets.

### 3.6. `SecureStorageService` (`functions/src/services/encryption/SecureStorageService.ts`)
- **Purpose:** Provides a secure interface for storing and retrieving sensitive encrypted data, typically backed by Firestore or other persistent storage.

## 4. Interaction Flow Examples

### 4.1. Setting up a Master Password
1. User provides a master password via the `MasterPasswordSetup.vue` component.
2. The component sends an API request to `/api/encryption/master-password-setup` with `userId` and `password`.
3. On the backend, `MasterKeyService` receives the request.
4. `MasterKeyService` uses `KeyDerivationService` to derive a master key from the password.
5. The derived master key is securely stored using `SecureStorageService` (e.g., in Firestore, encrypted). The plaintext password is never stored.

### 4.2. Rotating Encryption Keys
1. User initiates key rotation from `EncryptionSettings.vue`.
2. An API request is sent to `/api/encryption/rotate-keys` with `userId`, `oldPassword`, and `newPassword`.
3. On the backend, `KeyRotationService` handles the request.
4. `KeyRotationService` uses `MasterKeyService` to verify the `oldPassword` and retrieve the current master key.
5. A new master key is derived from `newPassword`.
6. All user data previously encrypted with the old key is decrypted and then re-encrypted with the new key, utilizing `NodeEncryptionService`.
7. The new master key replaces the old one in `SecureStorageService`.

### 4.3. Key Recovery
1. User initiates key recovery via `KeyRecoveryWizard.vue`.
2. An API request is sent to `/api/encryption/key-recovery` with `userId`, `recoveryMethod`, and `recoveryData`.
3. On the backend, `KeyRecoveryService` processes the request.
4. Based on the `recoveryMethod` (e.g., security questions, backup codes), `KeyRecoveryService` verifies the provided `recoveryData` against securely stored recovery credentials (e.g., bcrypt hashes of security answers from `SecurityQuestionService`).
5. Upon successful verification, the master key is restored or re-derived, allowing the user to regain access.

## 5. Security Considerations

- **Zero-Knowledge:** The server side is designed to operate on encrypted data without ever having access to the user's master password in plaintext.
- **Data Classification:** Strict adherence to data classification levels ensures that data is only processed or transmitted at appropriate encryption levels, based on user consent.
- **Regular Audits:** The key management system and its implementation will undergo regular security audits and penetration testing.

## 6. Future Enhancements

- Integration with hardware security modules (HSMs) for enhanced key protection.
- Support for more advanced recovery methods like verifiable credentials. 