import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { AnomalyDetectionService } from '../services/anomaly-detection-service';
import { AINotificationService } from '../services/ai-notification-service';

const anomalyDetectionService = new AnomalyDetectionService();
const aiNotificationService = new AINotificationService();

export const detectAnomalies = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = request.auth.uid; // Kullanıcı ID'sini al
  const dailyTotals = request.data.dailyTotals;

  if (!dailyTotals || !Array.isArray(dailyTotals)) {
    throw new HttpsError('invalid-argument', 'The dailyTotals array is required.');
  }

  try {
    const result = await anomalyDetectionService.detectAnomalies(dailyTotals);

    // Anomali tespit edildiyse bildirim gönder
    if (result.anomalies.length > 0) {
      const latestAnomaly = result.anomalies[0]; // En son veya en önemli anomaliden bildirim gönder
      const title = 'Anomali Tespit Edildi!';
      const body = `Aktivite verilerinizde bir anormallik tespit edildi: ${latestAnomaly.date} tarihinde Z-skor: ${latestAnomaly.anomaly_score?.toFixed(2)}, Sapma: ${latestAnomaly.deviation_percent?.toFixed(2)}%.`;

      // Bildirimi Firebase Cloud Messaging (FCM) aracılığıyla gönder
      // Bu kısım arka planda çalışacağı için await kullanmak önemlidir.
      await aiNotificationService.sendAIRecommendationNotification(userId, title, body, {
        anomalyDate: latestAnomaly.date,
        zScore: latestAnomaly.anomaly_score?.toFixed(2) || '',
        deviationPercent: latestAnomaly.deviation_percent?.toFixed(2) || '',
      });

      console.log(`Kullanıcı ${userId} için anomali bildirimi gönderildi.`);
    }

    return { status: 'success', data: result };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});

export const getAnomalyAlerts = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'Bu API yalnızca kimliği doğrulanmış kullanıcılar tarafından erişilebilir.'
    );
  }

  const userId = request.auth.uid;

  try {
    const alerts = await anomalyDetectionService.getAnomalyAlerts(userId); // Yeni metodu çağır
    return { status: 'success', data: alerts };
  } catch (error: any) {
    console.error('Anomali uyarıları alınırken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'Anomali uyarıları alınırken bilinmeyen bir hata oluştu.'
    );
  }
});
