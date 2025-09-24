import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { ProjectPredictionAIService } from '../services/project-prediction-ai-service';

const projectPredictionAIService = new ProjectPredictionAIService();

export const predictProjectCompletion = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const userId = request.auth.uid;
  const { projectId } = request.data;

  if (typeof projectId !== 'string' || projectId.trim() === '') {
    throw new HttpsError('invalid-argument', 'Project ID is required.');
  }

  try {
    const prediction = await projectPredictionAIService.predictProjectCompletion(userId, projectId);
    return { status: 'success', data: prediction };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'Failed to predict project completion.');
  }
});
