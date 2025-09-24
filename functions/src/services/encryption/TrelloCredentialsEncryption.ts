import { TrelloCredentials } from '../../types/external-credentials.d';
import { EncryptionMetadata } from './EncryptionMetadata';
import { UserKeyManager } from './UserKeyManager';
import { BaseEncryptionService } from './BaseEncryptionService'; // Temel şifreleme servisi

export class TrelloCredentialsEncryption {
  private userKeyManager: UserKeyManager;
  private encryptionService: BaseEncryptionService;

  constructor(userKeyManager: UserKeyManager, encryptionService: BaseEncryptionService) {
    this.userKeyManager = userKeyManager;
    this.encryptionService = encryptionService;
  }

  /**
   * Trello kimlik bilgilerini şifreler.
   * @param userId Kullanıcının kimliği.
   * @param trelloApiKey Trello API Anahtarı.
   * @param trelloToken Trello Token.
   * @returns Şifrelenmiş TrelloCredentials nesnesi.
   */
  public async encryptTrelloCredentials(
    userId: string,
    trelloApiKey: string,
    trelloToken: string
  ): Promise<TrelloCredentials> {
    console.log(`Kullanıcı ${userId} için Trello kimlik bilgileri şifreleniyor.`);

    const masterKey = await this.userKeyManager.getMasterKey(userId);
    if (!masterKey) {
      throw new Error('Ana anahtar bulunamadı. Lütfen önce bir ana anahtar oluşturun.');
    }

    const payload = JSON.stringify({
      apiKey: trelloApiKey,
      token: trelloToken,
    });

    const encryptionResult = await this.encryptionService.encrypt(payload, masterKey); // masterKey kullanılarak şifrele

    const encryptedCredentials: TrelloCredentials = {
      encryptedPayload: encryptionResult.encryptedData,
      encryptionMetadata: encryptionResult.metadata,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`Kullanıcı ${userId} için Trello kimlik bilgileri başarıyla şifrelendi.`);
    return encryptedCredentials;
  }

  /**
   * Şifrelenmiş Trello kimlik bilgilerini çözer.
   * @param userId Kullanıcının kimliği.
   * @param encryptedCredentials Şifrelenmiş TrelloCredentials nesnesi.
   * @returns Çözülmüş kimlik bilgileri (apiKey, token) içeren bir nesne.
   */
  public async decryptTrelloCredentials(
    userId: string,
    encryptedCredentials: TrelloCredentials
  ): Promise<{ apiKey: string; token: string }> {
    console.log(`Kullanıcı ${userId} için Trello kimlik bilgileri çözülüyor.`);

    const masterKey = await this.userKeyManager.getMasterKey(userId);
    if (!masterKey) {
      throw new Error('Ana anahtar bulunamadı. Lütfen önce bir ana anahtar oluşturun.');
    }

    const decryptedPayload = await this.encryptionService.decrypt(
      encryptedCredentials.encryptedPayload,
      encryptedCredentials.encryptionMetadata,
      masterKey
    );

    const credentials = JSON.parse(decryptedPayload);
    console.log(`Kullanıcı ${userId} için Trello kimlik bilgileri başarıyla çözüldü.`);
    return credentials;
  }
}
