import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { AuthService } from '../src/services/auth-service';
import type { UserRecord } from 'firebase-admin/auth';

// Mock Firebase Admin
vi.mock('firebase-admin/auth');
vi.mock('firebase-admin/firestore');
vi.mock('firebase-functions/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

const mockAuth = {
  createUser: vi.fn(),
  verifyIdToken: vi.fn(),
  updateUser: vi.fn(),
  generateEmailVerificationLink: vi.fn(),
  getUser: vi.fn()
} as unknown as Auth;

const mockDb = {
  collection: vi.fn(),
  doc: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  get: vi.fn()
} as unknown as Firestore;

vi.mocked(getAuth).mockReturnValue(mockAuth);
vi.mocked(getFirestore).mockReturnValue(mockDb);

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService();
    vi.spyOn(authService, 'logAction').mockResolvedValue();
  });

  it('should create user successfully', async () => {
    const mockUserRecord = { uid: 'test-uid', email: 'test@example.com' } as UserRecord;
    vi.mocked(mockAuth.createUser).mockResolvedValue(mockUserRecord);
    vi.mocked(mockAuth.generateEmailVerificationLink).mockResolvedValue('verification-link');
    vi.mocked(mockDb.collection).mockReturnValue({
      doc: vi.fn().mockReturnValue({
        set: vi.fn().mockResolvedValue()
      })
    });

    const result = await authService.signUp('test@example.com', 'password123', 'Test User');

    expect(mockAuth.createUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
      emailVerified: false
    });
    expect(mockAuth.generateEmailVerificationLink).toHaveBeenCalledWith('test@example.com', expect.any(Object));
    expect(mockDb.collection('users').doc('test-uid').set).toHaveBeenCalledWith({
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: expect.any(String),
      preferences: {
        timezone: 'UTC',
        language: 'en',
        notifications: true
      },
      verified: false
    });
    expect(authService.logAction).toHaveBeenCalledWith('test-uid', 'user_signup', { email: 'test@example.com' });
    expect(result).toEqual({ uid: 'test-uid', email: 'test@example.com' });
  });

  it('should throw invalid-argument for missing email/password', async () => {
    await expect(authService.signUp('', 'password123')).rejects.toThrow('Email and password are required');
    expect(mockAuth.createUser).not.toHaveBeenCalled();
  });

  it('should handle email already exists error', async () => {
    vi.mocked(mockAuth.createUser).mockRejectedValue({ code: 'auth/email-already-exists' });

    await expect(authService.signUp('test@example.com', 'password123')).rejects.toThrow('Email already in use');
  });

  it('should verify email successfully', async () => {
    const mockDecodedToken = { uid: 'test-uid', email: 'test@example.com', email_verified: false };
    vi.mocked(mockAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);
    vi.mocked(mockAuth.updateUser).mockResolvedValue(undefined);
    vi.mocked(mockDb.collection('users').doc('test-uid')).mockReturnValue({
      update: vi.fn().mockResolvedValue()
    });

    const result = await authService.verifyEmail('mock-id-token');

    expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('mock-id-token');
    expect(mockAuth.updateUser).toHaveBeenCalledWith('test-uid', { emailVerified: true });
    expect(mockDb.collection('users').doc('test-uid').update).toHaveBeenCalledWith({ verified: true });
    expect(authService.logAction).toHaveBeenCalledWith('test-uid', 'email_verified', { email: 'test@example.com' });
    expect(result).toEqual({ success: true, uid: 'test-uid' });
  });

  it('should skip verification if already verified', async () => {
    const mockDecodedToken = { uid: 'test-uid', email: 'test@example.com', email_verified: true };
    vi.mocked(mockAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);

    const result = await authService.verifyEmail('mock-id-token');

    expect(mockAuth.updateUser).not.toHaveBeenCalled();
    expect(mockDb.collection('users').doc('test-uid').update).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, uid: 'test-uid' });
  });

  it('should throw unauthenticated for invalid token', async () => {
    vi.mocked(mockAuth.verifyIdToken).mockRejectedValue({ code: 'auth/id-token-expired' });

    await expect(authService.verifyEmail('invalid-token')).rejects.toThrow('Invalid token');
  });

  it('should verify ID token successfully', async () => {
    const mockDecodedToken = { uid: 'test-uid', email: 'test@example.com', email_verified: true };
    vi.mocked(mockAuth.verifyIdToken).mockResolvedValue(mockDecodedToken);
    vi.mocked(authService.logAction).mockResolvedValue();

    const result = await authService.verifyIdToken('mock-id-token');

    expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('mock-id-token', true);
    expect(result).toEqual(mockDecodedToken);
    expect(authService.logAction).toHaveBeenCalledWith('test-uid', 'login_attempt', { success: true });
  });

  it('should throw unauthenticated for expired token', async () => {
    vi.mocked(mockAuth.verifyIdToken).mockRejectedValue({ code: 'auth/id-token-expired' });

    await expect(authService.verifyIdToken('expired-token')).rejects.toThrow('Invalid ID token');
  });

  it('should throw unauthenticated for invalid ID token', async () => {
    vi.mocked(mockAuth.verifyIdToken).mockRejectedValue(new Error('Invalid token'));

    await expect(authService.verifyIdToken('invalid-token')).rejects.toThrow('Invalid ID token');
  });

  it('should update user profile successfully', async () => {
    vi.mocked(mockDb.collection('users').doc('test-uid')).mockReturnValue({
      update: vi.fn().mockResolvedValue()
    });
    vi.mocked(authService.logAction).mockResolvedValue();

    const result = await authService.updateUserProfile('test-uid', { displayName: 'New Name' });

    expect(mockDb.collection('users').doc('test-uid').update).toHaveBeenCalledWith({
      displayName: 'New Name',
      updatedAt: expect.any(String)
    });
    expect(authService.logAction).toHaveBeenCalledWith('test-uid', 'profile_update', { fields: ['displayName'] });
    expect(result).toEqual({ success: true });
  });

  it('should get user profile successfully', async () => {
    const mockDoc = {
      exists: true,
      data: () => ({ email: 'test@example.com' })
    };
    vi.mocked(mockDb.collection('users').doc('test-uid')).mockReturnValue({
      get: vi.fn().mockResolvedValue(mockDoc)
    });

    const result = await authService.getUserProfile('test-uid');

    expect(mockDb.collection('users').doc('test-uid').get).toHaveBeenCalled();
    expect(result).toEqual({ email: 'test@example.com' });
  });

  it('should throw not-found for non-existent user profile', async () => {
    vi.mocked(mockDb.collection('users').doc('non-existent')).mockReturnValue({
      get: vi.fn().mockResolvedValue({ exists: false })
    });

    await expect(authService.getUserProfile('non-existent')).rejects.toThrow('User profile not found');
  });

  it('should log action successfully', async () => {
    vi.mocked(mockDb.collection('auditLogs')).mockReturnValue({
      add: vi.fn().mockResolvedValue()
    });

    await authService.logAction('test-uid', 'test-action', { test: true });

    expect(mockDb.collection('auditLogs').add).toHaveBeenCalledWith({
      user_id: 'test-uid',
      action: 'test-action',
      timestamp: expect.any(String),
      details: { test: true },
      ip_address: 'unknown',
      user_agent: 'unknown'
    });
  });

  it('should handle log action failure gracefully', async () => {
    vi.mocked(mockDb.collection('auditLogs')).mockReturnValue({
      add: vi.fn().mockRejectedValue(new Error('DB error'))
    });

    await authService.logAction('test-uid', 'test-action');

    // Should not throw, just log error
    expect(true).toBe(true);
  });
});
