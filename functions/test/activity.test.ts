import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthService } from '../src/services/auth-service';
import { ActivityService } from '../src/services/activity-service'; // Assume this exists from tabs

// Mock Firebase Admin
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
    })),
  })),
});

const mockDb = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      set: vi.fn(),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  })),
};

const mockAuth = {
  verifyIdToken: vi.fn(),
};

describe('ActivityService CRUD Operations', () => {
  let activityService: ActivityService;
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    activityService = new ActivityService(mockDb as any, mockAuth as any);
    authService = new AuthService();
  });

  it('should create a bucket successfully', async () => {
    const uid = 'test-uid';
    const bucketData = {
      type: 'window',
      client: 'aw-watcher-window',
      hostname: 'test-pc',
    };

    mockAuth.verifyIdToken.mockResolvedValue({ uid });
    mockDb.collection().doc().set.mockResolvedValue();

    const result = await activityService.createBucket(uid, bucketData);

    expect(mockAuth.verifyIdToken).toHaveBeenCalled();
    expect(mockDb.collection().doc().set).toHaveBeenCalledWith({
      ...bucketData,
      user_id: uid,
      created_at: expect.anything(),
    });
    expect(result).toEqual({ success: true });
  });

  it('should get a bucket successfully', async () => {
    const uid = 'test-uid';
    const bucketId = 'test-bucket';
    const mockBucket = { id: bucketId, type: 'window' };

    mockAuth.verifyIdToken.mockResolvedValue({ uid });
    mockDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => mockBucket,
    });

    const result = await activityService.getBucket(uid, bucketId);

    expect(mockAuth.verifyIdToken).toHaveBeenCalled();
    expect(mockDb.collection().doc().get).toHaveBeenCalledWith(bucketId);
    expect(result).toEqual(mockBucket);
  });

  it('should update a bucket successfully', async () => {
    const uid = 'test-uid';
    const bucketId = 'test-bucket';
    const updateData = { name: 'Updated Bucket' };

    mockAuth.verifyIdToken.mockResolvedValue({ uid });
    mockDb.collection().doc().update.mockResolvedValue();

    const result = await activityService.updateBucket(uid, bucketId, updateData);

    expect(mockAuth.verifyIdToken).toHaveBeenCalled();
    expect(mockDb.collection().doc().update).toHaveBeenCalledWith({
      ...updateData,
      updated_at: expect.anything(),
    });
    expect(result).toEqual({ success: true });
  });

  it('should delete a bucket successfully', async () => {
    const uid = 'test-uid';
    const bucketId = 'test-bucket';

    mockAuth.verifyIdToken.mockResolvedValue({ uid });
    mockDb.collection().doc().delete.mockResolvedValue();

    const result = await activityService.deleteBucket(uid, bucketId);

    expect(mockAuth.verifyIdToken).toHaveBeenCalled();
    expect(mockDb.collection().doc().delete).toHaveBeenCalledWith(bucketId);
    expect(result).toEqual({ success: true });
  });

  it('should create an event successfully', async () => {
    const uid = 'test-uid';
    const bucketId = 'test-bucket';
    const eventData = {
      timestamp: new Date().toISOString(),
      duration: 3600,
      data: { app: 'code.exe' },
    };

    mockAuth.verifyIdToken.mockResolvedValue({ uid });
    mockDb.collection().doc().set.mockResolvedValue();

    const result = await activityService.createEvent(uid, bucketId, eventData);

    expect(mockAuth.verifyIdToken).toHaveBeenCalled();
    expect(mockDb.collection().doc().set).toHaveBeenCalledWith({
      ...eventData,
      bucket_id: bucketId,
      user_id: uid,
      created_at: expect.anything(),
    });
    expect(result).toEqual({ success: true });
  });

  it('should get an event successfully', async () => {
    const uid = 'test-uid';
    const bucketId = 'test-bucket';
    const eventId = 'test-event';
    const mockEvent = { id: eventId, duration: 3600 };

    mockAuth.verifyIdToken.mockResolvedValue({ uid });
    mockDb.collection().doc().get.mockResolvedValue({
      exists: true,
      data: () => mockEvent,
    });

    const result = await activityService.getEvent(uid, bucketId, eventId);

    expect(mockAuth.verifyIdToken).toHaveBeenCalled();
    expect(mockDb.collection().doc().get).toHaveBeenCalledWith(eventId);
    expect(result).toEqual(mockEvent);
  });

  it('should update an event successfully', async () => {
    const uid = 'test-uid';
    const bucketId = 'test-bucket';
    const eventId = 'test-event';
    const updateData = { duration: 7200 };

    mockAuth.verifyIdToken.mockResolvedValue({ uid });
    mockDb.collection().doc().update.mockResolvedValue();

    const result = await activityService.updateEvent(uid, bucketId, eventId, updateData);

    expect(mockAuth.verifyIdToken).toHaveBeenCalled();
    expect(mockDb.collection().doc().update).toHaveBeenCalledWith({
      ...updateData,
      updated_at: expect.anything(),
    });
    expect(result).toEqual({ success: true });
  });

  it('should delete an event successfully', async () => {
    const uid = 'test-uid';
    const bucketId = 'test-bucket';
    const eventId = 'test-event';

    mockAuth.verifyIdToken.mockResolvedValue({ uid });
    mockDb.collection().doc().delete.mockResolvedValue();

    const result = await activityService.deleteEvent(uid, bucketId, eventId);

    expect(mockAuth.verifyIdToken).toHaveBeenCalled();
    expect(mockDb.collection().doc().delete).toHaveBeenCalledWith(eventId);
    expect(result).toEqual({ success: true });
  });
});
