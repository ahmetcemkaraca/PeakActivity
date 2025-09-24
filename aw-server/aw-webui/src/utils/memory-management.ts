/**
 * Memory Management and Optimization (151-155)
 *
 * Frontend memory monitoring, leak detection ve optimization strategies.
 * Large dataset processing ve memory-efficient algorithms.
 */

import { ref, onUnmounted, nextTick } from 'vue';
import type { Ref } from 'vue';

// Memory monitoring interfaces
export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastChecked: Date;
}

export interface MemoryAlert {
  type: 'warning' | 'critical';
  message: string;
  currentUsage: number;
  threshold: number;
  timestamp: Date;
}

export interface ObjectPoolConfig {
  maxSize: number;
  createFn: () => any;
  resetFn?: (obj: any) => void;
  validateFn?: (obj: any) => boolean;
}

/**
 * Frontend Memory Monitor
 * Real-time memory usage tracking ve leak detection
 */
export class FrontendMemoryMonitor {
  private static instance: FrontendMemoryMonitor;
  private memoryHistory: MemoryStats[] = [];
  private alerts: MemoryAlert[] = [];
  private monitoringInterval: number | null = null;
  private callbacks = new Map<string, (stats: MemoryStats) => void>();

  // Memory thresholds
  private readonly MEMORY_WARNING_THRESHOLD = 0.7; // 70%
  private readonly MEMORY_CRITICAL_THRESHOLD = 0.9; // 90%
  private readonly HISTORY_MAX_LENGTH = 100;

  static getInstance(): FrontendMemoryMonitor {
    if (!this.instance) {
      this.instance = new FrontendMemoryMonitor();
    }
    return this.instance;
  }

  /**
   * Start memory monitoring
   */
  startMonitoring(intervalMs = 5000): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = window.setInterval(() => {
      const stats = this.getCurrentMemoryStats();
      this.addMemoryStats(stats);
      this.checkMemoryThresholds(stats);
      this.notifyCallbacks(stats);
    }, intervalMs);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get current memory statistics
   */
  getCurrentMemoryStats(): MemoryStats {
    const performance = window.performance as any;
    const memory = performance.memory || {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };

    const usedPercentage =
      memory.jsHeapSizeLimit > 0 ? (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100 : 0;

    const trend = this.calculateTrend();

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercentage,
      trend,
      lastChecked: new Date(),
    };
  }

  /**
   * Register callback for memory events
   */
  onMemoryChange(name: string, callback: (stats: MemoryStats) => void): void {
    this.callbacks.set(name, callback);
  }

  /**
   * Unregister callback
   */
  offMemoryChange(name: string): void {
    this.callbacks.delete(name);
  }

  /**
   * Get memory history
   */
  getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * Get memory alerts
   */
  getAlerts(): MemoryAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Force garbage collection (if available)
   */
  async forceGarbageCollection(): Promise<void> {
    // Modern browsers don't expose GC directly
    // But we can trigger it indirectly
    if ('gc' in window) {
      (window as any).gc();
    } else {
      // Create and release large objects to encourage GC
      const arrays = [];
      for (let i = 0; i < 10; i++) {
        arrays.push(new Array(1000000).fill(0));
      }
      arrays.length = 0;

      // Wait for next tick
      await nextTick();
    }
  }

  /**
   * Detect potential memory leaks
   */
  detectMemoryLeaks(): {
    isLikelyLeak: boolean;
    confidence: number;
    details: string;
  } {
    if (this.memoryHistory.length < 10) {
      return {
        isLikelyLeak: false,
        confidence: 0,
        details: 'Insufficient data for leak detection',
      };
    }

    const recent = this.memoryHistory.slice(-10);
    const increasing = recent.every((stats, index) => {
      if (index === 0) return true;
      return stats.usedJSHeapSize >= recent[index - 1].usedJSHeapSize;
    });

    const growth = recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize;
    const growthRate = growth / recent[0].usedJSHeapSize;

    const isLikelyLeak = increasing && growthRate > 0.5; // 50% growth
    const confidence = Math.min(growthRate * 100, 100);

    return {
      isLikelyLeak,
      confidence,
      details: `Memory ${increasing ? 'continuously increasing' : 'stable'}, growth: ${(growthRate * 100).toFixed(1)}%`,
    };
  }

