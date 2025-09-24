---
applyTo: "**/monitoring/**,**/analytics/**,**/performance/**"
description: "Performans monitoring ve analytics için standartlar"
---

# Performans Monitoring ve Analytics

Bu dosya, PeakActivity projesinin performans monitoring ve analytics standartlarını tanımlar.

## Real-time Performance Monitoring

### Client-Side Performance Tracking
```typescript
// src/services/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceEntry[]> = new Map();
  private observer: PerformanceObserver | null = null;
  
  constructor() {
    this.initializeObserver();
    this.trackVitals();
  }
  
  private initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry);
          
          // Critical performance issues için immediate alert
          if (this.isCriticalIssue(entry)) {
            this.sendImmediateAlert(entry);
          }
        }
      });
      
      // Observe different types of performance entries
      this.observer.observe({ 
        entryTypes: ['navigation', 'resource', 'paint', 'layout-shift', 'largest-contentful-paint'] 
      });
    }
  }
  
  private trackVitals() {
    // Core Web Vitals tracking
    this.trackLCP(); // Largest Contentful Paint
    this.trackFID(); // First Input Delay
    this.trackCLS(); // Cumulative Layout Shift
    this.trackTTFB(); // Time to First Byte
  }
  
  private trackLCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      const lcpValue = lastEntry.startTime;
      this.recordVital('LCP', lcpValue);
      
      // LCP threshold: Good < 2500ms, Needs Improvement < 4000ms
      if (lcpValue > 4000) {
        this.logPerformanceIssue('LCP', lcpValue, 'poor');
      } else if (lcpValue > 2500) {
        this.logPerformanceIssue('LCP', lcpValue, 'needs-improvement');
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  }
  
  private trackFID() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach(entry => {
        const fidValue = entry.processingStart - entry.startTime;
        this.recordVital('FID', fidValue);
        
        // FID threshold: Good < 100ms, Needs Improvement < 300ms
        if (fidValue > 300) {
          this.logPerformanceIssue('FID', fidValue, 'poor');
        } else if (fidValue > 100) {
          this.logPerformanceIssue('FID', fidValue, 'needs-improvement');
        }
      });
    }).observe({ type: 'first-input', buffered: true });
  }
  
  private trackCLS() {
    let clsValue = 0;
    
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      this.recordVital('CLS', clsValue);
      
      // CLS threshold: Good < 0.1, Needs Improvement < 0.25
      if (clsValue > 0.25) {
        this.logPerformanceIssue('CLS', clsValue, 'poor');
      } else if (clsValue > 0.1) {
        this.logPerformanceIssue('CLS', clsValue, 'needs-improvement');
      }
    }).observe({ type: 'layout-shift', buffered: true });
  }
  
  /**
   * Custom performance markers
   */
  markFeatureStart(featureName: string) {
    performance.mark(`${featureName}-start`);
  }
  
  markFeatureEnd(featureName: string) {
    performance.mark(`${featureName}-end`);
    performance.measure(featureName, `${featureName}-start`, `${featureName}-end`);
    
    const measure = performance.getEntriesByName(featureName, 'measure')[0];
    this.recordCustomMetric(featureName, measure.duration);
  }
  
  /**
   * Memory usage tracking
   */
  trackMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryMetrics = {
        usedJSHeapSize: memInfo.usedJSHeapSize,
        totalJSHeapSize: memInfo.totalJSHeapSize,
        jsHeapSizeLimit: memInfo.jsHeapSizeLimit,
        percentage: (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize) * 100
      };
      
      this.recordMemoryMetrics(memoryMetrics);
      
      // Memory warning thresholds
      if (memoryMetrics.percentage > 80) {
        this.logMemoryWarning(memoryMetrics);
      }
    }
  }
  
  private recordVital(name: string, value: number) {
    const vital = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // Send to analytics
    this.sendToAnalytics('vital', vital);
  }
  
  private recordCustomMetric(name: string, duration: number) {
    const metric = {
      name,
      duration,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    this.sendToAnalytics('custom-metric', metric);
  }
  
  private recordMemoryMetrics(metrics: any) {
    this.sendToAnalytics('memory', {
      ...metrics,
      timestamp: Date.now(),
      url: window.location.href
    });
  }
  
  private isCriticalIssue(entry: PerformanceEntry): boolean {
    // Define critical performance thresholds
    if (entry.name.includes('script') && entry.duration > 1000) return true;
    if (entry.name.includes('stylesheet') && entry.duration > 500) return true;
    return false;
  }
  
  private sendImmediateAlert(entry: PerformanceEntry) {
    console.warn('Critical performance issue detected:', entry);
    
    // Send to monitoring service
    this.sendToAnalytics('critical-issue', {
      entryType: entry.entryType,
      name: entry.name,
      duration: entry.duration,
      timestamp: Date.now()
    });
  }
  
  private sendToAnalytics(type: string, data: any) {
    // Send to Firebase Analytics or custom analytics service
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_type: type,
        metric_data: JSON.stringify(data)
      });
    }
    
    // Also queue for batch sending to reduce network overhead
    this.queueForBatchSend(type, data);
  }
  
  private queueForBatchSend(type: string, data: any) {
    // Implementation for batching analytics data
    // Send in batches every 30 seconds to reduce overhead
  }
}
```

