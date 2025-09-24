import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

export class KeyDerivationService {
  async deriveKey(password: string, salt?: Uint8Array): Promise<{ key: string; salt: Uint8Array }> {
    const s = salt || randomBytes(16); // 16 bytes (128 bits) salt
    const key = await argon2.hash(password, {
      salt: s,
      type: argon2.argon2id, // Recommended for password hashing
      memoryCost: 65536, // 64MB
      timeCost: 3,        // 3 iterations
      parallelism: 1,
      hashLength: 32,     // 32 bytes (256 bits) key
      raw: true,
    });
    return { key: Buffer.from(key).toString('base64'), salt: s };
  }

  async verifyKey(password: string, hash: string, salt: Uint8Array): Promise<boolean> {
    return argon2.verify(Buffer.from(hash, 'base64'), password, { salt, type: argon2.argon2id });
  }

  async generateSalt(length: number = 16): Promise<Uint8Array> {
    return randomBytes(length);
  }
} 