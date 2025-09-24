import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AutoCategorizationService } from '../services/auto-categorization-service';

const autoCategorizationService = new AutoCategorizationService();

export const autoCategorize = onCall(async request => {
  const { events } = request.data;

  if (!events || !Array.isArray(events)) {
    throw new HttpsError('invalid-argument', "Geçersiz giriş: 'events' dizisi gerekli.");
  }

  try {
    const result = autoCategorizationService.categorizeEvents(events);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      console.error('Otomatik kategorizasyon sırasında hata oluştu:', error.message);
      throw new HttpsError('internal', error.message);
    } else {
      console.error('Bilinmeyen bir hata oluştu:', error);
      throw new HttpsError('internal', 'Bilinmeyen bir hata oluştu.');
    }
  }
});
