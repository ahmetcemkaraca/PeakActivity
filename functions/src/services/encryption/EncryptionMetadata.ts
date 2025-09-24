import { EncryptionTypes } from './EncryptionTypes';

export interface EncryptionMetadata {
  algorithm: EncryptionTypes;
  iv: string; // Base64 encoded IV
  salt?: string; // Base64 encoded salt (e.g., for key derivation)
  version: string; // Encryption scheme version
  additionalAuthenticatedData?: string; // Base64 encoded AAD
}
