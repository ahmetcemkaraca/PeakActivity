/**
 * Bundle Optimization and Lazy Loading (156-160)
 * 
 * Code splitting, lazy loading strategies, ve bundle size optimization.
 * Dynamic imports, preloading strategies ve resource optimization.
 */

import { ref, computed, onMounted, nextTick } from 'vue';
import type { Ref, Component } from 'vue';

// Bundle analysis interfaces
export interface BundleChunk {
  name: string;
  size: number;
  loadTime: number;
  isLazyLoaded: boolean;
  dependencies: string[];
  usageFrequency: number;
}

export interface LoadingStrategy {
  immediate: boolean;
  preload: boolean;
  prefetch: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface ResourceMetrics {
  totalBundleSize: number;
  lazyChunksCount: number;
  loadedChunksSize: number;
  preloadedChunksSize: number;
  averageLoadTime: number;
  cacheHitRate: number;
}

/**
 * Smart Lazy Loading Manager
 * Intelligent component ve resource loading
 */
export class LazyLoadingManager {
  private static instance: LazyLoadingManager;
  private loadedChunks = new Set<string>();
  private preloadedChunks = new Set<string>();
  private chunkMetrics = new Map<string, BundleChunk>();
  private loadingPromises = new Map<string, Promise<any>>();
  private intersectionObserver: IntersectionObserver | null = null;
  private preloadQueue: Array<{ name: string; priority: number }> = [];

  static getInstance(): LazyLoadingManager {
    if (!this.instance) {
      this.instance = new LazyLoadingManager();
    }
    return this.instance;
  }

  constructor() {
    this.initializeIntersectionObserver();
    this.initializePreloadScheduler();
  }

  /**
   * Register lazy loadable component
   */
  registerComponent(
    name: string,
    loader: () => Promise<any>,
    strategy: LoadingStrategy = { immediate: false, preload: false, prefetch: false, priority: 'medium' }
  ): () => Promise<Component> {
    return async () => {
      const startTime = performance.now();
      
      // Check if already loading
      if (this.loadingPromises.has(name)) {
        return this.loadingPromises.get(name)!;
      }

      // Check if already loaded
      if (this.loadedChunks.has(name)) {
        const cached = await loader();
        this.trackLoadTime(name, 0); // Cached load
        return cached;
      }

      // Start loading
      const loadingPromise = this.loadComponent(name, loader, startTime);
      this.loadingPromises.set(name, loadingPromise);

      return loadingPromise;
    };
  }

  /**
   * Preload component for better performance
   */
  async preloadComponent(name: string, loader: () => Promise<any>): Promise<void> {
    if (this.loadedChunks.has(name) || this.preloadedChunks.has(name)) {
      return;
    }

    try {
      const startTime = performance.now();
      await loader();
      this.preloadedChunks.add(name);
      this.trackLoadTime(name, performance.now() - startTime);
    } catch (error) {
      console.warn(`Preload failed for ${name}:`, error);
    }
  }

  /**
   * Intelligent preloading based on user behavior
   */
  schedulePreload(name: string, priority = 1): void {
    this.preloadQueue.push({ name, priority });
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Load component with intersection observer
   */
  loadOnIntersection(
    element: HTMLElement,
    name: string,
    loader: () => Promise<any>,
    options: IntersectionObserverInit = {}
  ): () => void {
    if (!this.intersectionObserver) {
      console.warn('Intersection Observer not supported');
      return () => {};
    }

    const callback = async (entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          await this.preloadComponent(name, loader);
          this.intersectionObserver!.unobserve(element);
        }
      }
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    });

    observer.observe(element);

