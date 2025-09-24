---
applyTo: "**/database/**,**/queries/**,**/models/**,firestore.indexes.json"
description: "Veritabanı optimizasyonu ve query performance standartları"
---

# Database Optimization ve Query Performance

Bu dosya, PeakActivity projesinin veritabanı optimizasyonu ve query performance standartlarını tanımlar.

## Firestore Query Optimization

### Index Strategy
```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "timestamp", "order": "DESCENDING"},
        {"fieldPath": "bucket_id", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "events", 
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "date_key", "order": "ASCENDING"},
        {"fieldPath": "data.app", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "insights",
      "queryScope": "COLLECTION", 
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "type", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "buckets",
      "queryScope": "COLLECTION",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "type", "order": "ASCENDING"},
        {"fieldPath": "last_updated", "order": "DESCENDING"}
      ]
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "events",
      "fieldPath": "data.window_title",
      "indexes": [
        {"queryScope": "COLLECTION", "fields": [{"fieldPath": "data.window_title", "order": "ASCENDING"}]}
      ]
    }
  ]
}
```

### Efficient Query Patterns
```typescript
// functions/src/database/query-optimizer.ts
export class QueryOptimizer {
  private db = getFirestore();
  
  /**
   * Optimized user activity query with pagination
   */
  async getUserActivityOptimized(
    userId: string, 
    timeRange: {start: Date, end: Date},
    pageSize: number = 100,
    lastDoc?: DocumentSnapshot
  ) {
    let query = this.db
      .collection('users')
      .doc(userId)
      .collection('events')
      .where('timestamp', '>=', timeRange.start)
      .where('timestamp', '<=', timeRange.end)
      .orderBy('timestamp', 'desc')
      .limit(pageSize);
    
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    const snapshot = await query.get();
    
    return {
      events: snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === pageSize
    };
  }
  
  /**
   * Aggregated data query - date-based partitioning kullan
   */
  async getDailyAggregates(
    userId: string,
    dateKey: string
  ) {
    // Pre-computed daily aggregates collection
    const aggregateDoc = await this.db
      .collection('users')
      .doc(userId)
      .collection('dailyAggregates')
      .doc(dateKey)
      .get();
    
    if (aggregateDoc.exists) {
      return aggregateDoc.data();
    }
    
    // Fallback: compute from events (expensive)
    return this.computeDailyAggregate(userId, dateKey);
  }
  
  /**
   * App usage query with proper indexing
   */
  async getAppUsageStats(
    userId: string, 
    timeRange: {start: Date, end: Date},
    apps?: string[]
  ) {
    const dateKeys = this.generateDateKeys(timeRange.start, timeRange.end);
    
    const promises = dateKeys.map(async (dateKey) => {
      let query = this.db
        .collection('users')
        .doc(userId)
        .collection('events')
        .where('date_key', '==', dateKey);
      
      if (apps && apps.length > 0) {
        // Use 'in' query for specific apps (max 10 items)
        if (apps.length <= 10) {
          query = query.where('data.app', 'in', apps);
        }
      }
      
      return query.get();
    });
    
    const snapshots = await Promise.all(promises);
    return this.aggregateAppUsage(snapshots);
  }
  
  /**
   * Batch write optimization for events
   */
  async batchInsertEvents(userId: string, events: any[]) {
    const BATCH_SIZE = 500; // Firestore limit
    const batches = [];
    
    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = this.db.batch();
      const batchEvents = events.slice(i, i + BATCH_SIZE);
      
      batchEvents.forEach(event => {
        const eventRef = this.db
          .collection('users')
          .doc(userId)
          .collection('events')
          .doc();
        
        // Add optimized fields for querying
        const optimizedEvent = {
          ...event,
          date_key: this.formatDateKey(event.timestamp),
          hour_key: this.formatHourKey(event.timestamp),
          app_category: this.categorizeApp(event.data?.app),
          userId // Denormalized for collection group queries
        };
        
        batch.set(eventRef, optimizedEvent);
      });
      
      batches.push(batch);
    }
    
    // Execute batches sequentially to avoid rate limits
    for (const batch of batches) {
      await batch.commit();
    }
    
    return events.length;
  }
  
  private generateDateKeys(start: Date, end: Date): string[] {
    const keys = [];
    const current = new Date(start);
    
    while (current <= end) {
      keys.push(this.formatDateKey(current));
      current.setDate(current.getDate() + 1);
    }
    
    return keys;
  }
  
  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  
  private formatHourKey(date: Date): string {
    return date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  }
  
  private categorizeApp(appName?: string): string {
    if (!appName) return 'unknown';
    
    const categories: Record<string, string> = {
      browser: ['chrome', 'firefox', 'safari', 'edge'],
      development: ['code', 'sublime', 'vim', 'terminal'],
      design: ['photoshop', 'illustrator', 'figma', 'sketch'],
      communication: ['slack', 'discord', 'zoom', 'teams'],
      office: ['word', 'excel', 'powerpoint', 'docs']
    };
    
    const lowerApp = appName.toLowerCase();
    
    for (const [category, apps] of Object.entries(categories)) {
      if (apps.some(app => lowerApp.includes(app))) {
        return category;
      }
    }
    
    return 'other';
  }
}
```

