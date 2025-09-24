import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { TaskCompletionPredictionService } from '../services/task-completion-prediction-service';

const taskCompletionPredictionService = new TaskCompletionPredictionService();

/**
 * Kullanıcı görev tamamlama süresini tahmin eden Firebase İşlevi.
 */
export const predictTaskCompletion = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { projectId } = request.data;

  if (!projectId) {
    throw new HttpsError('invalid-argument', "Proje ID'si gereklidir.");
  }

  try {
    const prediction = await taskCompletionPredictionService.predictTaskCompletion(
      userId,
      projectId
    );
    return { success: true, prediction };
  } catch (error: any) {
    console.error('Görev tamamlama tahmini yapılırken hata oluştu:', error);
    throw new HttpsError(
      'internal',
      error.message || 'Görev tamamlama tahmini yapılırken bilinmeyen bir hata oluştu.'
    );
  }
});
