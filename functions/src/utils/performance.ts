/**
 * TypeScript performance optimization utilities for Firebase Functions.
 * 
 * This module provides performance optimization tools specifically designed
 * for Firebase Functions and TypeScript environments, including caching,
 * profiling, and memory management.
 * 
 * Key Features:
 * - Function execution time profiling
 * - Response caching with TTL
 * - Memory usage monitoring
 * - Performance metrics collection
 * - Batch processing optimization
 */

import { logger } from 'firebase-functions';

export interface PerformanceMetrics {
  name: string;
  totalTime: number;
  callCount: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  lastCallTime: number;
  errors: number;
}

export interface CacheEntry<T> {
  value: T;
  expiry: number;
  size?: number;
}

export class PerformanceProfiler {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxCacheSize = 1000;
  private enabled = true;

  constructor(maxCacheSize = 1000) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Enable or disable performance profiling
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Decorator for profiling function execution time
   */
  profile(name?: string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      const profileName = name || `${target.constructor.name}.${propertyKey}`;

      descriptor.value = async function (...args: any[]) {
        if (!this.enabled) {
          return originalMethod.apply(this, args);
        }

        const startTime = performance.now();
        let error = false;

        try {
          const result = await originalMethod.apply(this, args);
          return result;
        } catch (e) {
          error = true;
          throw e;
        } finally {
          const endTime = performance.now();
          const executionTime = endTime - startTime;
          this.updateMetrics(profileName, executionTime, error);
        }
      };

      return descriptor;
    };
  }

  /**
   * Profile a function execution manually
   */
  async profileFunction<T>(
    name: string,
    func: () => Promise<T> | T
  ): Promise<T> {
    if (!this.enabled) {
      return await func();
    }

    const startTime = performance.now();
    let error = false;

    try {
      const result = await func();
      return result;
    } catch (e) {
      error = true;
      throw e;
    } finally {
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      this.updateMetrics(name, executionTime, error);
    }
  }

  /**
   * Decorator for caching function results
   */
  cache(ttlSeconds = 300, keyGenerator?: (...args: any[]) => string) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const cacheKey = keyGenerator 
          ? keyGenerator(...args)
          : `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached !== undefined) {
          logger.debug(`Cache hit for ${cacheKey}`);
          return cached;
        }

        // Execute function and cache result
        const result = await originalMethod.apply(this, args);
        this.setCache(cacheKey, result, ttlSeconds);
        
        return result;
      };

      return descriptor;
    };
  }

  /**
   * Get cached value
   */
  private getFromCache<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set cache value with TTL
   */
  private setCache<T>(key: string, value: T, ttlSeconds: number): void {
    // Check cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldestCacheEntry();
    }

    const expiry = Date.now() + (ttlSeconds * 1000);
    const size = this.estimateSize(value);
    
    this.cache.set(key, { value, expiry, size });
  }

  /**
   * Evict oldest cache entry
   */
  private evictOldestCacheEntry(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < oldestTime) {
        oldestTime = entry.expiry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(name: string, executionTime: number, error: boolean): void {
    let metric = this.metrics.get(name);
    
    if (!metric) {
      metric = {
        name,
        totalTime: 0,
        callCount: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0,
        lastCallTime: 0,
        errors: 0
      };
      this.metrics.set(name, metric);
    }

    metric.totalTime += executionTime;
    metric.callCount += 1;
    metric.avgTime = metric.totalTime / metric.callCount;
    metric.minTime = Math.min(metric.minTime, executionTime);
    metric.maxTime = Math.max(metric.maxTime, executionTime);
    metric.lastCallTime = executionTime;

    if (error) {
      metric.errors += 1;
    }

    // Log slow functions
    if (executionTime > 5000) { // 5 seconds
      logger.warn(`Slow function execution: ${name} took ${executionTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(name?: string): PerformanceMetrics[] {
    if (name) {
      const metric = this.metrics.get(name);
      return metric ? [metric] : [];
    }
    return Array.from(this.metrics.values());
  }

  /**
   * Get top slowest functions
   */
  getTopSlowest(count = 10): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, count);
  }

  /**
   * Get most called functions
   */
  getMostCalled(count = 10): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.callCount - a.callCount)
      .slice(0, count);
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const lines: string[] = [];
    lines.push('=== Performance Report ===');
    
    const slowest = this.getTopSlowest(5);
    if (slowest.length > 0) {
      lines.push('\nSlowest Functions (by avg time):');
      slowest.forEach(metric => {
        lines.push(`  ${metric.name}: ${metric.avgTime.toFixed(2)}ms avg (${metric.callCount} calls)`);
      });
    }

    const mostCalled = this.getMostCalled(5);
    if (mostCalled.length > 0) {
      lines.push('\nMost Called Functions:');
      mostCalled.forEach(metric => {
        lines.push(`  ${metric.name}: ${metric.callCount} calls (${metric.avgTime.toFixed(2)}ms avg)`);
      });
    }

    const totalFunctions = this.metrics.size;
    const totalCalls = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.callCount, 0);
    const totalErrors = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.errors, 0);

    lines.push(`\nSummary: ${totalFunctions} functions, ${totalCalls} total calls, ${totalErrors} errors`);
    lines.push(`Cache size: ${this.cache.size}/${this.maxCacheSize}`);

    return lines.join('\n');
  }

  /**
   * Clear all metrics and cache
   */
  clear(): void {
    this.metrics.clear();
    this.cache.clear();
  }

  /**
   * Estimate object size in bytes (rough approximation)
   */
  private estimateSize(obj: any): number {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size;
  }
}

