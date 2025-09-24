import { OAuthTokenManager } from './OAuthTokenManager';
import { TrelloCredentialsEncryption } from './TrelloCredentialsEncryption';
import { JiraCredentialsEncryption } from './JiraCredentialsEncryption';
import { GoogleCalendarTokenEncryption } from './GoogleCalendarTokenEncryption';
import * as admin from 'firebase-admin'; // firebase-admin'i tamamen import ettim

export class MigrationService {
  private oauthTokenManager: OAuthTokenManager;
  private trelloEncryptionService: TrelloCredentialsEncryption;
  private jiraEncryptionService: JiraCredentialsEncryption;
  private googleCalendarEncryptionService: GoogleCalendarTokenEncryption;
  private firestore: admin.firestore.Firestore; // Firestore instance'ı

  constructor(
    oauthTokenManager: OAuthTokenManager,
    trelloEncryptionService: TrelloCredentialsEncryption,
    jiraEncryptionService: JiraCredentialsEncryption,
    googleCalendarEncryptionService: GoogleCalendarTokenEncryption
  ) {
    this.oauthTokenManager = oauthTokenManager;
    this.trelloEncryptionService = trelloEncryptionService;
    this.jiraEncryptionService = jiraEncryptionService;
    this.googleCalendarEncryptionService = googleCalendarEncryptionService;
    this.firestore = admin.firestore(); // Firestore instance'ını burada başlat
  }

  /**
   * Eski formatta depolanmış tüm dış servis kimlik bilgilerini yeni şifrelenmiş formata geçirir.
   * Bu metod, her bir entegrasyon için eski verileri okuyup yeni formatta kaydedecektir.
   * @param userId Geçiş yapılacak kullanıcının kimliği.
   * @returns Geçiş işleminin başarılı olup olmadığını belirten bir Promise.
   */
  public async migrateExternalCredentials(userId: string): Promise<boolean> {
    console.log(`Kullanıcı ${userId} için dış kimlik bilgileri geçişi başlatılıyor.`);
    let success = true;

    // Google Calendar geçişi (varsayımsal eski yapı: users/{userId}/googleCalendarAuth altında düz metin tokenlar)
    try {
      const oldGoogleAuthDoc = await this.firestore.collection('users').doc(userId).get();
      const oldGoogleAuthData = oldGoogleAuthDoc.data()?.googleCalendarAuth; // Eski verinin konumu

      if (oldGoogleAuthData && oldGoogleAuthData.accessToken && oldGoogleAuthData.refreshToken) {
        console.log(
          `Kullanıcı ${userId} için eski Google Calendar tokenları bulundu, şifreleniyor.`
        );
        const encryptedTokens =
          await this.googleCalendarEncryptionService.encryptGoogleCalendarTokens(
            userId,
            oldGoogleAuthData.accessToken,
            oldGoogleAuthData.refreshToken,
            oldGoogleAuthData.expiryDate
          );
        // OAuthTokenManager ile yeni, standart konumda kaydet
        await this.oauthTokenManager.encryptAndSaveTokens(userId, 'google', {
          accessToken: oldGoogleAuthData.accessToken,
          refreshToken: oldGoogleAuthData.refreshToken,
          expiryDate: oldGoogleAuthData.expiryDate,
        });
        console.log(`Kullanıcı ${userId} için Google Calendar tokenları başarıyla geçirildi.`);
      } else {
        console.log(
          `Kullanıcı ${userId} için eski Google Calendar tokenları bulunamadı veya zaten yeni formatta.`
        );
      }
    } catch (error) {
      console.error(`Kullanıcı ${userId} için Google Calendar geçişinde hata:`, error);
      success = false;
    }

    // Trello geçişi (varsayımsal eski yapı: users/{userId}/trelloAuth altında düz metin kimlik bilgileri)
    try {
      const oldTrelloAuthDoc = await this.firestore.collection('users').doc(userId).get();
      const oldTrelloAuthData = oldTrelloAuthDoc.data()?.trelloAuth; // Eski verinin konumu

      if (oldTrelloAuthData && oldTrelloAuthData.apiKey && oldTrelloAuthData.token) {
        console.log(`Kullanıcı ${userId} için eski Trello kimlik bilgileri bulundu, şifreleniyor.`);
        const encryptedCredentials = await this.trelloEncryptionService.encryptTrelloCredentials(
          userId,
          oldTrelloAuthData.apiKey,
          oldTrelloAuthData.token
        );
        // OAuthTokenManager ile yeni, standart konumda kaydet
        await this.oauthTokenManager.encryptAndSaveTokens(userId, 'trello', {
          apiKey: oldTrelloAuthData.apiKey,
          token: oldTrelloAuthData.token,
        });
        console.log(`Kullanıcı ${userId} için Trello kimlik bilgileri başarıyla geçirildi.`);
      } else {
        console.log(
          `Kullanıcı ${userId} için eski Trello kimlik bilgileri bulunamadı veya zaten yeni formatta.`
        );
      }
    } catch (error) {
      console.error(`Kullanıcı ${userId} için Trello geçişinde hata:`, error);
      success = false;
    }

    // Jira geçişi (varsayımsal eski yapı: users/{userId}/jiraAuth altında düz metin kimlik bilgileri)
    try {
      const oldJiraAuthDoc = await this.firestore.collection('users').doc(userId).get();
      const oldJiraAuthData = oldJiraAuthDoc.data()?.jiraAuth; // Eski verinin konumu

      if (
        oldJiraAuthData &&
        oldJiraAuthData.host &&
        oldJiraAuthData.username &&
        oldJiraAuthData.password
      ) {
        console.log(`Kullanıcı ${userId} için eski Jira kimlik bilgileri bulundu, şifreleniyor.`);
        const encryptedCredentials = await this.jiraEncryptionService.encryptJiraCredentials(
          userId,
          oldJiraAuthData.host,
          oldJiraAuthData.username,
          oldJiraAuthData.password
        );
        // OAuthTokenManager ile yeni, standart konumda kaydet
        await this.oauthTokenManager.encryptAndSaveTokens(userId, 'jira', {
          host: oldJiraAuthData.host,
          username: oldJiraAuthData.username,
          password: oldJiraAuthData.password,
        });
        console.log(`Kullanıcı ${userId} için Jira kimlik bilgileri başarıyla geçirildi.`);
      } else {
        console.log(
          `Kullanıcı ${userId} için eski Jira kimlik bilgileri bulunamadı veya zaten yeni formatta.`
        );
      }
    } catch (error) {
      console.error(`Kullanıcı ${userId} için Jira geçişinde hata:`, error);
      success = false;
    }

    console.log(
      `Kullanıcı ${userId} için dış kimlik bilgileri geçişi tamamlandı. Başarılı: ${success}`
    );
    return success;
  }
}