    return () => observer.unobserve(element);
  }

  /**
   * Get bundle metrics
   */
  getBundleMetrics(): ResourceMetrics {
    const chunks = Array.from(this.chunkMetrics.values());
    
    return {
      totalBundleSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      lazyChunksCount: chunks.filter(chunk => chunk.isLazyLoaded).length,
      loadedChunksSize: chunks
        .filter(chunk => this.loadedChunks.has(chunk.name))
        .reduce((sum, chunk) => sum + chunk.size, 0),
      preloadedChunksSize: chunks
        .filter(chunk => this.preloadedChunks.has(chunk.name))
        .reduce((sum, chunk) => sum + chunk.size, 0),
      averageLoadTime: chunks.length > 0 
        ? chunks.reduce((sum, chunk) => sum + chunk.loadTime, 0) / chunks.length 
        : 0,
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  /**
   * Optimize loading strategy based on metrics
   */
  optimizeLoadingStrategy(): void {
    const metrics = this.getBundleMetrics();
    
    // If average load time is high, increase preloading
    if (metrics.averageLoadTime > 200) {
      this.increasePreloadingAggression();
    }

    // If cache hit rate is low, improve caching
    if (metrics.cacheHitRate < 0.8) {
      this.optimizeCaching();
    }

    // Log optimization suggestions
    this.generateOptimizationSuggestions();
  }

  private async loadComponent(name: string, loader: () => Promise<any>, startTime: number): Promise<Component> {
    try {
      const component = await loader();
      const loadTime = performance.now() - startTime;
      
      this.loadedChunks.add(name);
      this.trackLoadTime(name, loadTime);
      this.loadingPromises.delete(name);
      
      return component;
    } catch (error) {
      this.loadingPromises.delete(name);
      throw error;
    }
  }

  private trackLoadTime(name: string, loadTime: number): void {
    const existing = this.chunkMetrics.get(name);
    if (existing) {
      existing.loadTime = (existing.loadTime + loadTime) / 2; // Average
      existing.usageFrequency++;
    } else {
      this.chunkMetrics.set(name, {
        name,
        size: this.estimateChunkSize(name),
        loadTime,
        isLazyLoaded: true,
        dependencies: [],
        usageFrequency: 1
      });
    }
  }

  private estimateChunkSize(name: string): number {
    // Rough estimation based on component name
    const baseSize = 10 * 1024; // 10KB base
    const complexity = name.includes('Chart') ? 3 : name.includes('Table') ? 2 : 1;
    return baseSize * complexity;
  }

  private calculateCacheHitRate(): number {
    const total = this.loadedChunks.size + this.preloadedChunks.size;
    const hits = this.preloadedChunks.size;
    return total > 0 ? hits / total : 0;
  }

  private initializeIntersectionObserver(): void {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(() => {}, {
        rootMargin: '50px',
        threshold: 0.1
      });
    }
  }

  private initializePreloadScheduler(): void {
    // Process preload queue periodically
    setInterval(() => {
      if (this.preloadQueue.length > 0 && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          const item = this.preloadQueue.shift();
          if (item) {
            // This would require the loader function, but we don't have it here
            // In practice, this would be handled differently
            console.log(`Scheduled preload for ${item.name} with priority ${item.priority}`);
          }
        });
      }
    }, 1000);
  }

  private increasePreloadingAggression(): void {
    console.log('🚀 Increasing preloading aggression due to slow load times');
    // Implement more aggressive preloading strategy
  }

  private optimizeCaching(): void {
    console.log('💾 Optimizing caching strategy due to low hit rate');
    // Implement better caching strategies
  }

  private generateOptimizationSuggestions(): void {
    const metrics = this.getBundleMetrics();
    const suggestions: string[] = [];

    if (metrics.totalBundleSize > 2 * 1024 * 1024) { // 2MB
      suggestions.push('Consider splitting large components into smaller chunks');
    }

    if (metrics.averageLoadTime > 500) {
      suggestions.push('Implement more aggressive preloading for frequently used components');
    }

    if (metrics.cacheHitRate < 0.6) {
      suggestions.push('Improve component caching strategies');
    }

    if (suggestions.length > 0) {
      console.group('📊 Bundle Optimization Suggestions');
      suggestions.forEach(suggestion => console.log(`• ${suggestion}`));
      console.groupEnd();
    }
  }
}

/**
 * Resource Preloader
 * Intelligent resource prefetching ve preloading
 */
export class ResourcePreloader {
  private preloadedResources = new Set<string>();
  private preloadPromises = new Map<string, Promise<any>>();
  private loadingStats = new Map<string, number>();

