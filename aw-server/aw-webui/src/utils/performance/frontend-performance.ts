/**
 * Frontend Performance Optimization Utilities (141-145)
 *
 * Vue.js ve frontend aplikasyonları için kapsamlı performans optimizasyon sistemi.
 * Bundle optimization, lazy loading, component optimization ve rendering optimizasyonları.
 */

import { computed, nextTick, onUnmounted, watchEffect } from 'vue';
import type { Ref, ComputedRef } from 'vue';

// Performance metrics interface
export interface FrontendPerformanceMetrics {
  componentRenderTime: number;
  bundleLoadTime: number;
  routeTransitionTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  apiResponseTime: number;
  lastUpdated: Date;
}

// Component performance tracking
export interface ComponentMetrics {
  name: string;
  mountTime: number;
  updateCount: number;
  avgUpdateTime: number;
  memoryFootprint: number;
  rerenderCount: number;
}

/**
 * Frontend Performance Monitor
 * Vue components ve route'lar için performance tracking
 */
export class FrontendPerformanceMonitor {
  private static instance: FrontendPerformanceMonitor;
  private componentMetrics = new Map<string, ComponentMetrics>();
  private routeMetrics = new Map<string, number>();
  private apiMetrics = new Map<string, number[]>();
  private enabled = process.env.NODE_ENV === 'development';

  static getInstance(): FrontendPerformanceMonitor {
    if (!this.instance) {
      this.instance = new FrontendPerformanceMonitor();
    }
    return this.instance;
  }

  /**
   * Component mount time tracking
   */
  trackComponentMount(componentName: string, startTime: number): void {
    if (!this.enabled) return;

    const mountTime = performance.now() - startTime;

    const existing = this.componentMetrics.get(componentName);
    if (existing) {
      existing.updateCount++;
      existing.avgUpdateTime = (existing.avgUpdateTime + mountTime) / 2;
    } else {
      this.componentMetrics.set(componentName, {
        name: componentName,
        mountTime,
        updateCount: 1,
        avgUpdateTime: mountTime,
        memoryFootprint: this.estimateMemoryUsage(),
        rerenderCount: 0,
      });
    }

    // Log slow components
    if (mountTime > 100) {
      console.warn(`🐌 Slow component mount: ${componentName} took ${mountTime.toFixed(2)}ms`);
    }
  }

  /**
   * Track component re-renders
   */
  trackRerender(componentName: string): void {
    if (!this.enabled) return;

    const metrics = this.componentMetrics.get(componentName);
    if (metrics) {
      metrics.rerenderCount++;

      // Warn about excessive rerenders
      if (metrics.rerenderCount > 10) {
        console.warn(`🔄 Excessive rerenders in ${componentName}: ${metrics.rerenderCount} times`);
      }
    }
  }

  /**
   * Track route transition time
   */
  trackRouteTransition(routeName: string, transitionTime: number): void {
    if (!this.enabled) return;

    this.routeMetrics.set(routeName, transitionTime);

    if (transitionTime > 200) {
      console.warn(`🚀 Slow route transition: ${routeName} took ${transitionTime.toFixed(2)}ms`);
    }
  }

