import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as admin from 'firebase-admin';
import { AuthService } from '../../src/services/auth-service';
import { ActivityQueryService } from '../../src/services/activity-query-service';

// Mock Firebase Admin for integration tests
vi.mock('firebase-admin', () => ({
  initializeApp: vi.fn(),
  getFirestore: vi.fn(() => ({
    collection: vi.fn(),
    doc: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
    runTransaction: vi.fn()
  })),
  getAuth: vi.fn(() => ({
    createUser: vi.fn(),
    verifyIdToken: vi.fn(),
    updateUser: vi.fn(),
    generateEmailVerificationLink: vi.fn()
  }))
}));

describe('Firebase + ActivityWatch Integration', () => {
  let authService: AuthService;
  let activityService: ActivityQueryService;

  beforeAll(() => {
    authService = new AuthService();
    activityService = new ActivityQueryService();
  });

  it('should create user and query activities', async () => {
    // Mock auth creation
    const mockUser = { uid: 'test-uid' };
    vi.spyOn(admin.auth(), 'createUser').mockResolvedValue(mockUser as any);

    // Mock Firestore setup
    const mockCollection = {
      doc: vi.fn(() => ({
        set: vi.fn().mockResolvedValue()
      }))
    };
    vi.spyOn(admin.firestore(), 'collection').mockReturnValue(mockCollection as any);

    // Create user
    const userResult = await authService.signUp('test@example.com', 'password123');

    expect(userResult).toEqual({ uid: 'test-uid', email: 'test@example.com' });

    // Query activities for the user
    const queryResult = await activityService.queryActivities({
      userId: 'test-uid'
    });

    expect(queryResult.events).toBeDefined();
    expect(queryResult.totalCount).toBeDefined();
  });

  it('should handle auth failure in integration', async () => {
    vi.spyOn(admin.auth(), 'createUser').mockRejectedValue(new Error('Auth failed'));

    await expect(authService.signUp('test@example.com', 'password123')).rejects.toThrow();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });
});
