import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AINotificationService } from '../services/ai-notification-service';

const aiNotificationService = new AINotificationService();

/**
 * AI tarafından oluşturulan öneri veya uyarıyı kullanıcıya bildirim olarak gönderen Firebase İşlevi.
 */
export const sendAIRecommendationNotification = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { title, body, data } = request.data;

  if (!title || !body) {
    throw new HttpsError('invalid-argument', 'Başlık ve içerik gereklidir.');
  }

  try {
    const result = await aiNotificationService.sendAIRecommendationNotification(
      userId,
      title,
      body,
      data
    );
    return { success: true, result };
  } catch (error: any) {
    console.error('AI öneri bildirimi gönderilirken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'AI öneri bildirimi gönderilirken bilinmeyen bir hata oluştu.'
    );
  }
});