## Data Modeling Best Practices

### Event Data Structure
```typescript
// src/models/activity-event.ts
interface OptimizedActivityEvent {
  id?: string;
  
  // Core fields
  timestamp: Timestamp;
  duration: number;
  
  // Query optimization fields
  userId: string; // Denormalized for collection group queries
  date_key: string; // Format: YYYY-MM-DD
  hour_key: string; // Format: YYYY-MM-DDTHH
  
  // Categorization for efficient filtering
  bucket_id: string;
  bucket_type: string;
  app_category: string; // browser, development, design, etc.
  
  // Original data
  data: {
    app?: string;
    title?: string;
    url?: string;
    file?: string;
    [key: string]: any;
  };
  
  // Metadata
  created_at: Timestamp;
  version: string; // Data schema version
}

interface DailyAggregate {
  userId: string;
  date_key: string;
  
  // Time metrics
  total_duration: number;
  active_duration: number;
  idle_duration: number;
  
  // App usage
  app_usage: Record<string, number>; // app -> duration
  app_categories: Record<string, number>; // category -> duration
  
  // Productivity metrics
  productive_time: number;
  focus_score: number;
  app_switches: number;
  
  // Computed at aggregation time
  computed_at: Timestamp;
  events_count: number;
}
```

### Hierarchical Data Organization
```typescript
// Database structure optimization
const DATABASE_STRUCTURE = {
  // User-level data
  '/users/{userId}': {
    profile: 'User profile data',
    preferences: 'User settings and preferences',
    
    // Time-series data with date partitioning
    'dailyAggregates/{date}': 'Pre-computed daily statistics',
    'weeklyAggregates/{week}': 'Pre-computed weekly statistics',
    'monthlyAggregates/{month}': 'Pre-computed monthly statistics',
    
    // Raw events - partitioned by date for efficiency
    'events/{eventId}': 'Individual activity events',
    
    // AI-generated insights
    'insights/{insightId}': 'AI analysis results',
    
    // User automation rules
    'automationRules/{ruleId}': 'User-defined automation rules'
  },
  
  // Global collections for admin queries
  '/globalStats': {
    'daily/{date}': 'Anonymized daily platform statistics',
    'weekly/{week}': 'Anonymized weekly platform statistics'
  }
};
```

## Caching Strategies

### Multi-Layer Caching
```typescript
// functions/src/database/cache-manager.ts
export class CacheManager {
  private memoryCache = new Map<string, {data: any, expiry: number}>();
  private static readonly CACHE_TTL = {
    USER_PROFILE: 5 * 60 * 1000, // 5 minutes
    DAILY_AGGREGATE: 60 * 60 * 1000, // 1 hour
    APP_USAGE: 30 * 60 * 1000, // 30 minutes
    INSIGHTS: 2 * 60 * 60 * 1000 // 2 hours
  };
  
  /**
   * Get with cache fallback
   */
  async getWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> {
    // Check memory cache first
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    
    // Check Redis cache (if available)
    const redisData = await this.getFromRedis(key);
    if (redisData) {
      this.memoryCache.set(key, {
        data: redisData,
        expiry: Date.now() + ttl
      });
      return redisData;
    }
    
    // Fetch from database
    const freshData = await fetcher();
    
    // Store in both caches
    this.memoryCache.set(key, {
      data: freshData,
      expiry: Date.now() + ttl
    });
    await this.setInRedis(key, freshData, ttl);
    
    return freshData;
  }
  
  /**
   * Cache user daily aggregates
   */
  async getCachedDailyAggregate(userId: string, dateKey: string) {
    const cacheKey = `daily_agg:${userId}:${dateKey}`;
    
    return this.getWithCache(
      cacheKey,
      () => this.fetchDailyAggregate(userId, dateKey),
      this.CACHE_TTL.DAILY_AGGREGATE
    );
  }
  
  /**
   * Cache app usage statistics
   */
  async getCachedAppUsage(userId: string, timeRange: any) {
    const cacheKey = `app_usage:${userId}:${timeRange.start.getTime()}-${timeRange.end.getTime()}`;
    
    return this.getWithCache(
      cacheKey,
      () => this.fetchAppUsage(userId, timeRange),
      this.CACHE_TTL.APP_USAGE
    );
  }
  
  /**
   * Invalidate cache when data changes
   */
  async invalidateUserCache(userId: string, patterns: string[] = []) {
    const keysToDelete = [];
    
    // Default patterns to invalidate
    const defaultPatterns = [
      `daily_agg:${userId}:*`,
      `app_usage:${userId}:*`,
      `insights:${userId}:*`
    ];
    
    const allPatterns = [...defaultPatterns, ...patterns];
    
    // Remove from memory cache
    for (const [key] of this.memoryCache) {
      if (allPatterns.some(pattern => this.matchesPattern(key, pattern))) {
        this.memoryCache.delete(key);
        keysToDelete.push(key);
      }
    }
    
    // Remove from Redis cache
    await this.deleteFromRedis(keysToDelete);
  }
  
  private matchesPattern(key: string, pattern: string): boolean {
    // Simple wildcard matching
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }
  
  private async getFromRedis(key: string): Promise<any> {
    // Redis implementation - if available
    return null;
  }
  
  private async setInRedis(key: string, data: any, ttl: number): Promise<void> {
    // Redis implementation - if available
  }
  
  private async deleteFromRedis(keys: string[]): Promise<void> {
    // Redis implementation - if available
  }
}
```

