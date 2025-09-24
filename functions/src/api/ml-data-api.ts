import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { MLDataPreparationService } from '../services/ml-data-preparation-service';

const mlDataPreparationService = new MLDataPreparationService();

/**
 * ML modeli eğitimi için hazırlanmış kullanıcı aktivite ve görev verilerini getiren Firebase İşlevi.
 */
export const prepareMLTrainingData = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { startDate, endDate } = request.data;

  if (!startDate || !endDate) {
    throw new HttpsError('invalid-argument', 'startDate ve endDate gereklidir.');
  }

  try {
    const preparedData = await mlDataPreparationService.prepareDataForML(
      userId,
      startDate,
      endDate
    );
    return { success: true, data: preparedData };
  } catch (error: any) {
    console.error('ML eğitim verileri hazırlanırken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'ML eğitim verileri hazırlanırken bilinmeyen bir hata oluştu.'
    );
  }
});
