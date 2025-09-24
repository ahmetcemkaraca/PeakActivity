import { KeyDerivationService } from './KeyDerivationService';
import { SecureStorageService } from './SecureStorageService';
import { CryptoUtils } from './CryptoUtils';

export class UserKeyManager {
  private keyDerivationService: KeyDerivationService;
  private secureStorageService: SecureStorageService;

  constructor(keyDerivationService: KeyDerivationService, secureStorageService: SecureStorageService) {
    this.keyDerivationService = keyDerivationService;
    this.secureStorageService = secureStorageService;
  }

  /**
   * Kullanıcıya özel bir şifreleme anahtarı türetir ve güvenli bir şekilde saklar.
   * @param userId Anahtarın ilişkilendirileceği kullanıcı kimliği.
   * @param masterPassword Kullanıcının ana parolası.
   * @returns Türetilen anahtarın Base64 stringi.
   */
  async createUserKey(userId: string, masterPassword: string): Promise<string> {
    const salt = await this.keyDerivationService.generateSalt();
    const { key } = await this.keyDerivationService.deriveKey(masterPassword, salt);
    const keyMetadata = { key, salt: CryptoUtils.bytesToBase64(salt) };
    await this.secureStorageService.store(`user_key_${userId}`, JSON.stringify(keyMetadata));
    return key;
  }

  /**
   * Saklanan kullanıcı anahtarını getirir.
   * @param userId Anahtarın ilişkilendirildiği kullanıcı kimliği.
   * @param masterPassword Kullanıcının ana parolası (anahtarı doğrulamak için).
   * @returns Türetilen anahtarın Base64 stringi veya null.
   */
  async retrieveUserKey(userId: string, masterPassword: string): Promise<string | null> {
    const storedKeyMetadata = await this.secureStorageService.retrieve(`user_key_${userId}`);
    if (!storedKeyMetadata) {
      return null;
    }
    const { key, salt } = JSON.parse(storedKeyMetadata);
    const saltBytes = CryptoUtils.base64ToBytes(salt);

    // Anahtarı doğrula
    const isValid = await this.keyDerivationService.verifyKey(masterPassword, key, saltBytes);
    if (!isValid) {
      console.error("Anahtar doğrulaması başarısız oldu.");
      return null;
    }

    return key;
  }

  /**
   * Kullanıcı anahtarını güvenli depolamadan siler.
   * @param userId Silinecek anahtarın ilişkilendirildiği kullanıcı kimliği.
   */
  async deleteUserKey(userId: string): Promise<void> {
    await this.secureStorageService.delete(`user_key_${userId}`);
  }

  /**
   * Güvenli depolamadan saklanan kullanıcı anahtarını master password olmadan getirir.
   * Bu metodun çağrılmadan önce kullanıcının kimlik doğrulamasının yapıldığı varsayılır.
   * @param userId Anahtarın ilişkilendirildiği kullanıcı kimliği.
   * @returns Türetilen anahtarın Base64 stringi veya null.
   */
  async getStoredUserKey(userId: string): Promise<string | null> {
    const storedKeyMetadata = await this.secureStorageService.retrieve(`user_key_${userId}`);
    if (!storedKeyMetadata) {
      return null;
    }
    const { key } = JSON.parse(storedKeyMetadata);
    return key;
  }
} 