/**
 * Performance Optimization Utilities Index (141-160)
 *
 * Merkezi export point for all performance optimization utilities.
 * Frontend performance monitoring, caching, memory management ve bundle optimization.
 */

// Frontend Performance Monitoring (141-145)
export {
  FrontendPerformanceMonitor,
  frontendPerformanceMonitor,
  useComponentPerformance,
  useOptimizedComputed,
  createLazyComponent,
  BundleAnalyzer,
  type FrontendPerformanceMetrics,
  type ComponentMetrics,
} from './frontend-performance';

// Advanced Caching Strategies (146-150)
export {
  AdvancedCacheManager,
  globalCacheManager,
  useAdvancedCache,
  CachePreloader,
  cachePreloader,
  type CacheEntry,
  type CacheStats,
  type CacheConfig,
} from './advanced-caching';

// Memory Management (151-155)
export {
  FrontendMemoryMonitor,
  frontendMemoryMonitor,
  ObjectPool,
  objectPools,
  MemoryEfficientProcessor,
  useMemoryManagement,
  useVirtualScrolling,
  type MemoryStats,
  type MemoryAlert,
  type ObjectPoolConfig,
} from './memory-management';

// Bundle Optimization (156-160)
export {
  LazyLoadingManager,
  lazyLoadingManager,
  ResourcePreloader,
  RoutePreloader,
  routePreloader,
  useLazyLoading,
  useResourcePreloader,
  type BundleChunk,
  type LoadingStrategy,
  type ResourceMetrics,
} from './bundle-optimization';

/**
 * Performance Optimization Orchestrator
 * Coordinate all performance optimization strategies
 */
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private isInitialized = false;

  static getInstance(): PerformanceOptimizer {
    if (!this.instance) {
      this.instance = new PerformanceOptimizer();
    }
    return this.instance;
  }

  /**
   * Initialize all performance optimization systems
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Performance Optimization Systems...');

    try {
      // Start memory monitoring
      frontendMemoryMonitor.startMonitoring();

      // Start frontend performance monitoring
      frontendPerformanceMonitor;

      // Initialize lazy loading
      lazyLoadingManager;

      // Set up cache preloader
      cachePreloader;

      // Register performance callbacks
      this.registerPerformanceCallbacks();

      this.isInitialized = true;
      console.log('✅ Performance Optimization Systems initialized');
    } catch (error) {
      console.error('❌ Failed to initialize performance systems:', error);
    }
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): {
    frontend: FrontendPerformanceMetrics;
    memory: MemoryStats;
    cache: CacheStats;
    bundle: ResourceMetrics;
    recommendations: string[];
  } {
    const frontendMetrics = frontendPerformanceMonitor.getPerformanceReport();
    const memoryStats = frontendMemoryMonitor.getCurrentMemoryStats();
    const cacheStats = globalCacheManager.getStats();
    const bundleMetrics = lazyLoadingManager.getBundleMetrics();

    return {
      frontend: frontendMetrics,
      memory: memoryStats,
      cache: cacheStats,
      bundle: bundleMetrics,
      recommendations: this.generateRecommendations(
        frontendMetrics,
        memoryStats,
        cacheStats,
        bundleMetrics
      ),
    };
  }

  /**
   * Generate performance optimization recommendations
   */
  private generateRecommendations(
    frontend: FrontendPerformanceMetrics,
    memory: MemoryStats,
    cache: CacheStats,
    bundle: ResourceMetrics
  ): string[] {
    const recommendations: string[] = [];

    // Frontend performance recommendations
    if (frontend.componentRenderTime > 100) {
      recommendations.push('Optimize component rendering - average render time is high');
    }

    if (frontend.routeTransitionTime > 200) {
      recommendations.push('Implement route preloading to reduce transition times');
    }

    if (frontend.apiResponseTime > 1000) {
      recommendations.push('Consider API response caching or optimization');
    }

    // Memory recommendations
    if (memory.usedPercentage > 80) {
      recommendations.push('High memory usage detected - consider memory cleanup');
    }

    if (memory.trend === 'increasing') {
      recommendations.push('Memory usage is increasing - check for memory leaks');
    }

    // Cache recommendations
    if (cache.hitRate < 60) {
      recommendations.push('Low cache hit rate - optimize caching strategy');
    }

    if (cache.totalSize > 50 * 1024 * 1024) {
      // 50MB
      recommendations.push('Cache size is large - implement cache cleanup');
    }

    // Bundle recommendations
    if (bundle.totalBundleSize > 2 * 1024 * 1024) {
      // 2MB
      recommendations.push('Large bundle size - consider code splitting');
    }

    if (bundle.averageLoadTime > 300) {
      recommendations.push('Slow chunk loading - implement aggressive preloading');
    }

    return recommendations;
  }

  /**
   * Register performance monitoring callbacks
   */
  private registerPerformanceCallbacks(): void {
    // Memory alerts
    frontendMemoryMonitor.onMemoryChange('optimizer', stats => {
      if (stats.usedPercentage > 90) {
        console.warn('🚨 Critical memory usage:', stats.usedPercentage.toFixed(1), '%');
        this.handleCriticalMemoryUsage();
      }
    });

    // Performance degradation detection
    frontendPerformanceMonitor; // Already has internal monitoring
  }

  /**
   * Handle critical memory usage
   */
  private async handleCriticalMemoryUsage(): Promise<void> {
    console.log('🧹 Performing emergency memory cleanup...');

    try {
      // Clear caches
      await globalCacheManager.clear();

      // Clear object pools
      objectPools.arrays.clear();
      objectPools.objects.clear();

      // Force garbage collection
      await frontendMemoryMonitor.forceGarbageCollection();

      console.log('✅ Emergency memory cleanup completed');
    } catch (error) {
      console.error('❌ Emergency cleanup failed:', error);
    }
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    frontendMemoryMonitor.stopMonitoring();
    globalCacheManager.destroy();
    this.isInitialized = false;
  }
}

// Global performance optimizer
export const performanceOptimizer = PerformanceOptimizer.getInstance();

/**
 * Vue Plugin for Performance Optimization
 */
export const PerformanceOptimizationPlugin = {
  install(app: any) {
    // Initialize performance optimization
    performanceOptimizer.initialize();

    // Provide performance utilities globally
    app.config.globalProperties.$performance = {
      monitor: frontendPerformanceMonitor,
      cache: globalCacheManager,
      memory: frontendMemoryMonitor,
      optimizer: performanceOptimizer,
    };

    // Development-only performance warnings
    if (process.env.NODE_ENV === 'development') {
      app.config.warnHandler = (msg: string, instance: any, trace: string) => {
        if (msg.includes('performance')) {
          console.warn('🐌 Performance Warning:', msg, { instance, trace });
        }
      };
    }
  },
};

/**
 * Performance optimization composable
 */
export function usePerformanceOptimization() {
  return {
    optimizer: performanceOptimizer,
    report: () => performanceOptimizer.getPerformanceReport(),
    initialize: () => performanceOptimizer.initialize(),
    cleanup: () => performanceOptimizer.destroy(),
  };
}
