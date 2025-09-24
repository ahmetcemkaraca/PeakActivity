import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { CommunityRulesService } from '../services/community-rules-service';

const communityRulesService = new CommunityRulesService();

export const matchCommunityRule = onCall(async request => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { event, communityRules } = request.data;

  if (!event) {
    throw new HttpsError('invalid-argument', "The 'event' object is required.");
  }
  if (!communityRules || !Array.isArray(communityRules)) {
    throw new HttpsError('invalid-argument', "The 'communityRules' array is required.");
  }

  try {
    const result = communityRulesService.matchCommunityRule(event, communityRules);
    return { status: 'success', data: result };
  } catch (error: any) {
    throw new HttpsError('internal', error.message || 'An unknown error occurred.');
  }
});