  /**
   * Track API response times
   */
  trackAPIResponse(endpoint: string, responseTime: number): void {
    if (!this.enabled) return;

    const times = this.apiMetrics.get(endpoint) || [];
    times.push(responseTime);

    // Keep only last 10 measurements
    if (times.length > 10) {
      times.shift();
    }

    this.apiMetrics.set(endpoint, times);

    // Warn about slow API calls
    if (responseTime > 1000) {
      console.warn(`🌐 Slow API call: ${endpoint} took ${responseTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): FrontendPerformanceMetrics {
    const componentRenderTime =
      Array.from(this.componentMetrics.values()).reduce(
        (sum, metric) => sum + metric.avgUpdateTime,
        0
      ) / this.componentMetrics.size || 0;

    const routeTransitionTime =
      Array.from(this.routeMetrics.values()).reduce((sum, time) => sum + time, 0) /
        this.routeMetrics.size || 0;

    const apiResponseTime =
      Array.from(this.apiMetrics.values())
        .flat()
        .reduce((sum, time) => sum + time, 0) /
        Array.from(this.apiMetrics.values()).flat().length || 0;

    return {
      componentRenderTime,
      bundleLoadTime: this.measureBundleLoadTime(),
      routeTransitionTime,
      memoryUsage: this.estimateMemoryUsage(),
      cacheHitRate: this.calculateCacheHitRate(),
      apiResponseTime,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get component-specific metrics
   */
  getComponentMetrics(): ComponentMetrics[] {
    return Array.from(this.componentMetrics.values()).sort(
      (a, b) => b.avgUpdateTime - a.avgUpdateTime
    );
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.componentMetrics.clear();
    this.routeMetrics.clear();
    this.apiMetrics.clear();
  }

  private estimateMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private measureBundleLoadTime(): number {
    const navigationTiming = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    if (navigationTiming) {
      return navigationTiming.loadEventEnd - navigationTiming.loadEventStart;
    }
    return 0;
  }

  private calculateCacheHitRate(): number {
    // Calculate cache hit rate from API metrics
    const totalCalls = Array.from(this.apiMetrics.values()).flat().length;
    const fastCalls = Array.from(this.apiMetrics.values())
      .flat()
      .filter(time => time < 50).length; // Under 50ms likely cached

    return totalCalls > 0 ? (fastCalls / totalCalls) * 100 : 0;
  }
}

/**
 * Vue Composable for Component Performance Tracking
 */
export function useComponentPerformance(componentName: string) {
  const monitor = FrontendPerformanceMonitor.getInstance();
  const startTime = performance.now();
  let updateCount = 0;

  // Track mount time
  nextTick(() => {
    monitor.trackComponentMount(componentName, startTime);
  });

  // Track updates
  watchEffect(() => {
    updateCount++;
    if (updateCount > 1) {
      monitor.trackRerender(componentName);
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    // Component cleanup logic here
  });

  return {
    trackCustomMetric: (metricName: string, value: number) => {
      console.log(`📊 ${componentName}.${metricName}: ${value}`);
    },
  };
}

/**
 * Performance-Optimized Computed Properties
 */
export function useOptimizedComputed<T>(getter: () => T, dependencies: Ref<any>[]): ComputedRef<T> {
  // Memoization with dependency tracking
  const memoCache = new Map<string, { value: T; deps: any[] }>();

  return computed(() => {
    const currentDeps = dependencies.map(dep => dep.value);
    const depsKey = JSON.stringify(currentDeps);

    const cached = memoCache.get(depsKey);
    if (cached && JSON.stringify(cached.deps) === depsKey) {
      return cached.value;
    }

    const value = getter();
    memoCache.set(depsKey, { value, deps: currentDeps });
    return value;
  });
}

/**
 * Lazy Loading Utilities
 */
export function createLazyComponent(importFn: () => Promise<any>) {
  return () => ({
    component: importFn(),
    loading: () => import('@/components/common/LoadingSpinner.vue'),
    error: () => import('@/components/common/ErrorBoundary.vue'),
    delay: 100,
    timeout: 10000,
  });
}

/**
 * Bundle Size Analyzer (Development Only)
 */
export class BundleAnalyzer {
  static analyzeLoadedModules(): void {
    if (process.env.NODE_ENV !== 'development') return;

    const modules = performance
      .getEntriesByType('resource')
      .filter(entry => entry.name.includes('.js') || entry.name.includes('.css'))
      .map(entry => {
        const resourceEntry = entry as any; // Performance Resource Timing API
        return {
          name: entry.name.split('/').pop() || '',
          size: resourceEntry.transferSize || 0,
          loadTime: entry.duration || 0,
        };
      })
      .sort((a, b) => b.size - a.size);

    console.group('📦 Bundle Analysis');
    console.table(modules.slice(0, 10)); // Top 10 largest
    console.groupEnd();
  }

  static generateOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const resources = performance.getEntriesByType('resource');

    const totalSize = resources.reduce((sum, entry) => {
      const resourceEntry = entry as any;
      return sum + (resourceEntry.transferSize || 0);
    }, 0);
    const jsFiles = resources.filter(entry => entry.name.includes('.js'));
    const cssFiles = resources.filter(entry => entry.name.includes('.css'));

    if (totalSize > 2 * 1024 * 1024) {
      // 2MB
      suggestions.push('Consider code splitting to reduce bundle size');
    }

    if (jsFiles.length > 10) {
      suggestions.push('Consider combining small JavaScript files');
    }

    if (cssFiles.length > 5) {
      suggestions.push('Consider CSS bundling optimization');
    }

    return suggestions;
  }
}

// Global performance monitor instance
export const frontendPerformanceMonitor = FrontendPerformanceMonitor.getInstance();
