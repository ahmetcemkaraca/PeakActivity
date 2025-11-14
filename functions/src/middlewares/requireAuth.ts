import { HttpsError } from 'firebase-functions/v2/https';
import type { CallableRequest } from 'firebase-functions/v2/https';

/**
 * Require authentication for v2 callable functions
 * Throws error if request is not authenticated
 */
export function requireAuth(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
} 