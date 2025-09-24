import { UserKeyManager } from './UserKeyManager';

export class MasterKeyService {
  private userKeyManager: UserKeyManager;

  constructor(userKeyManager: UserKeyManager) {
    this.userKeyManager = userKeyManager;
  }

  /**
   * Kullanıcının ana parolasını ayarlar ve master anahtarını oluşturur/günceller.
   * @param userId Kullanıcı kimliği.
   * @param masterPassword Kullanıcının ana parolası.
   * @returns Başarılı olursa true.
   */
  async setMasterPassword(userId: string, masterPassword: string): Promise<boolean> {
    try {
      await this.userKeyManager.createUserKey(userId, masterPassword);
      return true;
    } catch (error) {
      console.error("Master parola ayarlanırken hata oluştu:", error);
      return false;
    }
  }

  /**
   * Kullanıcının master anahtarını ana parola ile doğrular.
   * @param userId Kullanıcı kimliği.
   * @param masterPassword Kullanıcının ana parolası.
   * @returns Doğrulama başarılı olursa anahtar, değilse null.
   */
  async verifyMasterPassword(userId: string, masterPassword: string): Promise<string | null> {
    return this.userKeyManager.retrieveUserKey(userId, masterPassword);
  }

  /**
   * Kullanıcının master anahtarını güvenli bir şekilde siler.
   * @param userId Kullanıcı kimliği.
   * @returns Başarılı olursa true.
   */
  async deleteMasterKey(userId: string): Promise<boolean> {
    try {
      await this.userKeyManager.deleteUserKey(userId);
      return true;
    } catch (error) {
      console.error("Master anahtar silinirken hata oluştu:", error);
      return false;
    }
  }

  // Anahtar rotasyonu için placeholder. Daha sonra implemente edilecek.
  async rotateMasterKey(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    console.warn("rotateMasterKey henüz implemente edilmedi.");
    // Mevcut anahtarı doğrula
    const currentKey = await this.userKeyManager.retrieveUserKey(userId, oldPassword);
    if (!currentKey) {
      console.error("Mevcut parola ile anahtar doğrulanamadı.");
      return false;
    }
    // Yeni parola ile yeni anahtar oluştur
    return this.setMasterPassword(userId, newPassword);
  }
} 