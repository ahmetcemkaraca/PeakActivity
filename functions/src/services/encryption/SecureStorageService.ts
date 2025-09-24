
export abstract class SecureStorageService {
  /**
   * Bu soyut sınıf, güvenli depolama işlemleri için bir arayüz tanımlar.
   * Somut implementasyonlar platforma özel olacaktır (örn. tarayıcı için IndexedDB, masaüstü için OS anahtar zinciri).
   */
  abstract store(key: string, value: string): Promise<void>;
  abstract retrieve(key: string): Promise<string | null>;
  abstract delete(key: string): Promise<void>;
} 