### Server-Side Performance Monitoring
```typescript
// functions/src/monitoring/server-performance.ts
import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: number;
  userId?: string;
}

export class ServerPerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static readonly BATCH_SIZE = 100;
  
  /**
   * Express middleware for request timing
   */
  static requestTimer() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();
      
      // Override res.end to capture completion
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        const endMemory = process.memoryUsage();
        
        const metrics: PerformanceMetrics = {
          endpoint: req.route?.path || req.path,
          method: req.method,
          duration,
          statusCode: res.statusCode,
          memoryUsage: {
            rss: endMemory.rss - startMemory.rss,
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            heapTotal: endMemory.heapTotal - startMemory.heapTotal,
            external: endMemory.external - startMemory.external,
            arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
          },
          timestamp: Date.now(),
          userId: (req as any).user?.uid
        };
        
        ServerPerformanceMonitor.recordMetrics(metrics);
        
        // Log slow requests
        if (duration > 2000) {
          console.warn(`Slow request detected: ${req.method} ${req.path} - ${duration}ms`);
        }
        
        originalEnd.apply(this, args);
      };
      
      next();
    };
  }
  
  /**
   * Database operation timing
   */
  static async timeDbOperation<T>(
    operation: string,
    dbCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await dbCall();
      const duration = performance.now() - startTime;
      
      this.recordDbMetrics({
        operation,
        duration,
        success: true,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordDbMetrics({
        operation,
        duration,
        success: false,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }
  
  /**
   * Function cold start detection
   */
  static detectColdStart() {
    const startTime = Date.now();
    
    // Function initialization logic here
    
    return () => {
      const initDuration = Date.now() - startTime;
      
      // Cold start genellikle > 1000ms
      if (initDuration > 1000) {
        this.recordColdStart(initDuration);
      }
    };
  }
  
  private static recordMetrics(metrics: PerformanceMetrics) {
    this.metrics.push(metrics);
    
    // Batch gönderimi için kontrol
    if (this.metrics.length >= this.BATCH_SIZE) {
      this.flushMetrics();
    }
    
    // Threshold checks
    this.checkThresholds(metrics);
  }
  
  private static recordDbMetrics(metrics: any) {
    // Database operation metrics
    console.log('DB Operation:', metrics);
    
    // Slow query detection
    if (metrics.duration > 1000) {
      console.warn(`Slow database operation: ${metrics.operation} - ${metrics.duration}ms`);
    }
  }
  
  private static recordColdStart(duration: number) {
    console.log(`Cold start detected: ${duration}ms`);
    
    // Send to monitoring service
    // Implementation for cold start tracking
  }
  
  private static checkThresholds(metrics: PerformanceMetrics) {
    // Response time thresholds
    if (metrics.duration > 5000) {
      this.sendAlert('high_latency', metrics);
    }
    
    // Memory usage thresholds
    if (metrics.memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
      this.sendAlert('high_memory', metrics);
    }
    
    // Error rate monitoring
    if (metrics.statusCode >= 500) {
      this.sendAlert('server_error', metrics);
    }
  }
  
  private static async flushMetrics() {
    const metricsToSend = [...this.metrics];
    this.metrics = [];
    
    try {
      // Send to monitoring service (Stackdriver, DataDog, etc.)
      await this.sendToMonitoringService(metricsToSend);
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Re-queue metrics for retry
      this.metrics.unshift(...metricsToSend);
    }
  }
  
  private static async sendToMonitoringService(metrics: PerformanceMetrics[]) {
    // Implementation for sending to external monitoring service
    console.log(`Sending ${metrics.length} metrics to monitoring service`);
  }
  
  private static sendAlert(type: string, metrics: PerformanceMetrics) {
    console.warn(`Performance alert: ${type}`, metrics);
    
    // Send to alerting system (Slack, PagerDuty, etc.)
  }
}
```