## Query Performance Monitoring

### Query Analytics
```typescript
// functions/src/database/query-analytics.ts
export class QueryAnalytics {
  private static queryMetrics = new Map<string, {
    count: number;
    totalDuration: number;
    avgDuration: number;
    maxDuration: number;
    lastExecuted: Date;
  }>();
  
  /**
   * Query execution wrapper with metrics
   */
  static async executeWithMetrics<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await queryFn();
      const duration = Date.now() - startTime;
      
      this.recordQueryMetrics(queryName, duration, true);
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordQueryMetrics(queryName, duration, false);
      
      console.error(`Query failed: ${queryName}`, error);
      throw error;
    }
  }
  
  private static recordQueryMetrics(
    queryName: string, 
    duration: number, 
    success: boolean
  ) {
    const existing = this.queryMetrics.get(queryName) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      maxDuration: 0,
      lastExecuted: new Date()
    };
    
    existing.count++;
    existing.totalDuration += duration;
    existing.avgDuration = existing.totalDuration / existing.count;
    existing.maxDuration = Math.max(existing.maxDuration, duration);
    existing.lastExecuted = new Date();
    
    this.queryMetrics.set(queryName, existing);
    
    // Send metrics to monitoring service
    this.sendQueryMetrics(queryName, {
      duration,
      success,
      avgDuration: existing.avgDuration
    });
  }
  
  /**
   * Get query performance summary
   */
  static getQueryPerformanceSummary() {
    const summary = Array.from(this.queryMetrics.entries()).map(([name, metrics]) => ({
      queryName: name,
      ...metrics,
      performance: this.categorizePerformance(metrics.avgDuration)
    }));
    
    return summary.sort((a, b) => b.avgDuration - a.avgDuration);
  }
  
  private static categorizePerformance(avgDuration: number): string {
    if (avgDuration < 100) return 'excellent';
    if (avgDuration < 500) return 'good';
    if (avgDuration < 1000) return 'acceptable';
    return 'poor';
  }
  
  private static sendQueryMetrics(queryName: string, metrics: any) {
    // Send to monitoring service for analysis
    console.log(`Query metrics: ${queryName}`, metrics);
  }
}

// Usage example
export const optimizedUserService = {
  async getUserActivity(userId: string, timeRange: any) {
    return QueryAnalytics.executeWithMetrics(
      'getUserActivity',
      () => new QueryOptimizer().getUserActivityOptimized(userId, timeRange)
    );
  }
};
```

## Data Retention ve Cleanup

### Automated Data Cleanup
```typescript
// functions/src/database/data-retention.ts
export class DataRetentionManager {
  
  /**
   * Scheduled cleanup function
   */
  static async runCleanup() {
    console.log('Starting data retention cleanup...');
    
    const tasks = [
      this.cleanupOldEvents(),
      this.cleanupTemporaryData(),
      this.compactAggregates(),
      this.archiveOldInsights()
    ];
    
    const results = await Promise.allSettled(tasks);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Cleanup task ${index} failed:`, result.reason);
      }
    });
    
    console.log('Data retention cleanup completed');
  }
  
  private static async cleanupOldEvents() {
    const db = getFirestore();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days retention
    
    // Process users in batches
    const users = await db.collection('users').get();
    
    for (const userDoc of users.docs) {
      const userPrefs = userDoc.data().preferences;
      const retentionDays = userPrefs?.dataRetentionDays || 90;
      
      const userCutoffDate = new Date();
      userCutoffDate.setDate(userCutoffDate.getDate() - retentionDays);
      
      await this.deleteOldEventsForUser(userDoc.id, userCutoffDate);
    }
  }
  
  private static async deleteOldEventsForUser(userId: string, cutoffDate: Date) {
    const db = getFirestore();
    const batch = db.batch();
    
    const oldEvents = await db
      .collection('users')
      .doc(userId)
      .collection('events')
      .where('timestamp', '<', cutoffDate)
      .limit(500) // Process in chunks
      .get();
    
    if (oldEvents.empty) return;
    
    oldEvents.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    console.log(`Deleted ${oldEvents.size} old events for user ${userId}`);
    
    // Continue if there might be more
    if (oldEvents.size === 500) {
      await this.deleteOldEventsForUser(userId, cutoffDate);
    }
  }
}
```

Bu database optimization patterns ile Firestore query performance'ınızı önemli ölçüde artırabilir ve maliyetleri kontrol altında tutabilirsiniz.
