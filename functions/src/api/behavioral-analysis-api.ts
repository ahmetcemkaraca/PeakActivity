import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { BehavioralAnalysisService } from '../services/behavioral-analysis-service';
import { ActivityEvent } from '../types/activity-event'; // ActivityEvent'ı içe aktar

const behavioralAnalysisService = new BehavioralAnalysisService();

export const analyzeRealtimeBehavioralPattern = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = request.auth.uid;
  const activityEvent = request.data.activityEvent as ActivityEvent; // Tekil aktivite olayı bekliyoruz

  if (
    !activityEvent ||
    !activityEvent.timestamp_start ||
    !activityEvent.app ||
    !activityEvent.title
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The activityEvent object with timestamp_start, app, and title is required.'
    );
  }

  try {
    const result = await behavioralAnalysisService.analyzeRealtimeBehavioralPattern(
      userId,
      activityEvent
    );
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});
