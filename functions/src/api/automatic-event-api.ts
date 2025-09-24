import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AutomaticEventCreationService } from '../services/automatic-event-creation-service';

const automaticEventCreationService = new AutomaticEventCreationService();

/**
 * Kullanıcının aktivite kalıplarına göre otomatik olarak takvim etkinlikleri oluşturan Firebase İşlevi.
 */
export const createAutomaticCalendarEvents = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { startDate, endDate } = request.data;

  if (!startDate || !endDate) {
    throw new HttpsError('invalid-argument', 'startDate ve endDate gereklidir.');
  }

  try {
    const createdEvents = await automaticEventCreationService.createEventsFromActivityPatterns(
      userId,
      startDate,
      endDate
    );
    return { success: true, createdEvents };
  } catch (error: any) {
    console.error('Otomatik etkinlik oluşturulurken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'Otomatik etkinlik oluşturulurken bilinmeyen bir hata oluştu.'
    );
  }
});
