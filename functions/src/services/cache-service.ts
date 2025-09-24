import { logger } from 'firebase-functions';

interface CacheEntry {
  key: string;
  value: any;
  expiry: number; // Timestamp
}

class InMemoryCache {
  private cache: Map<string, CacheEntry> = new Map();

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: any, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { key, value, expiry });
    logger.info('Cache set', { key, ttlSeconds });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
    logger.info('Cache invalidated', { key });
  }

  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }
}

export const cacheService = new InMemoryCache();
