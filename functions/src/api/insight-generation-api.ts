import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { InsightGenerationService } from '../services/insight-generation-service';

const insightService = new InsightGenerationService();

/**
 * Firebase Function to generate a new insight.
 */
export const generateInsight = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { insightType, insightData } = request.data;

  if (!insightType || !insightData) {
    throw new HttpsError(
      'invalid-argument',
      'Gerekli alanlar eksik: içgörü tipi veya içgörü verileri.'
    );
  }

  try {
    const newInsight = await insightService.generateInsight(userId, insightType, insightData);
    return { success: true, insight: newInsight };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to list all insights for a user.
 */
export const listInsights = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;

  try {
    const insights = await insightService.listInsights(userId);
    return { success: true, insights };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to get a specific insight.
 */
export const getInsight = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { insightId } = request.data;

  if (!insightId) {
    throw new HttpsError('invalid-argument', 'İçgörü kimliği eksik.');
  }

  try {
    const insight = await insightService.getInsight(userId, insightId);
    if (!insight) {
      throw new HttpsError('not-found', 'İçgörü bulunamadı.');
    }
    return { success: true, insight };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});

/**
 * Firebase Function to delete a specific insight.
 */
export const deleteInsight = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanmamış.');
  }
  const userId = request.auth.uid;
  const { insightId } = request.data;

  if (!insightId) {
    throw new HttpsError('invalid-argument', 'İçgörü kimliği eksik.');
  }

  try {
    const success = await insightService.deleteInsight(userId, insightId);
    if (!success) {
      throw new HttpsError('not-found', 'Silinecek içgörü bulunamadı.');
    }
    return { success: true, message: 'İçgörü başarıyla silindi.' };
  } catch (error: any) {
    throw new HttpsError('internal', error.message);
  }
});
