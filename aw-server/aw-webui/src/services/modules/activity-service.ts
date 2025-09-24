/**
 * Activity Service Module
 *
 * ActivityWatch event'leri ve bucket'ları için specialized service modülü.
 * Type-safe API operations ve intelligent caching ile.
 */

import { APIService } from '../api';
import { AWEvent, AWBucket } from '../../types';
import { useErrorHandler } from '../../utils/error-manager';
import { getClient } from '../../util/awclient';

export interface EventQueryParams {
  start?: Date;
  end?: Date;
  limit?: number;
}

export class ActivityService {
  private apiService: APIService;
  private errorHandler: ReturnType<typeof useErrorHandler>;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  constructor() {
    const client = getClient();
    this.apiService = new APIService(client);
    this.errorHandler = useErrorHandler();
  }

  /**
   * Cache management
   */
  private getCacheKey(operation: string, params: any): string {
    return `${operation}_${JSON.stringify(params)}`;
  }

  private setCache(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private clearCacheByPattern(pattern: string): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Bucket operations
   */
  async getBuckets(useCache: boolean = true): Promise<AWBucket[]> {
    const cacheKey = this.getCacheKey('buckets', {});

    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    const result = await this.errorHandler.handleAsyncError(
      async () => {
        const bucketsMap = await this.apiService.getBuckets();
        const buckets = Object.values(bucketsMap);
        this.setCache(cacheKey, buckets);
        return buckets;
      },
      {
        type: 'network',
        component: 'ActivityService',
        action: 'getBuckets',
      }
    );

    return result || [];
  }

  async getBucket(bucketId: string, useCache: boolean = true): Promise<AWBucket | null> {
    const cacheKey = this.getCacheKey('bucket', { bucketId });

    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    return this.errorHandler.handleAsyncError(
      async () => {
        const bucket = await this.apiService.getBucket(bucketId);
        this.setCache(cacheKey, bucket);
        return bucket;
      },
      {
        type: 'network',
        component: 'ActivityService',
        action: 'getBucket',
        metadata: { bucketId },
      }
    );
  }

  async createBucket(bucket: Omit<AWBucket, 'created' | 'last_updated'>): Promise<boolean> {
    const result = await this.errorHandler.handleAsyncError(
      async () => {
        await this.apiService.createBucket(bucket);

        // Clear bucket list cache
        this.clearCacheByPattern('buckets');

        return true;
      },
      {
        type: 'network',
        severity: 'medium',
        component: 'ActivityService',
        action: 'createBucket',
        metadata: { bucket },
      }
    );

    return result || false;
  }

  async deleteBucket(bucketId: string): Promise<boolean> {
    const result = await this.errorHandler.handleAsyncError(
      async () => {
        await this.apiService.deleteBucket(bucketId);
        return true;
      },
      {
        type: 'network',
        severity: 'high',
        component: 'ActivityService',
        action: 'deleteBucket',
        metadata: { bucketId },
      }
    );

    if (result) {
      // Clear related caches
      this.clearCacheByPattern('buckets');
      this.clearCacheByPattern(`bucket_${bucketId}`);
      this.clearCacheByPattern(`events_${bucketId}`);
    }

    return result || false;
  }

  /**
   * Event operations
   */
  async getEvents(
    bucketId: string,
    params: EventQueryParams = {},
    useCache: boolean = true
  ): Promise<AWEvent[]> {
    const cacheKey = this.getCacheKey('events', { bucketId, params });

    if (useCache) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    const result = await this.errorHandler.handleAsyncError(
      async () => {
        const events = await this.apiService.getEvents(bucketId, params);

        // Cache with shorter TTL for events (2 minutes)
        this.setCache(cacheKey, events, 2 * 60 * 1000);

        return events;
      },
      {
        type: 'network',
        component: 'ActivityService',
        action: 'getEvents',
        metadata: { bucketId, params },
      }
    );

    return result || [];
  }

  async getEvent(bucketId: string, eventId: string): Promise<AWEvent | null> {
    const cacheKey = this.getCacheKey('event', { bucketId, eventId });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    return this.errorHandler.handleAsyncError(
      async () => {
        // TODO: Implement getEvent in APIService
        // const event = await this.apiService.getEvent(bucketId, eventId);
        // this.setCache(cacheKey, event);
        // return event;
        return null;
      },
      {
        type: 'network',
        component: 'ActivityService',
        action: 'getEvent',
        metadata: { bucketId, eventId },
      }
    );
  }

  async createEvent(bucketId: string, event: Omit<AWEvent, 'id'>): Promise<AWEvent | null> {
    return this.errorHandler.handleAsyncError(
      async () => {
        const createdEvent = await this.apiService.createEvent(bucketId, event);

        // Clear events cache for this bucket
        this.clearCacheByPattern(`events_${bucketId}`);

        return createdEvent;
      },
      {
        type: 'network',
        severity: 'medium',
        component: 'ActivityService',
        action: 'createEvent',
        metadata: { bucketId, event },
      }
    );
  }

  async updateEvent(
    bucketId: string,
    eventId: string,
    updates: Partial<AWEvent>
  ): Promise<AWEvent | null> {
    return this.errorHandler.handleAsyncError(
      async () => {
        // TODO: Implement updateEvent in APIService
        // const updatedEvent = await this.apiService.updateEvent(bucketId, eventId, updates);

        // Clear related caches
        this.clearCacheByPattern(`events_${bucketId}`);
        this.clearCacheByPattern(`event_${bucketId}_${eventId}`);

        // return updatedEvent;
        return null;
      },
      {
        type: 'network',
        severity: 'medium',
        component: 'ActivityService',
        action: 'updateEvent',
        metadata: { bucketId, eventId, updates },
      }
    );
  }

  async deleteEvent(bucketId: string, eventId: string): Promise<boolean> {
    const result = await this.errorHandler.handleAsyncError(
      async () => {
        await this.apiService.deleteEvent(bucketId, eventId);
        return true;
      },
      {
        type: 'network',
        severity: 'high',
        component: 'ActivityService',
        action: 'deleteEvent',
        metadata: { bucketId, eventId },
      }
    );

    if (result) {
      // Clear related caches
      this.clearCacheByPattern(`events_${bucketId}`);
      this.clearCacheByPattern(`event_${bucketId}_${eventId}`);
    }

    return result || false;
  }

  /**
   * Cache management
   */
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): {
    size: number;
    keys: string[];
    totalMemory: number;
  } {
    const keys = Array.from(this.cache.keys());
    const totalMemory = keys.reduce((acc, key) => {
      const item = this.cache.get(key);
      return acc + (item ? JSON.stringify(item.data).length : 0);
    }, 0);

    return {
      size: keys.length,
      keys,
      totalMemory,
    };
  }
}

// Export singleton instance
export const activityService = new ActivityService();
