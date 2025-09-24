import { IndexedDBEncryption } from './IndexedDBEncryption';
import { EncryptionMetadata } from '../../../../functions/src/services/encryption/EncryptionMetadata';

interface CachedEncryptedData {
  id: string;
  encryptedData: string;
  metadata: EncryptionMetadata;
}

export class OfflineEncryptionCache {
  private indexedDBEncryption: IndexedDBEncryption;
  private cacheName: string = 'activity-data-cache'; // Önbellek için özel bir anahtar

  constructor(indexedDBEncryption: IndexedDBEncryption) {
    this.indexedDBEncryption = indexedDBEncryption;
  }

  setUserKey(key: string) {
    this.indexedDBEncryption.setUserKey(key);
  }

  /**
   * Şifrelenmiş veriyi çevrimdışı önbelleğe kaydeder.
   * @param id Veri öğesinin benzersiz kimliği.
   * @param encryptedData Şifrelenmiş veri (string).
   * @param metadata Şifreleme metadata'sı.
   */
  async cacheEncryptedData(id: string, encryptedData: string, metadata: EncryptionMetadata): Promise<void> {
    // IndexedDBEncryption zaten şifreleme ve meta veri yönetimini ele alıyor.
    // Burada sadece IndexedDBEncryption'ın setItem metodunu çağıracağız.
    const valueToStore = JSON.stringify({ encryptedData, metadata });
    await this.indexedDBEncryption.setItem(this.cacheName + '_' + id, valueToStore);
  }

  /**
   * Çevrimdışı önbellekten şifreli veriyi alır ve çözer.
   * @param id Veri öğesinin benzersiz kimliği.
   * @returns Çözülmüş ham veri (string) veya null.
   */
  async retrieveCachedData(id: string): Promise<string | null> {
    const storedValue = await this.indexedDBEncryption.getItem(this.cacheName + '_' + id);
    if (!storedValue) {
      return null;
    }
    // IndexedDBEncryption zaten çözümlemeyi yaptığı için burada tekrar parse etmeye gerek yok
    // Ancak format farklıysa, burada düzenleme yapılabilir.
    return storedValue; // getItem zaten decrypted data dönüyor
  }

  /**
   * Çevrimdışı önbellekten bir öğeyi siler.
   * @param id Silinecek öğenin kimliği.
   */
  async removeCachedData(id: string): Promise<void> {
    await this.indexedDBEncryption.removeItem(this.cacheName + '_' + id);
  }

  /**
   * Tüm çevrimdışı önbelleği temizler.
   */
  async clearCache(): Promise<void> {
    // IndexedDBEncryption'ın clear metodu tüm veritabanını temizler.
    // Sadece bu önbelleğe ait verileri temizlemek için daha spesifik bir implementasyon gerekebilir.
    // Şimdilik, tüm önbelleği temizleyelim.
    await this.indexedDBEncryption.clear();
  }
} 