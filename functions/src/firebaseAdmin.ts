import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import serviceAccount from '../../serviceAccountKey.json'; // Add this file to .gitignore

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'peakactivity-prod',
  });
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };

export const authenticate = (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  return context.auth.uid;
};
