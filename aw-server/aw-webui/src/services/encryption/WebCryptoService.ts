import { BaseEncryptionService } from '../../../../functions/src/services/encryption/BaseEncryptionService';
import { EncryptionMetadata } from '../../../../functions/src/services/encryption/EncryptionMetadata';
import { CryptoUtils } from '../../../../functions/src/services/encryption/CryptoUtils';

export class WebCryptoService extends BaseEncryptionService {
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  constructor() {
    super();
  }

  async encrypt(data: string, key: string, iv: string): Promise<string> {
    const encodedData = this.encoder.encode(data);
    const importedKey = await this.importKey(key);
    const ivBytes = CryptoUtils.base64ToBytes(iv);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      importedKey,
      encodedData
    );
    return CryptoUtils.bytesToBase64(new Uint8Array(encrypted));
  }

  async decrypt(encryptedData: string, key: string, iv: string): Promise<string> {
    const encryptedBytes = CryptoUtils.base64ToBytes(encryptedData);
    const importedKey = await this.importKey(key);
    const ivBytes = CryptoUtils.base64ToBytes(iv);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      importedKey,
      encryptedBytes
    );
    return this.decoder.decode(decrypted);
  }

  private async importKey(base64Key: string): Promise<CryptoKey> {
    const keyBytes = CryptoUtils.base64ToBytes(base64Key);
    return crypto.subtle.importKey(
      'raw',
      keyBytes,
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async generateIv(): Promise<string> {
    const iv = CryptoUtils.generateRandomBytes(16); // AES-GCM için 16 bayt IV (nonce)
    return CryptoUtils.bytesToBase64(iv);
  }
}
