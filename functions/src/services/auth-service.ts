import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions';

export class AuthService {
  private auth = getAuth();
  private db = getFirestore();

  async logAction(uid: string, action: string, details: any = {}) {
    try {
      await this.db.collection('auditLogs').add({
        user_id: uid,
        action,
        timestamp: new Date().toISOString(),
        details,
        ip_address: details.ip || 'unknown',
        user_agent: details.userAgent || 'unknown',
      });
      logger.info('Audit log created', { uid, action });
    } catch (error: any) {
      logger.error('Failed to log action', { error: error.message, uid, action });
    }
  }

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

      // Log sign up action
      await this.logAction(userRecord.uid, 'user_signup', { email });

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
      // Log verification
      await this.logAction(decodedToken.uid, 'email_verified', { email: decodedToken.email });
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
      // Log login attempt
      await this.logAction(decodedToken.uid, 'login_attempt', { success: true });
      return decodedToken;
    } catch (error: any) {
      // Log failed login attempt
      await this.logAction('unknown', 'login_attempt', { success: false, error: error.message });
      logger.error('Error verifying ID token', { error: error.message });
      if (error.code === 'auth/id-token-expired') {
        throw new HttpsError('unauthenticated', 'Token expired');
      }
      throw new HttpsError('unauthenticated', 'Invalid ID token');
    }
  }

  async updateUserProfile
