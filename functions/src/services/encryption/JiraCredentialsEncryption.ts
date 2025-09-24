import { JiraCredentials } from '../../types/external-credentials.d';
import { EncryptionMetadata } from './EncryptionMetadata';
import { UserKeyManager } from './UserKeyManager';
import { BaseEncryptionService } from './BaseEncryptionService';

export class JiraCredentialsEncryption {
  private userKeyManager: UserKeyManager;
  private encryptionService: BaseEncryptionService;

  constructor(userKeyManager: UserKeyManager, encryptionService: BaseEncryptionService) {
    this.userKeyManager = userKeyManager;
    this.encryptionService = encryptionService;
  }

  /**
   * Jira kimlik bilgilerini şifreler.
   * @param userId Kullanıcının kimliği.
   * @param jiraHost Jira sunucusunun host adresi.
   * @param jiraUsername Jira kullanıcı adı.
   * @param jiraPassword Jira parolası.
   * @returns Şifrelenmiş JiraCredentials nesnesi.
   */
  public async encryptJiraCredentials(
    userId: string,
    jiraHost: string,
    jiraUsername: string,
    jiraPassword: string
  ): Promise<JiraCredentials> {
    console.log(`Kullanıcı ${userId} için Jira kimlik bilgileri şifreleniyor.`);

    const masterKey = await this.userKeyManager.getMasterKey(userId);
    if (!masterKey) {
      throw new Error('Ana anahtar bulunamadı. Lütfen önce bir ana anahtar oluşturun.');
    }

    const payload = JSON.stringify({
      host: jiraHost,
      username: jiraUsername,
      password: jiraPassword,
    });

    const encryptionResult = await this.encryptionService.encrypt(payload, masterKey); // masterKey kullanılarak şifrele

    const encryptedCredentials: JiraCredentials = {
      encryptedPayload: encryptionResult.encryptedData,
      encryptionMetadata: encryptionResult.metadata,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`Kullanıcı ${userId} için Jira kimlik bilgileri başarıyla şifrelendi.`);
    return encryptedCredentials;
  }

  /**
   * Şifrelenmiş Jira kimlik bilgilerini çözer.
   * @param userId Kullanıcının kimliği.
   * @param encryptedCredentials Şifrelenmiş JiraCredentials nesnesi.
   * @returns Çözülmüş kimlik bilgileri (host, username, password) içeren bir nesne.
   */
  public async decryptJiraCredentials(
    userId: string,
    encryptedCredentials: JiraCredentials
  ): Promise<{ host: string; username: string; password: string }> {
    console.log(`Kullanıcı ${userId} için Jira kimlik bilgileri çözülüyor.`);

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
    console.log(`Kullanıcı ${userId} için Jira kimlik bilgileri başarıyla çözüldü.`);
    return credentials;
  }
}
