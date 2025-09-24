import { describe, it, expect, vi } from 'vitest';
import { ActivityQueryService } from '../src/services/activity-query-service';
import { db } from '../src/firebaseAdmin';

// Mock Firestore
vi.mock('../src/firebaseAdmin', () => ({
  db: {
    collection: vi.fn()
  }
}));

describe('ActivityQueryService', () => {
  const mockCollection = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({
        data: () => ({ count: 10 })
      })
    }),
    get: vi.fn().mockResolvedValue({
      docs: [
        {
          data: () => ({
            id: 'event-1',
            timestamp_start: '2024-01-01T10:00:00Z',
            duration_sec: 3600,
            app: 'code.exe',
            title: 'Test Activity',
            category: 'development'
          })
        }
      ]
    })
  };

  vi.mocked(db.collection).mockReturnValue(mockCollection);

  describe('queryActivities', () => {
    it('should query activities with basic parameters', async () => {
      const options = {
        userId: 'test-user',
        startDate: '2024-01-01',
        endDate: '2024-01-07',
        limit: 10,
        offset: 0
      };

      const service = new ActivityQueryService();
      const result = await service.queryActivities(options);

      expect(db.collection).toHaveBeenCalledWith('users/test-user/activityEvents');
      expect(mockCollection.where).toHaveBeenCalledWith('timestamp_start', '>=', '2024-01-01');
      expect(mockCollection.where).toHaveBeenCalledWith('timestamp_start', '<=', '2024-01-07T23:59:59.999Z');
      expect(mockCollection.orderBy).toHaveBeenCalledWith('timestamp_start', 'desc');
      expect(mockCollection.limit).toHaveBeenCalledWith(10);
      expect(result.events).toHaveLength(1);
      expect(result.totalCount).toBe(10);
    });

    it('should apply category filter', async () => {
      const options = {
        userId: 'test-user',
        categories: ['development']
      };

      const service = new ActivityQueryService();
      await service.queryActivities(options);

      expect(mockCollection.where).toHaveBeenCalledWith('category', 'in', ['development']);
    });

    it('should apply appNames filter', async () => {
      const options = {
        userId: 'test-user',
        appNames: ['code.exe']
      };

      const service = new ActivityQueryService();
      await service.queryActivities(options);

      expect(mockCollection.where).toHaveBeenCalledWith('app', 'in', ['code.exe']);
    });

    it('should apply duration filters', async () => {
      const options = {
        userId: 'test-user',
        minDurationSeconds: 1800,
        maxDurationSeconds: 7200
      };

      const service = new ActivityQueryService();
      await service.queryActivities(options);

      expect(mockCollection.where).toHaveBeenCalledWith('duration_sec', '>=', 1800);
      expect(mockCollection.where).toHaveBeenCalledWith('duration_sec', '<=', 7200);
    });

    it('should apply keywords filter', async () => {
      const options = {
        userId: 'test-user',
        keywords: ['test']
      };

      const service = new ActivityQueryService();
      const result = await service.queryActivities(options);

      // Keywords are filtered in memory, so check the result
      expect(result.events[0].title).toContain('Test');
    });

    it('should handle pagination', async () => {
      const options = {
        userId: 'test-user',
        limit: 5,
        offset: 10
      };

      const service = new ActivityQueryService();
      await service.queryActivities(options);

      expect(mockCollection.offset).toHaveBeenCalledWith(10);
      expect(mockCollection.limit).toHaveBeenCalledWith(5);
    });

    it('should return empty events if no data', async () => {
      vi.mocked(db.collection).mockReturnValue({
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            data: () => ({ count: 0 })
          })
        }),
        get: vi.fn().mockResolvedValue({
          docs: []
        })
      });

      const service = new ActivityQueryService();
      const result = await service.queryActivities({ userId: 'test-user' });

      expect(result.events).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });
});