## User Analytics ve Insights

### User Behavior Analytics
```typescript
// functions/src/analytics/user-analytics.ts
import { getFirestore } from 'firebase-admin/firestore';

export class UserAnalytics {
  private db = getFirestore();
  
  /**
   * Kullanıcı aktivite patterns analizi
   */
  async analyzeUserPatterns(userId: string, timeRange: {start: Date, end: Date}) {
    const events = await this.getUserEvents(userId, timeRange);
    
    const patterns = {
      activeHours: this.calculateActiveHours(events),
      appUsage: this.calculateAppUsage(events),
      focusPatterns: this.calculateFocusPatterns(events),
      productivityScore: this.calculateProductivityScore(events),
      trends: this.calculateTrends(events)
    };
    
    // Store insights
    await this.storeUserInsights(userId, patterns);
    
    return patterns;
  }
  
  private calculateActiveHours(events: any[]): number[] {
    const hourlyActivity = new Array(24).fill(0);
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyActivity[hour] += event.duration || 0;
    });
    
    return hourlyActivity;
  }
  
  private calculateAppUsage(events: any[]): Record<string, number> {
    const appUsage: Record<string, number> = {};
    
    events.forEach(event => {
      const app = event.data?.app || 'unknown';
      appUsage[app] = (appUsage[app] || 0) + (event.duration || 0);
    });
    
    return appUsage;
  }
  
  private calculateFocusPatterns(events: any[]): any {
    let focusSessions = [];
    let currentSession: any = null;
    
    events.forEach(event => {
      const app = event.data?.app;
      
      if (this.isProductiveApp(app)) {
        if (!currentSession || currentSession.app !== app) {
          if (currentSession) {
            focusSessions.push(currentSession);
          }
          currentSession = {
            app,
            startTime: event.timestamp,
            duration: event.duration || 0
          };
        } else {
          currentSession.duration += event.duration || 0;
        }
      } else {
        if (currentSession) {
          focusSessions.push(currentSession);
          currentSession = null;
        }
      }
    });
    
    return {
      sessions: focusSessions,
      averageSessionLength: focusSessions.reduce((sum, s) => sum + s.duration, 0) / focusSessions.length,
      totalFocusTime: focusSessions.reduce((sum, s) => sum + s.duration, 0),
      longestSession: Math.max(...focusSessions.map(s => s.duration))
    };
  }
  
  private calculateProductivityScore(events: any[]): number {
    const totalTime = events.reduce((sum, e) => sum + (e.duration || 0), 0);
    const productiveTime = events
      .filter(e => this.isProductiveApp(e.data?.app))
      .reduce((sum, e) => sum + (e.duration || 0), 0);
    
    return totalTime > 0 ? (productiveTime / totalTime) * 100 : 0;
  }
  
  private calculateTrends(events: any[]): any {
    // Daily trends analysis
    const dailyData: Record<string, any> = {};
    
    events.forEach(event => {
      const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          totalTime: 0,
          productiveTime: 0,
          appSwitches: 0,
          apps: new Set()
        };
      }
      
      const day = dailyData[dateKey];
      day.totalTime += event.duration || 0;
      day.apps.add(event.data?.app);
      
      if (this.isProductiveApp(event.data?.app)) {
        day.productiveTime += event.duration || 0;
      }
    });
    
    return {
      dailyAverages: this.calculateDailyAverages(dailyData),
      weeklyTrends: this.calculateWeeklyTrends(dailyData),
      improvement: this.calculateImprovement(dailyData)
    };
  }
  
  private isProductiveApp(app: string): boolean {
    const productiveApps = [
      'code', 'sublime', 'vim', 'emacs', // Development
      'photoshop', 'illustrator', 'figma', // Design
      'word', 'excel', 'powerpoint', 'docs', // Office
      'terminal', 'command'
    ];
    
    return productiveApps.some(productive => 
      app?.toLowerCase().includes(productive)
    );
  }
  
  /**
   * Aggregate analytics for admin dashboard
   */
  async generateAggregateAnalytics(timeRange: {start: Date, end: Date}) {
    const analytics = {
      totalUsers: await this.getTotalUsers(),
      activeUsers: await this.getActiveUsers(timeRange),
      avgSessionLength: await this.getAverageSessionLength(timeRange),
      topApps: await this.getTopApplications(timeRange),
      productivityTrends: await this.getProductivityTrends(timeRange),
      retentionMetrics: await this.getRetentionMetrics(timeRange)
    };
    
    return analytics;
  }
  
  private async getTotalUsers(): Promise<number> {
    const snapshot = await this.db.collection('users').get();
    return snapshot.size;
  }
  
  private async getActiveUsers(timeRange: {start: Date, end: Date}): Promise<number> {
    const snapshot = await this.db.collection('users')
      .where('lastActivity', '>=', timeRange.start)
      .where('lastActivity', '<=', timeRange.end)
      .get();
    
    return snapshot.size;
  }
  
  /**
   * Privacy-compliant analytics
   */
  async generateAnonymizedInsights(timeRange: {start: Date, end: Date}) {
    // Aggregate veriler - individual user data yok
    const insights = {
      globalPatterns: await this.getGlobalUsagePatterns(timeRange),
      industryBenchmarks: await this.getIndustryBenchmarks(),
      productivityInsights: await this.getProductivityInsights(timeRange)
    };
    
    return insights;
  }
  
  private async storeUserInsights(userId: string, insights: any) {
    await this.db.collection('users').doc(userId).collection('insights').add({
      ...insights,
      generatedAt: new Date(),
      type: 'weekly_analysis'
    });
  }
}
```