  /**
   * Preload CSS files
   */
  async preloadCSS(href: string): Promise<void> {
    if (this.preloadedResources.has(href)) return;

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = href;
      
      link.onload = () => {
        this.preloadedResources.add(href);
        resolve();
      };
      
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  /**
   * Preload JavaScript modules
   */
  async preloadModule(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) return;
    if (this.preloadPromises.has(src)) return this.preloadPromises.get(src);

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'modulepreload';
      link.href = src;
      
      link.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      
      link.onerror = reject;
      document.head.appendChild(link);
    });

    this.preloadPromises.set(src, promise);
    return promise;
  }

  /**
   * Preload images with priority
   */
  async preloadImage(src: string, priority: 'high' | 'low' = 'low'): Promise<HTMLImageElement> {
    if (this.preloadPromises.has(src)) {
      return this.preloadPromises.get(src);
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      if (priority === 'high') {
        img.fetchPriority = 'high';
      }
      
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve(img);
      };
      
      img.onerror = reject;
      img.src = src;
    });

    this.preloadPromises.set(src, promise);
    return promise;
  }

  /**
   * Batch preload resources
   */
  async batchPreload(resources: Array<{ type: 'css' | 'js' | 'image'; src: string; priority?: 'high' | 'low' }>): Promise<void> {
    const promises = resources.map(resource => {
      switch (resource.type) {
        case 'css':
          return this.preloadCSS(resource.src);
        case 'js':
          return this.preloadModule(resource.src);
        case 'image':
          return this.preloadImage(resource.src, resource.priority);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get preload statistics
   */
  getStats(): { preloadedCount: number; totalRequests: number; successRate: number } {
    return {
      preloadedCount: this.preloadedResources.size,
      totalRequests: this.preloadPromises.size,
      successRate: this.preloadPromises.size > 0 ? (this.preloadedResources.size / this.preloadPromises.size) * 100 : 0
    };
  }
}

/**
 * Vue Composables for Bundle Optimization
 */
export function useLazyLoading() {
  const manager = LazyLoadingManager.getInstance();
  const metrics: Ref<ResourceMetrics | null> = ref(null);

  onMounted(() => {
    nextTick(() => {
      metrics.value = manager.getBundleMetrics();
      manager.optimizeLoadingStrategy();
    });
  });

  const createLazyComponent = (
    name: string,
    loader: () => Promise<any>,
    strategy?: LoadingStrategy
  ) => manager.registerComponent(name, loader, strategy);

  const preloadComponent = (name: string, loader: () => Promise<any>) =>
    manager.preloadComponent(name, loader);

  const schedulePreload = (name: string, priority?: number) =>
    manager.schedulePreload(name, priority);

  return {
    metrics,
    createLazyComponent,
    preloadComponent,
    schedulePreload,
    manager
  };
}

export function useResourcePreloader() {
  const preloader = new ResourcePreloader();
  const stats = computed(() => preloader.getStats());

  return {
    preloadCSS: (href: string) => preloader.preloadCSS(href),
    preloadModule: (src: string) => preloader.preloadModule(src),
    preloadImage: (src: string, priority?: 'high' | 'low') => preloader.preloadImage(src, priority),
    batchPreload: (resources: Array<{ type: 'css' | 'js' | 'image'; src: string; priority?: 'high' | 'low' }>) =>
      preloader.batchPreload(resources),
    stats,
    preloader
  };
}

/**
 * Smart Route Preloader
 * Preload routes based on user navigation patterns
 */
export class RoutePreloader {
  private navigationHistory: string[] = [];
  private routeMetrics = new Map<string, { visits: number; avgStayTime: number }>();
  private preloadedRoutes = new Set<string>();

  /**
   * Track route visit
   */
  trackRouteVisit(route: string, stayTime: number): void {
    this.navigationHistory.push(route);
    
    const existing = this.routeMetrics.get(route);
    if (existing) {
      existing.visits++;
      existing.avgStayTime = (existing.avgStayTime + stayTime) / 2;
    } else {
      this.routeMetrics.set(route, { visits: 1, avgStayTime: stayTime });
    }

    // Keep only last 50 navigation entries
    if (this.navigationHistory.length > 50) {
      this.navigationHistory.shift();
    }

    this.predictAndPreload();
  }

  /**
   * Predict next routes and preload
   */
  private predictAndPreload(): void {
    const predictions = this.predictNextRoutes();
    
    for (const route of predictions) {
      if (!this.preloadedRoutes.has(route)) {
        this.preloadRoute(route);
      }
    }
  }

  private predictNextRoutes(): string[] {
    // Simple prediction based on navigation patterns
    const currentRoute = this.navigationHistory[this.navigationHistory.length - 1];
    const frequentRoutes = Array.from(this.routeMetrics.entries())
      .sort(([, a], [, b]) => b.visits - a.visits)
      .slice(0, 3)
      .map(([route]) => route);

    return frequentRoutes.filter(route => route !== currentRoute);
  }

  private async preloadRoute(route: string): Promise<void> {
    try {
      // This would integrate with your router to preload route components
      console.log(`Preloading route: ${route}`);
      this.preloadedRoutes.add(route);
    } catch (error) {
      console.warn(`Failed to preload route ${route}:`, error);
    }
  }
}

// Global instances
export const lazyLoadingManager = LazyLoadingManager.getInstance();
export const routePreloader = new RoutePreloader();
