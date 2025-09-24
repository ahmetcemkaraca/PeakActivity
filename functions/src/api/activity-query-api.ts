import * as functions from 'firebase-functions';
import {
  ActivityQueryService,
  QueryOptions,
  QueryResult,
} from '../services/activity-query-service';

const activityQueryService = new ActivityQueryService();

/**
 * Kullanıcı etkinlik verilerini gelişmiş filtreleme ve arama seçenekleriyle sorgular.
 * @param data Sorgulama seçenekleri (QueryOptions arayüzüne uygun).
 * @returns Sorgu sonuçları (QueryResult arayüzüne uygun).
 */
export const queryActivities = functions.https.onCall(
  async (request: functions.https.CallableRequest) => {
    if (!request.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Bu API yalnızca kimliği doğrulanmış kullanıcılar tarafından erişilebilir.'
      );
    }

    const userId = request.auth.uid;
    const data = request.data as QueryOptions;

    // Gelen verinin doğrulanması
    if (!data) {
      throw new functions.https.HttpsError('invalid-argument', 'Sorgu seçenekleri sağlanmalıdır.');
    }

    try {
      const result = await activityQueryService.queryActivities({ ...data, userId });
      return result;
    } catch (error) {
      console.error('Etkinlik sorgulanırken hata oluştu:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Etkinlik sorgulanırken bir hata oluştu.',
        error
      );
    }
  }
);
