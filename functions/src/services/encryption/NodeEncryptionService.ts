import { BaseEncryptionService } from './BaseEncryptionService';
import { CryptoUtils } from './CryptoUtils';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class NodeEncryptionService extends BaseEncryptionService {
  private readonly ALGORITHM = 'aes-256-gcm';

  async encrypt(data: string, key: string, iv: string): Promise<string> {
    const keyBuffer = CryptoUtils.base64ToBytes(key);
    const ivBuffer = CryptoUtils.base64ToBytes(iv);

    if (keyBuffer.length !== 32) {
      throw new Error('Anahtar 32 bayt olmalıdır (AES-256).');
    }
    if (ivBuffer.length !== 16) {
      // AES-GCM için 16 bayt IV (Nonce)
      throw new Error('IV 16 bayt olmalıdır.');
    }

    const cipher = createCipheriv(this.ALGORITHM, keyBuffer, ivBuffer);
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const tag = cipher.getAuthTag();

    // Şifreli veri, IV ve auth tag'ı birleştirip Base64 olarak döndür.
    return `${iv},${encrypted},${CryptoUtils.bytesToBase64(tag)}`;
  }

  async decrypt(encryptedDataWithMeta: string, key: string): Promise<string> {
    const parts = encryptedDataWithMeta.split(',');
    if (parts.length !== 3) {
      throw new Error('Geçersiz şifreli veri formatı.');
    }

    const iv = parts[0];
    const encryptedData = parts[1];
    const tag = parts[2];

    const keyBuffer = CryptoUtils.base64ToBytes(key);
    const ivBuffer = CryptoUtils.base64ToBytes(iv);
    const tagBuffer = CryptoUtils.base64ToBytes(tag);

    if (keyBuffer.length !== 32) {
      throw new Error('Anahtar 32 bayt olmalıdır (AES-256).');
    }
    if (ivBuffer.length !== 16) {
      throw new Error('IV 16 bayt olmalıdır.');
    }

    const decipher = createDecipheriv(this.ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(tagBuffer);

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async generateIv(): Promise<string> {
    return CryptoUtils.bytesToBase64(randomBytes(16)); // AES-GCM için 16 bayt IV
  }
}
