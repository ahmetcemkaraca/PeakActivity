import * as admin from 'firebase-admin';
import { Messaging } from 'firebase-admin/lib/messaging';
import { NotificationService } from './notification-service';
import { db } from '../firebaseAdmin';

export class AINotificationService {
  private messaging: Messaging;
  private notificationService: NotificationService;
  private db: any;

  constructor() {
    this.messaging = admin.messaging();
    this.notificationService = new NotificationService();
    this.db = db;
  }

  /**
   * AI tarafından oluşturulan öneri veya uyarıyı kullanıcıya bildirim olarak gönderir.
   * @param userId Bildirimin gönderileceği kullanıcının Firebase UID'si.
   * @param title Bildirimin başlığı.
   * @param body Bildirimin içeriği.
   * @param data Ek veri (opsiyonel).
   * @returns Bildirim gönderme işleminin sonucu.
   */
  async sendAIRecommendationNotification(
    userId: string,
    title: string,
    body: string,
    data?: { [key: string]: string }
  ) {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      const fcmToken = userDoc.data()?.fcmToken;

      // const fcmToken = 'USER_FCM_TOKEN'; // Yer tutucu

      if (!fcmToken) {
        console.warn(`Kullanıcı ${userId} için FCM token'ı bulunamadı. Bildirim gönderilemiyor.`);
        return { success: false, message: 'FCM token bulunamadı.' };
      }

      const message = {
        notification: {
          title: title,
          body: body,
        },
        data: { ...data, type: 'ai-recommendation' },
        token: fcmToken,
      };

      const response = await this.messaging.send(message);
      console.log('Firebase Cloud Messaging bildirimi başarıyla gönderildi:', response);

      // Bildirimi aynı zamanda Firestore'a da kaydedebilirsiniz
      await this.notificationService.createNotification(userId, {
        title: title,
        message: body,
        type: 'ai_recommendation',
      });

      return { success: true, message: 'Bildirim başarıyla gönderildi.', response };
    } catch (error) {
      console.error(`AI öneri bildirimi gönderilirken hata oluştu:`, error);
      throw error;
    }
  }
}