/**
 * Batch processing utility for handling large datasets efficiently
 */
export class BatchProcessor<T, R> {
  constructor(
    private batchSize = 100,
    private concurrency = 5
  ) {}

  /**
   * Process items in batches with controlled concurrency
   */
  async processBatch(
    items: T[],
    processor: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    const batches: T[][] = [];

    // Split into batches
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }

    // Process batches with controlled concurrency
    for (let i = 0; i < batches.length; i += this.concurrency) {
      const concurrentBatches = batches.slice(i, i + this.concurrency);
      
      const batchPromises = concurrentBatches.map(async (batch) => {
        const batchResults = await Promise.all(
          batch.map(item => processor(item))
        );
        return batchResults;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.flat());

      // Log progress
      const processed = Math.min((i + this.concurrency) * this.batchSize, items.length);
      logger.debug(`Batch processing progress: ${processed}/${items.length} items`);
    }

    return results;
  }
}

/**
 * Memory monitoring utility
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private initialMemory: number;
  private maxMemory = 512 * 1024 * 1024; // 512MB default limit

  private constructor() {
    this.initialMemory = process.memoryUsage().heapUsed;
  }

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  /**
   * Get current memory usage
   */
  getCurrentUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  /**
   * Check if memory usage is within limits
   */
  checkMemoryLimit(): boolean {
    const usage = this.getCurrentUsage();
    if (usage.heapUsed > this.maxMemory) {
      logger.warn(`Memory usage exceeded limit: ${usage.heapUsed / 1024 / 1024}MB > ${this.maxMemory / 1024 / 1024}MB`);
      return false;
    }
    return true;
  }

  /**
   * Log memory usage delta
   */
  logMemoryDelta(operation: string): void {
    const current = process.memoryUsage().heapUsed;
    const delta = current - this.initialMemory;
    logger.debug(`Memory delta for ${operation}: ${delta / 1024 / 1024}MB`);
  }
}

// Global profiler instance
export const globalProfiler = new PerformanceProfiler();

// Convenience decorators
export const profile = (name?: string) => globalProfiler.profile(name);
export const cache = (ttlSeconds = 300, keyGenerator?: (...args: any[]) => string) => 
  globalProfiler.cache(ttlSeconds, keyGenerator);

// Utility functions
export const batchProcessor = new BatchProcessor();
export const memoryMonitor = MemoryMonitor.getInstance();

/**
 * Optimize object for JSON serialization
 */
export function optimizeForJson<T>(obj: T): T {
  // Remove undefined values to reduce payload size
  const optimized = JSON.parse(JSON.stringify(obj));
  return optimized;
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(
    private maxRequests = 100,
    private windowMs = 60000 // 1 minute
  ) {}

  /**
   * Check if request is within rate limit
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    let requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    requests = requests.filter(time => time > windowStart);
    
    if (requests.length >= this.maxRequests) {
      return false;
    }

    requests.push(now);
    this.requests.set(key, requests);
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string): number {
    const requests = this.requests.get(key) || [];
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const validRequests = requests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}
