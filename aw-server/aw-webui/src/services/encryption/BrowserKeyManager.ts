import { UserKeyManager } from '../../../../functions/src/services/encryption/UserKeyManager';
import { KeyDerivationService } from '../../../../functions/src/services/encryption/KeyDerivationService';
import { LocalStorageEncryption } from './LocalStorageEncryption';

export class BrowserKeyManager {
  private userKeyManager: UserKeyManager;
  private localStorageEncryption: LocalStorageEncryption;

  constructor(
    keyDerivationService: KeyDerivationService,
    localStorageEncryption: LocalStorageEncryption
  ) {
    // Note: We are creating a new instance of UserKeyManager here.
    // In a real application, you might want a more sophisticated dependency injection system
    // or pass an already initialized instance if it manages server-side keys.
    // For now, we are assuming this BrowserKeyManager is responsible for managing
    // client-side derived keys which might or might not be synced to a backend.
    this.userKeyManager = new UserKeyManager(keyDerivationService, localStorageEncryption); // LocalStorageEncryption SecureStorageService'in bir implementasyonu olarak kabul ediliyor
    this.localStorageEncryption = localStorageEncryption;
  }

  /**
   * Tarayıcıda bir kullanıcı için anahtar oluşturur ve saklar.
   * @param userId Kullanıcı kimliği.
   * @param masterPassword Kullanıcının ana parolası.
   * @returns Anahtarın Base64 stringi.
   */
  async setupBrowserKey(userId: string, masterPassword: string): Promise<string> {
    // UserKeyManager zaten anahtarı güvenli bir şekilde saklayacak (LocalStorageEncryption kullanarak)
    const userKey = await this.userKeyManager.createUserKey(userId, masterPassword);
    this.localStorageEncryption.setUserKey(userKey); // localStorageEncryption'ın kullanacağı anahtarı ayarla
    return userKey;
  }

  /**
   * Tarayıcıda saklanan kullanıcı anahtarını doğrular ve döndürür.
   * @param userId Kullanıcı kimliği.
   * @param masterPassword Kullanıcının ana parolası.
   * @returns Anahtarın Base64 stringi veya null.
   */
  async retrieveBrowserKey(userId: string, masterPassword: string): Promise<string | null> {
    const userKey = await this.userKeyManager.retrieveUserKey(userId, masterPassword);
    if (userKey) {
      this.localStorageEncryption.setUserKey(userKey);
    }
    return userKey;
  }

  /**
   * Tarayıcıdaki kullanıcı anahtarını ve ilişkili tüm şifreli verileri siler.
   * @param userId Kullanıcı kimliği.
   */
  async clearBrowserData(userId: string): Promise<void> {
    await this.userKeyManager.deleteUserKey(userId); // Anahtarı local storage'dan sil
    this.localStorageEncryption.clear(); // Tüm şifreli local storage verilerini sil
    this.localStorageEncryption.setUserKey(''); // Anahtarı temizle
  }
} 