  private addMemoryStats(stats: MemoryStats): void {
    this.memoryHistory.push(stats);

    if (this.memoryHistory.length > this.HISTORY_MAX_LENGTH) {
      this.memoryHistory.shift();
    }
  }

  private calculateTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memoryHistory.length < 3) return 'stable';

    const recent = this.memoryHistory.slice(-3);
    const first = recent[0].usedJSHeapSize;
    const last = recent[recent.length - 1].usedJSHeapSize;
    const difference = last - first;
    const threshold = first * 0.05; // 5% threshold

    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  private checkMemoryThresholds(stats: MemoryStats): void {
    const percentage = stats.usedPercentage / 100;

    if (percentage > this.MEMORY_CRITICAL_THRESHOLD) {
      this.addAlert({
        type: 'critical',
        message: 'Critical memory usage detected',
        currentUsage: percentage,
        threshold: this.MEMORY_CRITICAL_THRESHOLD,
        timestamp: new Date(),
      });
    } else if (percentage > this.MEMORY_WARNING_THRESHOLD) {
      this.addAlert({
        type: 'warning',
        message: 'High memory usage detected',
        currentUsage: percentage,
        threshold: this.MEMORY_WARNING_THRESHOLD,
        timestamp: new Date(),
      });
    }
  }

  private addAlert(alert: MemoryAlert): void {
    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }

    console.warn(`Memory Alert: ${alert.message} (${(alert.currentUsage * 100).toFixed(1)}%)`);
  }

  private notifyCallbacks(stats: MemoryStats): void {
    this.callbacks.forEach(callback => {
      try {
        callback(stats);
      } catch (error) {
        console.error('Memory callback error:', error);
      }
    });
  }
}

/**
 * Object Pool for Memory Optimization
 * Reuse objects to reduce garbage collection pressure
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private config: ObjectPoolConfig;
  private created = 0;
  private acquired = 0;
  private released = 0;

  constructor(config: ObjectPoolConfig) {
    this.config = config;
  }

  /**
   * Acquire object from pool
   */
  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
    } else {
      obj = this.config.createFn();
      this.created++;
    }

    this.acquired++;
    return obj;
  }

  /**
   * Release object back to pool
   */
  release(obj: T): void {
    if (this.pool.length >= this.config.maxSize) {
      return; // Pool is full, let GC handle it
    }

    // Validate object before returning to pool
    if (this.config.validateFn && !this.config.validateFn(obj)) {
      return;
    }

    // Reset object state
    if (this.config.resetFn) {
      this.config.resetFn(obj);
    }

    this.pool.push(obj);
    this.released++;
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    poolSize: number;
    created: number;
    acquired: number;
    released: number;
    hitRate: number;
  } {
    return {
      poolSize: this.pool.length,
      created: this.created,
      acquired: this.acquired,
      released: this.released,
      hitRate: this.acquired > 0 ? ((this.acquired - this.created) / this.acquired) * 100 : 0,
    };
  }

  /**
   * Clear pool
   */
  clear(): void {
    this.pool = [];
  }
}

/**
 * Memory-Efficient Data Processor
 * Process large datasets without overwhelming memory
 */
export class MemoryEfficientProcessor<T, R> {
  private chunkSize: number;
  private maxConcurrent: number;

