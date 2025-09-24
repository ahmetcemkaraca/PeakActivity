import { UserKeyManager } from './UserKeyManager';
import { BaseEncryptionService } from './BaseEncryptionService';
import { ExternalCredential, EncryptionMetadata } from '../../types/external-credentials.d';
import { CryptoUtils } from './CryptoUtils';
import * as admin from 'firebase-admin'; // firebase-admin'i tamamen import ettim

export class OAuthTokenManager {
  private userKeyManager: UserKeyManager;
  private encryptionService: BaseEncryptionService;
  private firestore: admin.firestore.Firestore;

  constructor(userKeyManager: UserKeyManager, encryptionService: BaseEncryptionService) {
    this.userKeyManager = userKeyManager;
    this.encryptionService = encryptionService;
    this.firestore = admin.firestore(); // Firestore instance'ını burada başlat
  }

  /**
   * OAuth tokenlarını şifreler ve kaydeder.
   * @param userId Kullanıcının kimliği.
   * @param serviceName Bağlı olunan hizmetin adı (örn. "google", "trello").
   * @param tokens Şifrelenecek token nesnesi (örn. { accessToken: string, refreshToken: string }).
   * @returns Şifrelenmiş ExternalCredential nesnesi.
   */
  public async encryptAndSaveTokens(
    userId: string,
    serviceName: string,
    tokens: any
  ): Promise<ExternalCredential> {
    console.log(`Kullanıcı ${userId} için ${serviceName} OAuth tokenları şifreleniyor.`);

    const masterKey = await this.userKeyManager.getStoredUserKey(userId);
    if (!masterKey) {
      throw new Error(
        'Ana anahtar bulunamadı. Lütfen önce bir ana anahtar oluşturun veya oturum açın.'
      );
    }

    const payload = JSON.stringify(tokens);
    const iv = CryptoUtils.generateRandomBytes(16); // 16 bytes for AES-256-GCM
    const salt = CryptoUtils.generateRandomBytes(16); // Tuz için 16 bayt

    const encryptedPayload = await this.encryptionService.encrypt(
      payload,
      masterKey,
      CryptoUtils.bytesToBase64(iv)
    );

    const encryptedCredentials: ExternalCredential = {
      encryptedPayload: encryptedPayload,
      encryptionMetadata: {
        algorithm: 'AES-256-GCM', // Standartlara göre algoritma
        iv: CryptoUtils.bytesToBase64(iv),
        salt: CryptoUtils.bytesToBase64(salt), // Tuz ekle
        version: '1.0', // Versiyon ekle
      },
      lastUpdated: new Date().toISOString(),
    };

    // Şifrelenmiş kimlik bilgilerini güvenli bir şekilde depola (Firestore).
    await this.firestore
      .collection('users')
      .doc(userId)
      .collection('externalCredentials')
      .doc(serviceName)
      .set(encryptedCredentials);

    console.log(
      `Kullanıcı ${userId} için ${serviceName} OAuth tokenları başarıyla şifrelendi ve kaydedildi.`
    );
    return encryptedCredentials;
  }

  /**
   * Şifrelenmiş OAuth tokenlarını çözer.
   * @param userId Kullanıcının kimliği.
   * @param serviceName Bağlı olunan hizmetin adı.
   * @param encryptedCredentials Şifrelenmiş ExternalCredential nesnesi.
   * @returns Çözülmüş token nesnesi (örn. { accessToken: string, refreshToken: string }).
   */
  public async decryptTokens(
    userId: string,
    serviceName: string,
    encryptedCredentials: ExternalCredential
  ): Promise<any> {
    console.log(`Kullanıcı ${userId} için ${serviceName} OAuth tokenları çözülüyor.`);

    const masterKey = await this.userKeyManager.getStoredUserKey(userId);
    if (!masterKey) {
      throw new Error(
        'Ana anahtar bulunamadı. Lütfen önce bir ana anahtar oluşturun veya oturum açın.'
      );
    }

    if (!encryptedCredentials.encryptionMetadata || !encryptedCredentials.encryptionMetadata.iv) {
      throw new Error('Şifreleme metadata veya IV eksik.');
    }
    const iv = encryptedCredentials.encryptionMetadata.iv;

    const decryptedPayload = await this.encryptionService.decrypt(
      encryptedCredentials.encryptedPayload,
      masterKey,
      iv
    );

    const tokens = JSON.parse(decryptedPayload);
    console.log(`Kullanıcı ${userId} için ${serviceName} OAuth tokenları başarıyla çözüldü.`);
    return tokens;
  }

  /**
   * Bir kullanıcının belirli bir hizmet için mevcut OAuth tokenlarını alır.
   * @param userId Kullanıcının kimliği.
   * @param serviceName Bağlı olunan hizmetin adı.
   * @returns ExternalCredential nesnesi veya null.
   */
  public async getEncryptedTokens(
    userId: string,
    serviceName: string
  ): Promise<ExternalCredential | null> {
    console.log(`Kullanıcı ${userId} için ${serviceName} şifrelenmiş tokenları alınıyor.`);
    const doc = await this.firestore
      .collection('users')
      .doc(userId)
      .collection('externalCredentials')
      .doc(serviceName)
      .get();
    return doc.exists ? (doc.data() as ExternalCredential) : null;
  }

  /**
   * OAuth tokenlarını yeniler.
   * @param userId Kullanıcının kimliği.
   * @param serviceName Bağlı olunan hizmetin adı.
   * @param currentRefreshToken Mevcut yenileme jetonu.
   * @returns Yenilenmiş tokenları içeren ExternalCredential nesnesi.
   */
  public async refreshAccessToken(
    userId: string,
    serviceName: string,
    currentRefreshToken: string
  ): Promise<ExternalCredential> {
    console.log(`Kullanıcı ${userId} için ${serviceName} erişim tokenı yenileniyor.`);
    // TODO: OAuth sağlayıcısının API'sini kullanarak erişim tokenını yenile.
    // Yenilenen tokenları şifrele ve kaydet.

    // Örnek yenilenmiş tokenlar (yer tutucu)
    const newAccessToken = `new_access_token_${CryptoUtils.bytesToBase64(CryptoUtils.generateRandomBytes(8))}`;
    const newExpiryDate = Date.now() + 3600 * 1000; // 1 saat sonra sona erecek

    const newTokens = {
      accessToken: newAccessToken,
      refreshToken: currentRefreshToken, // Yenileme tokenı değişmeyebilir
      expiryDate: newExpiryDate,
    };

    return this.encryptAndSaveTokens(userId, serviceName, newTokens);
  }

  /**
   * Bir kullanıcının belirli bir hizmet için OAuth tokenlarını siler.
   * @param userId Kullanıcının kimliği.
   * @param serviceName Bağlı olunan hizmetin adı.
   * @returns Silme başarılı olursa true, aksi takdirde false.
   */
  public async deleteTokens(userId: string, serviceName: string): Promise<boolean> {
    console.log(`Kullanıcı ${userId} için ${serviceName} OAuth tokenları siliniyor.`);
    await this.firestore
      .collection('users')
      .doc(userId)
      .collection('externalCredentials')
      .doc(serviceName)
      .delete();
    return true;
  }
}
