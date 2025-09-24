import { ClientSideEncryption } from './ClientSideEncryption';
import { EncryptionMetadata } from '../../../../functions/src/services/encryption/EncryptionMetadata';

interface EncryptedIndexedDBEntry {
  encryptedData: string;
  metadata: EncryptionMetadata;
}

export class IndexedDBEncryption {
  private dbName: string = 'PeakActivityEncryptedDB';
  private storeName: string = 'encryptedData';
  private db: IDBDatabase | null = null;
  private clientSideEncryption: ClientSideEncryption;
  private userKey: string | null = null;

  constructor(clientSideEncryption: ClientSideEncryption) {
    this.clientSideEncryption = clientSideEncryption;
  }

  setUserKey(key: string) {
    this.userKey = key;
  }

  private async openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = event => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = event => {
        console.error('IndexedDB açılırken hata:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  /**
   * Veriyi şifreler ve IndexedDB'ye kaydeder.
   * @param id Veri öğesinin benzersiz kimliği.
   * @param value Şifrelenecek veri (string).
   */
  async setItem(id: string, value: string): Promise<void> {
    if (!this.userKey) {
      throw new Error('Kullanıcı anahtarı ayarlanmamış. Şifreleme yapılamaz.');
    }
    const db = await this.openDb();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    const { encryptedData, metadata } = await this.clientSideEncryption.encryptActivityData(
      value,
      this.userKey
    );
    const entry: EncryptedIndexedDBEntry & { id: string } = { id, encryptedData, metadata };

    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = event => {
        console.error("IndexedDB'ye veri yazılırken hata:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  /**
   * IndexedDB'den şifreli veriyi alır ve çözer.
   * @param id Veri öğesinin benzersiz kimliği.
   * @returns Çözülmüş veri (string) veya null.
   */
  async getItem(id: string): Promise<string | null> {
    if (!this.userKey) {
      throw new Error('Kullanıcı anahtarı ayarlanmamış. Şifre çözme yapılamaz.');
    }
    const db = await this.openDb();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = async () => {
        const entry: EncryptedIndexedDBEntry = request.result;
        if (entry) {
          try {
            const decryptedData = await this.clientSideEncryption.decryptActivityData(
              entry.encryptedData,
              entry.metadata,
              this.userKey!
            );
            resolve(decryptedData);
          } catch (e) {
            console.error("IndexedDB'den veri çözerken hata:", e);
            reject(e);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = event => {
        console.error("IndexedDB'den veri okunurken hata:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  /**
   * IndexedDB'den bir öğeyi siler.
   * @param id Silinecek öğenin kimliği.
   */
  async removeItem(id: string): Promise<void> {
    const db = await this.openDb();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = event => {
        console.error("IndexedDB'den veri silinirken hata:", (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  /**
   * IndexedDB'deki tüm verileri siler.
   */
  async clear(): Promise<void> {
    const db = await this.openDb();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = event => {
        console.error('IndexedDB verileri temizlenirken hata:', (event.target as IDBRequest).error);
        reject((event.target as IDBRequest).error);
      };
    });
  }
}
