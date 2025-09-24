import { Buffer } from 'buffer';
import { randomBytes, timingSafeEqual } from 'crypto';

export class CryptoUtils {
  /**
   * Belirtilen uzunlukta güvenli rastgele bayt dizisi üretir.
   * @param length Üretilecek bayt sayısı.
   * @returns Güvenli rastgele bayt dizisi.
   */
  static generateRandomBytes(length: number): Uint8Array {
    return randomBytes(length);
  }

  /**
   * İki Uint8Array dizisini zamanlama saldırılarına karşı güvenli bir şekilde karşılaştırır.
   * @param a Karşılaştırılacak ilk dizi.
   * @param b Karşılaştırılacak ikinci dizi.
   * @returns Diziler aynıysa true, değilse false.
   */
  static timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Bir anahtarın belirli bir uzunlukta olmasını ve boş olmamasını sağlar.
   * @param key Doğrulanacak anahtar.
   * @param expectedLength Beklenen anahtar uzunluğu (isteğe bağlı).
   * @returns Anahtar geçerliyse true, değilse false.
   */
  static isValidKey(key: Uint8Array, expectedLength?: number): boolean {
    if (!key || key.length === 0) {
      return false;
    }
    if (expectedLength && key.length !== expectedLength) {
      return false;
    }
    return true;
  }

  /**
   * Bir Uint8Array'ı Base64 stringine dönüştürür.
   * @param bytes Dönüştürülecek bayt dizisi.
   * @returns Base64 stringi.
   */
  static bytesToBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('base64');
  }

  /**
   * Bir Base64 stringini Uint8Array'a dönüştürür.
   * @param base64 Dönüştürülecek Base64 stringi.
   * @returns Uint8Array.
   */
  static base64ToBytes(base64: string): Uint8Array {
    return Buffer.from(base64, 'base64');
  }

  /**
   * 12 byte uzunluğunda IV üretir (AES-GCM için önerilen uzunluk).
   */
  static generateIv(): Buffer {
    return Buffer.from(this.generateRandomBytes(12));
  }

  /**
   * 32 byte uzunluğunda AES anahtarı üretir (AES-256 için).
   */
  static generateAesKey(): Buffer {
    return Buffer.from(this.generateRandomBytes(32));
  }

  /**
   * 32 byte uzunluğunda HMAC anahtarı üretir (HMAC-SHA256 için).
   */
  static generateHmacKey(): Buffer {
    return Buffer.from(this.generateRandomBytes(32));
  }

  /**
   * String'i Buffer'a dönüştürür.
   */
  static stringToBuffer(str: string): Buffer {
    return Buffer.from(str, 'utf-8');
  }

  /**
   * Buffer'ı string'e dönüştürür.
   */
  static bufferToString(buffer: Buffer): string {
    return buffer.toString('utf-8');
  }

  /**
   * Buffer'ı Base64 stringine dönüştürür (alias).
   */
  static bufferToBase64(buffer: Buffer): string {
    return this.bytesToBase64(buffer);
  }

  /**
   * Base64 stringini Buffer'a dönüştürür (alias).
   */
  static base64ToBuffer(base64: string): Buffer {
    return Buffer.from(this.base64ToBytes(base64));
  }

  /**
   * SHA256 hash fonksiyonu (hex string döner).
   */
  static async sha256(data: string): Promise<string> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * UUID v4 üretir.
   */
  static generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback: basit uuid v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
} 