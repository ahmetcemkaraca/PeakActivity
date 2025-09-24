export abstract class BaseEncryptionService {
  abstract encrypt(data: string, key: string, iv: string): Promise<string>;
  abstract decrypt(encryptedData: string, key: string, iv: string): Promise<string>;
  abstract generateIv(): Promise<string>; // Yeni eklenen metod

  // Ortak yardımcı fonksiyonlar veya varsayılan implementasyonlar eklenebilir
  protected generateRandomBytes(length: number): Uint8Array {
    const arr = new Uint8Array(length);
    crypto.getRandomValues(arr);
    return arr;
  }

  protected bytesToBase64(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('base64');
  }

  protected base64ToBytes(base64: string): Uint8Array {
    return Buffer.from(base64, 'base64');
  }
}
