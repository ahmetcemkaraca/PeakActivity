import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ActivityService } from '../services/activity-service';
import { DataTransmissionType } from '../services/encryption/DataTransmissionTypes';

const activityService = new ActivityService();

export const saveActivity = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = request.auth.uid;
  const activityData = request.data.activityData;
  const transmissionType: DataTransmissionType =
    request.data.transmissionType || DataTransmissionType.RAW; // Varsayılan: RAW
  const userKey: string | undefined = request.data.userKey; // İstemci tarafından gönderilen şifreleme anahtarı

  if (!activityData) {
    throw new HttpsError('invalid-argument', 'The activityData is required.');
  }

  try {
    // ActivityService'e yeni parametreleri aktar
    const result = await activityService.saveActivity(
      userId,
      activityData,
      transmissionType,
      userKey
    );
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});
