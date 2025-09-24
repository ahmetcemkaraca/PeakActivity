/**
 * Advanced Frontend Caching Strategies (146-150)
 * 
 * Intelligent caching system ile memory management, cache invalidation,
 * ve multi-level cache hierarchy implementation.
 */

import { reactive, computed } from 'vue';

// Cache interface definitions
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number;
  entryCount: number;
  hitRate: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  maxEntries: number;
  enableLRU: boolean;
  enableStats: boolean;
}

/**
 * Advanced Multi-Level Cache System
 * Memory cache + SessionStorage + IndexedDB layers
 */
export class AdvancedCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = reactive({
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    entryCount: 0,
    hitRate: 0
  });
  
  private config: CacheConfig;
  private cleanupInterval: number | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxEntries: 1000,
      enableLRU: true,
      enableStats: true,
      ...config
    };

    this.startCleanupScheduler();
  }

  /**
   * Get value from cache with fallback hierarchy
   */
  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.updateAccessStats(memoryEntry);
      this.incrementHit();
      return memoryEntry.value;
    }

    // Level 2: SessionStorage cache
    const sessionValue = await this.getFromSessionStorage<T>(key);
    if (sessionValue !== null) {
      // Promote to memory cache
      this.set(key, sessionValue, this.config.defaultTTL);
      this.incrementHit();
      return sessionValue;
    }

    // Level 3: IndexedDB cache
    const indexedDBValue = await this.getFromIndexedDB<T>(key);
    if (indexedDBValue !== null) {
      // Promote to higher levels
      this.set(key, indexedDBValue, this.config.defaultTTL);
      await this.setToSessionStorage(key, indexedDBValue);
      this.incrementHit();
      return indexedDBValue;
    }

    this.incrementMiss();
    return null;
  }

  /**
   * Set value in multi-level cache
   */
  async set<T>(key: string, value: T, ttl?: number, tags: string[] = []): Promise<void> {
    const actualTTL = ttl || this.config.defaultTTL;
    const size = this.estimateSize(value);
    
    // Check cache size limits
    if (this.stats.totalSize + size > this.config.maxSize) {
      await this.evictLRU(size);
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl: actualTTL,
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
      tags
    };

    // Level 1: Memory cache
    this.memoryCache.set(key, entry);
    this.updateStats(size);

    // Level 2: SessionStorage (for smaller items)
    if (size < 1024 * 100) { // 100KB threshold
      await this.setToSessionStorage(key, value);
    }

    // Level 3: IndexedDB (for larger items or persistent cache)
    if (tags.includes('persistent') || size > 1024 * 10) { // 10KB threshold
      await this.setToIndexedDB(key, value, actualTTL);
    }
  }

  /**
   * Intelligent cache invalidation by tags
   */
  async invalidateByTag(tag: string): Promise<void> {
    const keysToInvalidate: string[] = [];
    
    // Find entries with matching tag
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags.includes(tag)) {
        keysToInvalidate.push(key);
      }
    }

    // Remove from all cache levels
    for (const key of keysToInvalidate) {
      await this.delete(key);
    }
  }

  /**
   * Delete from all cache levels
   */
  async delete(key: string): Promise<void> {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.memoryCache.delete(key);
      this.updateStats(-entry.size);
    }

    // Remove from other levels
    await this.removeFromSessionStorage(key);
    await this.removeFromIndexedDB(key);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache levels
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.stats.totalSize = 0;
    this.stats.entryCount = 0;
    this.stats.evictions = 0;

    // Clear other levels
    sessionStorage.clear();
    await this.clearIndexedDB();
  }

  /**
   * Memory-aware cache warming
   */
  async warmCache(keys: string[], fetcher: (key: string) => Promise<any>): Promise<void> {
    const maxConcurrent = 5; // Limit concurrent requests
    const chunks = this.chunkArray(keys, maxConcurrent);

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (key) => {
          try {
            const value = await fetcher(key);
            await this.set(key, value, this.config.defaultTTL, ['warmed']);
          } catch (error) {
            console.warn(`Cache warming failed for key ${key}:`, error);
          }
        })
      );
    }
  }

  // Private helper methods
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private updateAccessStats(entry: CacheEntry<any>): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  private incrementHit(): void {
    this.stats.hits++;
    this.updateHitRate();
  }

  private incrementMiss(): void {
    this.stats.misses++;
    this.updateHitRate();
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private updateStats(sizeChange: number): void {
    this.stats.totalSize += sizeChange;
    if (sizeChange > 0) {
      this.stats.entryCount++;
    } else {
      this.stats.entryCount--;
    }
  }

  private async evictLRU(requiredSize: number): Promise<void> {
    const entries = Array.from(this.memoryCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedSize = 0;
    for (const [key, entry] of entries) {
      this.memoryCache.delete(key);
      freedSize += entry.size;
      this.stats.evictions++;
      this.updateStats(-entry.size);

      if (freedSize >= requiredSize) {
        break;
      }
    }
  }

  private estimateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 1024; // Default 1KB estimate
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // SessionStorage helpers
  private async getFromSessionStorage<T>(key: string): Promise<T | null> {
    try {
      const item = sessionStorage.getItem(`aw_cache_${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        sessionStorage.removeItem(`aw_cache_${key}`);
        return null;
      }

      return parsed.value;
    } catch {
      return null;
    }
  }

  private async setToSessionStorage<T>(key: string, value: T): Promise<void> {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        ttl: this.config.defaultTTL
      };
      sessionStorage.setItem(`aw_cache_${key}`, JSON.stringify(item));
    } catch (error) {
      // SessionStorage might be full, ignore
      console.warn('SessionStorage cache failed:', error);
    }
  }

  private async removeFromSessionStorage(key: string): Promise<void> {
    sessionStorage.removeItem(`aw_cache_${key}`);
  }

  // IndexedDB helpers (TODO: Implement when needed)
  private async getFromIndexedDB<T>(_key: string): Promise<T | null> {
    // TODO: Implement IndexedDB operations when needed
    return null;
  }

  private async setToIndexedDB<T>(_key: string, _value: T, _ttl: number): Promise<void> {
    // TODO: Implement IndexedDB operations when needed
  }

  private async removeFromIndexedDB(_key: string): Promise<void> {
    // TODO: Implement IndexedDB operations when needed
  }

  private async clearIndexedDB(): Promise<void> {
    // TODO: Implement IndexedDB operations when needed
  }

  private startCleanupScheduler(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpiredEntries(): void {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Vue Composable for Advanced Caching
 */
export function useAdvancedCache() {
  const cacheManager = new AdvancedCacheManager();
  const stats = computed(() => cacheManager.getStats());

  const cachedFetch = async <T>(
    key: string, 
    fetcher: () => Promise<T>,
    options: { ttl?: number; tags?: string[] } = {}
  ): Promise<T> => {
    // Try cache first
    const cached = await cacheManager.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const value = await fetcher();
    await cacheManager.set(key, value, options.ttl, options.tags);
    return value;
  };

  const invalidateTag = (tag: string) => cacheManager.invalidateByTag(tag);
  const clearCache = () => cacheManager.clear();
  const warmCache = (keys: string[], fetcher: (key: string) => Promise<any>) =>
    cacheManager.warmCache(keys, fetcher);

  return {
    cachedFetch,
    invalidateTag,
    clearCache,
    warmCache,
    stats,
    cacheManager
  };
}

/**
 * Smart Cache Preloader
 * Prefetch critical data based on user behavior patterns
 */
export class CachePreloader {
  private preloadQueue = new Set<string>();
  private preloadHistory = new Map<string, number>();
  private isPreloading = false;

  /**
   * Add item to preload queue
   */
  queuePreload(key: string, priority = 1): void {
    this.preloadHistory.set(key, (this.preloadHistory.get(key) || 0) + priority);
    this.preloadQueue.add(key);
  }

  /**
   * Start intelligent preloading
   */
  async startPreloading(
    fetcher: (key: string) => Promise<any>,
    cacheManager: AdvancedCacheManager
  ): Promise<void> {
    if (this.isPreloading) return;
    
    this.isPreloading = true;

    // Sort by priority (access frequency)
    const sortedKeys = Array.from(this.preloadQueue)
      .sort((a, b) => (this.preloadHistory.get(b) || 0) - (this.preloadHistory.get(a) || 0));

    for (const key of sortedKeys) {
      try {
        // Check if already cached
        const cached = await cacheManager.get(key);
        if (cached === null) {
          const value = await fetcher(key);
          await cacheManager.set(key, value, undefined, ['preloaded']);
        }
        
        this.preloadQueue.delete(key);
        
        // Throttle preloading to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.warn(`Preload failed for ${key}:`, error);
      }
    }

    this.isPreloading = false;
  }

  /**
   * Get preload recommendations based on patterns
   */
  getRecommendations(): string[] {
    return Array.from(this.preloadHistory.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key]) => key);
  }
}

// Global cache manager instance
export const globalCacheManager = new AdvancedCacheManager();
export const cachePreloader = new CachePreloader();
