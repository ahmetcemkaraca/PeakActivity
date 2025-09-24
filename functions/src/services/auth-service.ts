import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions';

export class AuthService {
  private auth = getAuth();
  private db = getFirestore();

  async signUp(email: string, password: string, displayName?: string) {
    try {
      if (!email || !password) {
        throw new HttpsError('invalid-argument', 'Email and password are required');
      }

      const userRecord = await this.auth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      // Send email verification
      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?uid=${userRecord.uid}`,
        handleCodeInApp: true,
      };
      await this.auth.generateEmailVerificationLink(email, actionCodeSettings);

      // Create user profile in Firestore
      await this.db.collection('users').doc(userRecord.uid).set({
        email,
        displayName,
        createdAt: new Date().toISOString(),
        preferences: {
          timezone: 'UTC',
          language: 'en',
          notifications: true,
        },
        verified: false,
      });

      logger.info('User created successfully', { uid: userRecord.uid });
      return { uid: userRecord.uid, email };
    } catch (error: any) {
      logger.error('Error creating user', { error: error.message });
      if (error.code === 'auth/email-already-exists') {
        throw new HttpsError('already-exists', 'Email already in use');
      }
      throw new HttpsError('internal', 'Failed to create user');
    }
  }

  async verifyEmail(idToken: string) {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      if (!decodedToken.email_verified) {
        await this.auth.updateUser(decodedToken.uid, { emailVerified: true });
        await this.db.collection('users').doc(decodedToken.uid).update({ verified: true });
      }
      return { success: true, uid: decodedToken.uid };
    } catch (error: any) {
      logger.error('Error verifying email', { error: error.message });
      throw new HttpsError('unauthenticated', 'Invalid token');
    }
  }

  async login(email: string, password: string) {
    try {
      // Server-side login is typically client-side; server verifies ID token
      // This method can be used for custom server-side auth if needed
      // For standard Firebase, client uses signInWithEmailAndPassword, then sends ID token to server
      throw new HttpsError('unimplemented', 'Use client-side signInWithEmailAndPassword; verify ID token on server');
    } catch (error: any) {
      logger.error('Error in login', { error: error.message });
      throw new HttpsError('internal', 'Login failed');
    }
  }

  async verifyIdToken(idToken: string) {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken, true); // Check revoked
      // Verify email if required
      if (!decodedToken.email_verified) {
        throw new HttpsError('unauthenticated', 'Email not verified');
      }
      return decodedToken;
    } catch (error: any) {
      logger.error('Error verifying ID token', { error: error.message });
      if (error.code === 'auth/id-token-expired') {
        throw new HttpsError('unauthenticated', 'Token expired');
      }
      throw new HttpsError('unauthenticated', 'Invalid ID token');
    }
  }

  async updateUserProfile(uid: string, profileData: any) {
    try {
      await this.db.collection('users').doc(uid).update({
        ...profileData,
        updatedAt: new Date().toISOString(),
      });
      logger.info('User profile updated', { uid });
      return { success: true };
    } catch (error: any) {
      logger.error('Error updating user profile', { error: error.message });
      throw new HttpsError('internal', 'Failed to update profile');
    }
  }

  async getUserProfile(uid: string) {
    try {
      const doc = await this.db.collection('users').doc(uid).get();
      if (doc.exists) {
        return { ...doc.data(), id: uid };
      }
      throw new HttpsError('not-found', 'User profile not found');
    } catch (error: any) {
      logger.error('Error getting user profile', { error: error.message });
      throw new HttpsError('internal', 'Failed to get profile');
    }
  }

  async setProfile(uid: string, profileData: any) {
    try {
      await this.db.collection('users').doc(uid).set(profileData, { merge: true });
      logger.info('User profile set', { uid });
      return { success: true };
    } catch (error: any) {
      logger.error('Error setting user profile', { error: error.message });
      throw new HttpsError('internal', 'Failed to set profile');
    }
  }
}

export const authService = new AuthService();