  constructor(chunkSize = 1000, maxConcurrent = 3) {
    this.chunkSize = chunkSize;
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Process large array in memory-efficient chunks
   */
  async processArray(
    data: T[],
    processor: (chunk: T[]) => Promise<R[]> | R[],
    onProgress?: (progress: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const totalChunks = Math.ceil(data.length / this.chunkSize);
    let processedChunks = 0;

    // Process chunks in batches to control memory usage
    for (let i = 0; i < data.length; i += this.chunkSize * this.maxConcurrent) {
      const batch: Promise<R[]>[] = [];

      // Create batch of concurrent chunk processes
      for (let j = 0; j < this.maxConcurrent && i + j * this.chunkSize < data.length; j++) {
        const start = i + j * this.chunkSize;
        const end = Math.min(start + this.chunkSize, data.length);
        const chunk = data.slice(start, end);

        batch.push(Promise.resolve(processor(chunk)));
      }

      // Process batch and collect results
      const batchResults = await Promise.all(batch);
      for (const chunkResult of batchResults) {
        results.push(...chunkResult);
        processedChunks++;

        if (onProgress) {
          onProgress((processedChunks / totalChunks) * 100);
        }
      }

      // Force garbage collection between batches
      await this.waitNextTick();
    }

    return results;
  }

  /**
   * Stream processing for very large datasets
   */
  async *streamProcess<TInput, TOutput>(
    dataStream: AsyncIterable<TInput>,
    processor: (item: TInput) => Promise<TOutput> | TOutput
  ): AsyncGenerator<TOutput> {
    const buffer: TInput[] = [];

    for await (const item of dataStream) {
      buffer.push(item);

      if (buffer.length >= this.chunkSize) {
        const chunk = buffer.splice(0, this.chunkSize);
        for (const chunkItem of chunk) {
          yield await Promise.resolve(processor(chunkItem));
        }

        // Allow other tasks to run
        await this.waitNextTick();
      }
    }

    // Process remaining items
    for (const item of buffer) {
      yield await Promise.resolve(processor(item));
    }
  }

  private async waitNextTick(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0));
  }
}

/**
 * Vue Composable for Memory Management
 */
export function useMemoryManagement() {
  const monitor = FrontendMemoryMonitor.getInstance();
  const currentStats: Ref<MemoryStats | null> = ref(null);
  const alerts: Ref<MemoryAlert[]> = ref([]);

  // Start monitoring
  monitor.startMonitoring();

  // Register callback
  monitor.onMemoryChange('component', stats => {
    currentStats.value = stats;
    alerts.value = monitor.getAlerts();
  });

  // Cleanup on unmount
  onUnmounted(() => {
    monitor.offMemoryChange('component');
    monitor.stopMonitoring();
  });

  const forceGC = () => monitor.forceGarbageCollection();
  const detectLeaks = () => monitor.detectMemoryLeaks();
  const clearAlerts = () => {
    monitor.clearAlerts();
    alerts.value = [];
  };

  return {
    currentStats,
    alerts,
    forceGC,
    detectLeaks,
    clearAlerts,
    monitor,
  };
}

/**
 * Memory-aware Virtual Scrolling
 */
export function useVirtualScrolling<T>(items: Ref<T[]>, itemHeight = 50) {
  const containerRef: Ref<HTMLElement | null> = ref(null);
  const visibleStart = ref(0);
  const visibleEnd = ref(0);
  const containerHeight = ref(0);

  const visibleItems = computed(() => {
    return items.value.slice(visibleStart.value, visibleEnd.value);
  });

  const totalHeight = computed(() => items.value.length * itemHeight);

  const updateVisibleRange = () => {
    if (!containerRef.value) return;

    const scrollTop = containerRef.value.scrollTop;
    const clientHeight = containerRef.value.clientHeight;

    visibleStart.value = Math.floor(scrollTop / itemHeight);
    visibleEnd.value = Math.min(
      visibleStart.value + Math.ceil(clientHeight / itemHeight) + 5, // 5 item buffer
      items.value.length
    );
  };

  return {
    containerRef,
    visibleItems,
    visibleStart,
    visibleEnd,
    totalHeight,
    updateVisibleRange,
  };
}

// Global instances
export const frontendMemoryMonitor = FrontendMemoryMonitor.getInstance();

// Common object pools
export const objectPools = {
  arrays: new ObjectPool<any[]>({
    maxSize: 50,
    createFn: () => [],
    resetFn: arr => {
      arr.length = 0;
    },
  }),

  objects: new ObjectPool<Record<string, any>>({
    maxSize: 50,
    createFn: () => ({}),
    resetFn: obj => {
      for (const key in obj) {
        delete obj[key];
      }
    },
  }),
};
