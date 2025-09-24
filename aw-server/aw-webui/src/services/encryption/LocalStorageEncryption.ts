import { ClientSideEncryption } from './ClientSideEncryption';
import { EncryptionMetadata } from '../../../../functions/src/services/encryption/EncryptionMetadata';

export class LocalStorageEncryption {
  private clientSideEncryption: ClientSideEncryption;
  private userKey: string | null = null;

  constructor(clientSideEncryption: ClientSideEncryption) {
    this.clientSideEncryption = clientSideEncryption;
  }

  setUserKey(key: string) {
    this.userKey = key;
  }

  /**
   * Veriyi şifreler ve localStorage'a kaydeder.
   * @param key Depolama anahtarı.
   * @param value Şifrelenecek veri (string).
   */
  async setItem(key: string, value: string): Promise<void> {
    if (!this.userKey) {
      throw new Error("Kullanıcı anahtarı ayarlanmamış. Şifreleme yapılamaz.");
    }
    const { encryptedData, metadata } = await this.clientSideEncryption.encryptActivityData(value, this.userKey);
    const storedValue = JSON.stringify({ encryptedData, metadata });
    localStorage.setItem(key, storedValue);
  }

  /**
   * localStorage'dan şifreli veriyi alır ve çözer.
   * @param key Depolama anahtarı.
   * @returns Çözülmüş veri (string) veya null.
   */
  async getItem(key: string): Promise<string | null> {
    if (!this.userKey) {
      throw new Error("Kullanıcı anahtarı ayarlanmamış. Şifre çözme yapılamaz.");
    }
    const storedValue = localStorage.getItem(key);
    if (!storedValue) {
      return null;
    }
    const { encryptedData, metadata } = JSON.parse(storedValue);
    return this.clientSideEncryption.decryptActivityData(encryptedData, metadata, this.userKey);
  }

  /**
   * localStorage'dan bir öğeyi siler.
   * @param key Silinecek öğenin anahtarı.
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * localStorage'daki tüm öğeleri siler.
   */
  clear(): void {
    localStorage.clear();
  }
} 