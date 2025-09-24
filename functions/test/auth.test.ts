import { describe, it, expect, vi } from 'vitest';
import { AuthService } from '../src/services/auth-service';

describe('AuthService', () => {
  const mockAuth = {
    createUser: vi.fn(),
    getUserByEmail: vi.fn(),
    createCustomToken: vi.fn(),
    verifyIdToken: vi.fn(),
  };

  const mockDb = {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(),
        update: vi.fn(),
        get: vi.fn(),
      })),
    }),
  };

  const authService = new AuthService(mockAuth, mockDb);

  it('should create user successfully', async () => {
    mockAuth.createUser.mockResolvedValue({ uid: 'test-uid' });
    mockDb.collection().doc().set.mockResolvedValue();

    const result = await authService.signUp('test@example.com', 'password123', 'Test User');

    expect(mockAuth.createUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });
    expect(mockDb.collection().doc().set).toHaveBeenCalledWith({
      email: 'test@example.com',
      displayName: 'Test User',
      createdAt: expect.any(String),
      preferences: {
        timezone: 'UTC',
        language: 'en',
        notifications: true,
      },
    });
    expect(result).toEqual({ uid: 'test-uid', email: 'test@example.com' });
  });

  it('should login user successfully', async () => {
    mockAuth.getUserByEmail.mockResolvedValue({ uid: 'test-uid' });
    mockAuth.createCustomToken.mockResolvedValue('mock-token');

    const result = await authService.login('test@example.com', 'password123');

    expect(mockAuth.getUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockAuth.createCustomToken).toHaveBeenCalledWith('test-uid');
    expect(result).toEqual({ uid: 'test-uid', idToken: 'mock-token' });
  });

  it('should verify ID token successfully', async () => {
    mockAuth.verifyIdToken.mockResolvedValue({ uid: 'test-uid' });

    const result = await authService.verifyIdToken('mock-id-token');

    expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('mock-id-token');
    expect(result).toEqual({ uid: 'test-uid' });
  });

  it('should update user profile successfully', async () => {
    mockDb.collection().doc().update.mockResolvedValue();

    const result = await authService.updateUserProfile('test-uid', { displayName: 'New Name' });

    expect(mockDb.collection().doc().update).toHaveBeenCalledWith({ displayName: 'New Name' });
    expect(result).toEqual({ success: true });
  });

  it('should get user profile successfully', async () => {
    mockDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => ({ email: 'test@example.com' }),
    });

    const result = await authService.getUserProfile('test-uid');

    expect(mockDb.collection().doc().get).toHaveBeenCalledWith('test-uid');
    expect(result).toEqual({ email: 'test@example.com' });
  });
});