## Real-time Dashboard Monitoring

### Live Metrics Dashboard
```typescript
// functions/src/monitoring/dashboard.ts
export class DashboardMetrics {
  private static readonly METRIC_TYPES = {
    SYSTEM_HEALTH: 'system_health',
    USER_ACTIVITY: 'user_activity', 
    ERROR_RATES: 'error_rates',
    PERFORMANCE: 'performance'
  };
  
  /**
   * Real-time metrics için WebSocket bağlantısı
   */
  static setupRealtimeMetrics() {
    // WebSocket veya Server-Sent Events implementation
    return {
      onConnect: this.handleConnection.bind(this),
      onMetricUpdate: this.broadcastMetric.bind(this)
    };
  }
  
  private static handleConnection(socket: any) {
    // Send initial dashboard state
    socket.emit('dashboard-state', {
      systemHealth: this.getCurrentSystemHealth(),
      activeUsers: this.getCurrentActiveUsers(),
      errorRates: this.getCurrentErrorRates(),
      performance: this.getCurrentPerformance()
    });
  }
  
  private static broadcastMetric(metricType: string, data: any) {
    // Broadcast to all connected dashboards
    // Implementation depends on WebSocket library
  }
  
  /**
   * System health summary
   */
  static getCurrentSystemHealth() {
    return {
      firebase: {
        functions: { status: 'healthy', latency: 120 },
        firestore: { status: 'healthy', latency: 45 },
        storage: { status: 'healthy', latency: 80 }
      },
      activitywatch: {
        server: { status: 'healthy', uptime: '99.8%' },
        watchers: { active: 245, total: 300 }
      },
      ai: {
        edge: { status: 'healthy', models_loaded: 3 },
        cloud: { status: 'healthy', rate_limit: '20%' }
      }
    };
  }
  
  /**
   * User activity metrics
   */
  static getCurrentActiveUsers() {
    return {
      online: 156,
      last_hour: 342,
      last_24h: 1205,
      growth_rate: '+12%'
    };
  }
  
  /**
   * Error rate monitoring
   */
  static getCurrentErrorRates() {
    return {
      functions: { rate: 0.02, trend: 'down' },
      client: { rate: 0.05, trend: 'stable' },
      api: { rate: 0.01, trend: 'down' }
    };
  }
  
  /**
   * Performance metrics
   */
  static getCurrentPerformance() {
    return {
      response_times: {
        p50: 145,
        p95: 480,
        p99: 1200
      },
      throughput: {
        rps: 45,
        peak_rps: 120
      },
      resource_usage: {
        memory: '68%',
        cpu: '23%',
        disk: '45%'
      }
    };
  }
}
```

Bu monitoring sistemi ile uygulamanızın performansını real-time olarak takip edebilir, sorunları proaktif olarak tespit edebilir ve kullanıcı deneyimini sürekli iyileştirebilirsiniz.
