import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AIInsightService } from '../services/ai-insight-service';

const aiInsightService = new AIInsightService();

/**
 * Kullanıcı aktivite ve proje verilerini analiz ederek AI destekli özetler ve içgörüler oluşturan Firebase İşlevi.
 */
export const generateAIInsights = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { startDate, endDate } = request.data;

  if (!startDate || !endDate) {
    throw new HttpsError('invalid-argument', 'startDate ve endDate gereklidir.');
  }

  try {
    const insights = await aiInsightService.generateInsights(userId, startDate, endDate);
    return { success: true, insights };
  } catch (error: any) {
    console.error('AI içgörüleri oluşturulurken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'AI içgörüleri oluşturulurken bilinmeyen bir hata oluştu.'
    );
  }
});
