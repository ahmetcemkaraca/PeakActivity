import { google } from 'googleapis';
import { db } from '../firebaseAdmin';
import * as functions from 'firebase-functions';
import { GoogleCalendarTokenEncryption } from './encryption/GoogleCalendarTokenEncryption';
import { UserKeyManager } from './encryption/UserKeyManager';
import { NodeEncryptionService } from './encryption/NodeEncryptionService';
import { GoogleCalendarAuth } from '../types/external-credentials.d';
import { KeyDerivationService } from './encryption/KeyDerivationService';

interface UserGoogleAuth {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

export class GoogleCalendarService {
  private oAuth2Client: any; // GoogleAuth.OAuth2Client
  private googleCalendarTokenEncryption: GoogleCalendarTokenEncryption;
  private userKeyManager: UserKeyManager;

  constructor() {
    const CLIENT_ID = functions.config().googleapi.client_id;
    const CLIENT_SECRET = functions.config().googleapi.client_secret;
    const REDIRECT_URI = functions.config().googleapi.redirect_uri;

    this.oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    const nodeEncryptionService = new NodeEncryptionService();
    // UserKeyManager, secureStorageService'e bağımlı olduğu için, Firebase Admin SDK'sının
    // initialize edildiğini varsayarak firestore instance'ını doğrudan iletiyoruz.
    // SecureStorageService, UserKeyManager içinde tanımlandığından burada ayrıca tanımlamıyoruz.
    this.userKeyManager = new UserKeyManager(new KeyDerivationService(), {
      store: async (key: string, value: string) => {
        await db.collection("secureStorage").doc(key).set({ value });
      },
      retrieve: async (key: string) => {
        const doc = await db.collection("secureStorage").doc(key).get();
        return doc.exists ? doc.data()?.value : null;
      },
      delete: async (key: string) => {
        await db.collection("secureStorage").doc(key).delete();
      }
    });
    this.googleCalendarTokenEncryption = new GoogleCalendarTokenEncryption(this.userKeyManager, nodeEncryptionService);
  }

  // Kullanıcı kimlik doğrulama bilgilerini ayarlar
  async setCredentials(userId: string): Promise<boolean> {
    // Şifrelenmiş tokenları Firestore'dan al
    const encryptedAuthData = await db.collection('users').doc(userId).collection("externalCredentials").doc("google").get();
    
    if (encryptedAuthData.exists) {
      const authData = encryptedAuthData.data() as GoogleCalendarAuth;
      
      // Tokenları çöz
      const decryptedAuth = await this.googleCalendarTokenEncryption.decryptGoogleCalendarTokens(userId, authData);

      this.oAuth2Client.setCredentials({
        access_token: decryptedAuth.accessToken,
        refresh_token: decryptedAuth.refreshToken,
        expiry_date: decryptedAuth.expiryDate,
      });

      // Erişim tokenı süresi dolduysa yenile
      if (this.oAuth2Client.isAccessTokenExpired()) { // is yerine isAccessTokenExpired kullanıyorum
        const { credentials } = await this.oAuth2Client.refreshAccessToken();
        // Yenilenen tokenları tekrar şifreleyip kaydet
        await this.googleCalendarTokenEncryption.encryptGoogleCalendarTokens(
          userId,
          credentials.access_token,
          credentials.refresh_token || decryptedAuth.refreshToken, // refresh_token değişmeyebilir
          credentials.expiry_date
        );
        this.oAuth2Client.setCredentials(credentials);
      }
      return true;
    }
    return false;
  }

  // Google Calendar API istemcisini döndürür
  private getCalendarClient() {
    return google.calendar({ version: 'v3', auth: this.oAuth2Client });
  }

  // Kullanıcının takvim etkinliklerini çeker
  async getEvents(userId: string, timeMin: string, timeMax: string, calendarId: string = 'primary') {
    const credentialsSet = await this.setCredentials(userId);
    if (!credentialsSet) {
      throw new Error('Google Calendar kimlik bilgileri ayarlanmadı.');
    }

    const calendar = this.getCalendarClient();
    const res = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.data.items;
  }

  // Yeni bir takvim etkinliği oluşturur
  async createEvent(userId: string, event: any, calendarId: string = 'primary') {
    const credentialsSet = await this.setCredentials(userId);
    if (!credentialsSet) {
      throw new Error('Google Calendar kimlik bilgileri ayarlanmadı.');
    }

    const calendar = this.getCalendarClient();
    const res = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });
    return res.data;
  }

  // Takvim etkinliğini günceller
  async updateEvent(userId: string, eventId: string, event: any, calendarId: string = 'primary') {
    const credentialsSet = await this.setCredentials(userId);
    if (!credentialsSet) {
      throw new Error('Google Calendar kimlik bilgileri ayarlanmadı.');
    }

    const calendar = this.getCalendarClient();
    const res = await calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: event,
    });
    return res.data;
  }

  // Takvim etkinliğini siler
  async deleteEvent(userId: string, eventId: string, calendarId: string = 'primary') {
    const credentialsSet = await this.setCredentials(userId);
    if (!credentialsSet) {
      throw new Error('Google Calendar kimlik bilgileri ayarlanmadı.');
    }

    const calendar = this.getCalendarClient();
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });
    return true;
  }

  // Kullanıcının takvim listesini çeker
  async listCalendars(userId: string) {
    const credentialsSet = await this.setCredentials(userId);
    if (!credentialsSet) {
      throw new Error('Google Calendar kimlik bilgileri ayarlanmadı.');
    }

    const calendar = this.getCalendarClient();
    const res = await calendar.calendarList.list();
    return res.data.items;
  }
} 