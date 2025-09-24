# Firebase Veri Modelleme ve Query Optimizasyonu

**Oluşturulma Tarihi:** 2025-01-21 04:19:09  
**Güncelleme:** ActivityWatch Core Yapısına Uyumlu Tasarım  

## 1. ActivityWatch Veri Model Analizi

### 1.1 Core Event Yapısı
ActivityWatch'ta event modeli:
```python
# aw-core/aw_core/models.py
class Event(dict):
    def __init__(
        self,
        id: Optional[Id] = None,
        timestamp: Optional[ConvertibleTimestamp] = None,
        duration: Duration = 0,
        data: Optional[Data] = None,
    ) -> None:
```

### 1.2 Datastore Interface
```python
# aw-core/aw_datastore/datastore.py
class Datastore:
    def create_bucket(self, bucket_id, type, client, hostname, created, name=None, data=None)
    def [bucket_id]  # Bucket access
    
class Bucket:
    def get(self, limit=-1, starttime=None, endtime=None) -> List[Event]
    def insert(self, events: Union[Event, List[Event]]) -> Optional[Event]
    def get_by_id(self, event_id) -> Optional[Event]
```

## 2. Firebase Veri Modeli

### 2.1 Firestore Collection Hierarchy
```
/metadata
  /info -> { version, migration_status, last_update }

/devices/{device_id}
  - hostname: string
  - device_id: string  
  - created_at: timestamp
  - last_seen: timestamp
  - bucket_count: number

/buckets/{bucket_id}
  - id: string
  - type: string              # "afk.status", "window.title", etc.
  - client: string            # "aw-watcher-afk", "aw-watcher-window"
  - hostname: string
  - device_id: string         # For device association
  - created: timestamp
  - name?: string
  - data?: map
  - event_count: number       # Denormalized for quick access
  - last_event_time?: timestamp

/buckets/{bucket_id}/events/{event_id}
  - id: string               # Auto-generated or from original
  - timestamp: timestamp     # Firestore timestamp
  - duration: number         # Seconds as number
  - data: map               # Original event data
  
  # Firebase-specific optimization fields
  - bucket_id: string       # Reference to parent bucket
  - device_id: string       # For cross-bucket queries
  - type: string           # Bucket type for filtering
  - date_key: string       # "2025-01-21" for daily aggregations
  - hour_key: string       # "2025-01-21-14" for hourly aggregations
  - created_at: timestamp  # When record was created in Firebase
  - updated_at?: timestamp # When record was last updated

/buckets/{bucket_id}/daily_stats/{date}
  - date: string           # "2025-01-21"
  - event_count: number
  - total_duration: number
  - first_event: timestamp
  - last_event: timestamp
  - data_summary: map      # Key statistics for the day

/query_cache/{cache_key}
  - query_hash: string
  - result: any
  - created_at: timestamp
  - expires_at: timestamp
  - hit_count: number
```

### 2.2 Event Document Conversion

#### ActivityWatch → Firebase
```typescript
function convertAWEventToFirebase(
  event: AWEvent, 
  bucketId: string, 
  bucketType: string,
  deviceId: string
): FirebaseEvent {
  const timestamp = admin.firestore.Timestamp.fromDate(new Date(event.timestamp));
  const dateKey = timestamp.toDate().toISOString().split('T')[0];
  const hourKey = `${dateKey}-${timestamp.toDate().getHours().toString().padStart(2, '0')}`;
  
  return {
    id: event.id?.toString() || '',
    timestamp,
    duration: event.duration,
    data: event.data,
    bucket_id: bucketId,
    device_id: deviceId,
    type: bucketType,
    date_key: dateKey,
    hour_key: hourKey,
    created_at: admin.firestore.Timestamp.now()
  };
}
```

#### Firebase → ActivityWatch
```typescript
function convertFirebaseEventToAW(firebaseEvent: FirebaseEvent): AWEvent {
  return {
    id: firebaseEvent.id,
    timestamp: firebaseEvent.timestamp.toDate().toISOString(),
    duration: firebaseEvent.duration,
    data: firebaseEvent.data
  };
}
```

## 3. Query Optimization Strategies

### 3.1 Composite Indexes
```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "bucket_id", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION_GROUP", 
      "fields": [
        { "fieldPath": "device_id", "order": "ASCENDING" },
        { "fieldPath": "date_key", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "events", 
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "hour_key", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 3.2 Query Patterns

#### Günlük Event Query
```typescript
async function getEventsForDay(
  bucketId: string, 
  date: string
): Promise<AWEvent[]> {
  const eventsRef = db.collection(`buckets/${bucketId}/events`);
  
  // Use date_key for efficient daily queries
  const snapshot = await eventsRef
    .where('date_key', '==', date)
    .orderBy('timestamp', 'asc')
    .get();
  
  return snapshot.docs.map(doc => convertFirebaseEventToAW(doc.data()));
}
```

#### Saatlik Aggregation Query
```typescript
async function getHourlyStats(
  bucketId: string, 
  startDate: string, 
  endDate: string
): Promise<HourlyStats[]> {
  const eventsRef = db.collectionGroup('events');
  
  const snapshot = await eventsRef
    .where('bucket_id', '==', bucketId)
    .where('hour_key', '>=', `${startDate}-00`)
    .where('hour_key', '<=', `${endDate}-23`)
    .get();
  
  // Group by hour_key and aggregate
  const hourlyMap = new Map<string, number>();
  
  snapshot.docs.forEach(doc => {
    const event = doc.data();
    const hourKey = event.hour_key;
    const duration = event.duration;
    
    hourlyMap.set(hourKey, (hourlyMap.get(hourKey) || 0) + duration);
  });
  
  return Array.from(hourlyMap.entries()).map(([hour, duration]) => ({
    hour,
    duration,
    event_count: snapshot.docs.filter(d => d.data().hour_key === hour).length
  }));
}
```

#### Cross-Device Query
```typescript
async function getEventsAcrossDevices(
  deviceIds: string[],
  startTime: Date,
  endTime: Date
): Promise<AWEvent[]> {
  const eventsRef = db.collectionGroup('events');
  
  const snapshot = await eventsRef
    .where('device_id', 'in', deviceIds)
    .where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startTime))
    .where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endTime))
    .orderBy('timestamp', 'desc')
    .get();
  
  return snapshot.docs.map(doc => convertFirebaseEventToAW(doc.data()));
}
```

### 3.3 Pagination Strategies

#### Cursor-based Pagination
```typescript
async function getEventsPaginated(
  bucketId: string,
  pageSize: number = 100,
  lastEventTimestamp?: admin.firestore.Timestamp
): Promise<{ events: AWEvent[], nextCursor?: string }> {
  let query = db.collection(`buckets/${bucketId}/events`)
    .orderBy('timestamp', 'desc')
    .limit(pageSize);
  
  if (lastEventTimestamp) {
    query = query.startAfter(lastEventTimestamp);
  }
  
  const snapshot = await query.get();
  const events = snapshot.docs.map(doc => convertFirebaseEventToAW(doc.data()));
  
  const nextCursor = snapshot.docs.length === pageSize 
    ? snapshot.docs[snapshot.docs.length - 1].data().timestamp
    : undefined;
  
  return {
    events,
    nextCursor: nextCursor?.toDate().toISOString()
  };
}
```

## 4. Caching Layer

### 4.1 Multi-Level Caching
```typescript
import { NodeCache } from 'node-cache';
import { createHash } from 'crypto';

// In-memory cache for frequently accessed data
const memoryCache = new NodeCache({ 
  stdTTL: 300,        // 5 minutes
  maxKeys: 1000,      // Limit memory usage
  checkperiod: 60 
});

// Firestore cache for query results
async function cacheQuery(
  queryKey: string, 
  result: any, 
  ttlMinutes: number = 30
): Promise<void> {
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + ttlMinutes * 60 * 1000)
  );
  
  await db.collection('query_cache').doc(queryKey).set({
    query_hash: queryKey,
    result,
    created_at: admin.firestore.Timestamp.now(),
    expires_at: expiresAt,
    hit_count: 0
  });
}

async function getCachedQuery(queryKey: string): Promise<any | null> {
  // Check memory cache first
  const memoryResult = memoryCache.get(queryKey);
  if (memoryResult) {
    return memoryResult;
  }
  
  // Check Firestore cache
  const cacheDoc = await db.collection('query_cache').doc(queryKey).get();
  
  if (cacheDoc.exists) {
    const cacheData = cacheDoc.data()!;
    
    // Check if expired
    if (cacheData.expires_at.toDate() > new Date()) {
      // Update hit count
      await cacheDoc.ref.update({
        hit_count: admin.firestore.FieldValue.increment(1)
      });
      
      // Store in memory cache
      memoryCache.set(queryKey, cacheData.result);
      
      return cacheData.result;
    } else {
      // Remove expired cache
      await cacheDoc.ref.delete();
    }
  }
  
  return null;
}

function generateQueryKey(params: any): string {
  const queryString = JSON.stringify(params, Object.keys(params).sort());
  return createHash('sha256').update(queryString).digest('hex');
}
```

### 4.2 Smart Cache Invalidation
```typescript
// Trigger on event creation/update
export const invalidateCache = functions.firestore
  .document('buckets/{bucketId}/events/{eventId}')
  .onWrite(async (change, context) => {
    const bucketId = context.params.bucketId;
    
    // Get all cache keys related to this bucket
    const cacheSnapshot = await db.collection('query_cache')
      .where('query_hash', '>=', bucketId)
      .where('query_hash', '<', bucketId + '\uf8ff')
      .get();
    
    // Delete related cache entries
    const batch = db.batch();
    cacheSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Clear memory cache for this bucket
    const keys = memoryCache.keys();
    keys.forEach(key => {
      if (key.includes(bucketId)) {
        memoryCache.del(key);
      }
    });
  });
```

## 5. Data Aggregation

### 5.1 Real-time Aggregations
```typescript
// Update daily stats on event creation
export const updateDailyStats = functions.firestore
  .document('buckets/{bucketId}/events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    const bucketId = context.params.bucketId;
    const dateKey = event.date_key;
    
    const statsRef = db.doc(`buckets/${bucketId}/daily_stats/${dateKey}`);
    
    await db.runTransaction(async (transaction) => {
      const statsDoc = await transaction.get(statsRef);
      
      if (statsDoc.exists) {
        const stats = statsDoc.data()!;
        transaction.update(statsRef, {
          event_count: stats.event_count + 1,
          total_duration: stats.total_duration + event.duration,
          last_event: event.timestamp > stats.last_event ? event.timestamp : stats.last_event,
          first_event: event.timestamp < stats.first_event ? event.timestamp : stats.first_event
        });
      } else {
        transaction.set(statsRef, {
          date: dateKey,
          event_count: 1,
          total_duration: event.duration,
          first_event: event.timestamp,
          last_event: event.timestamp,
          data_summary: {}
        });
      }
      
      // Update bucket event count
      const bucketRef = db.doc(`buckets/${bucketId}`);
      transaction.update(bucketRef, {
        event_count: admin.firestore.FieldValue.increment(1),
        last_event_time: event.timestamp
      });
    });
  });
```

### 5.2 Scheduled Aggregations
```typescript
// Daily aggregation cleanup and optimization
export const dailyAggregation = functions.pubsub
  .schedule('0 2 * * *')  // Run at 2 AM daily
  .timeZone('UTC')
  .onRun(async (context) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = yesterday.toISOString().split('T')[0];
    
    // Process each bucket
    const bucketsSnapshot = await db.collection('buckets').get();
    
    for (const bucketDoc of bucketsSnapshot.docs) {
      const bucketId = bucketDoc.id;
      
      // Calculate comprehensive daily stats
      const eventsSnapshot = await db
        .collection(`buckets/${bucketId}/events`)
        .where('date_key', '==', dateKey)
        .get();
      
      if (eventsSnapshot.empty) continue;
      
      const events = eventsSnapshot.docs.map(doc => doc.data());
      
      // Calculate detailed statistics
      const stats = {
        date: dateKey,
        event_count: events.length,
        total_duration: events.reduce((sum, e) => sum + e.duration, 0),
        avg_duration: events.reduce((sum, e) => sum + e.duration, 0) / events.length,
        first_event: Math.min(...events.map(e => e.timestamp.toDate().getTime())),
        last_event: Math.max(...events.map(e => e.timestamp.toDate().getTime())),
        data_summary: calculateDataSummary(events),
        unique_data_keys: getUniqueDataKeys(events),
        processing_completed_at: admin.firestore.Timestamp.now()
      };
      
      await db.doc(`buckets/${bucketId}/daily_stats/${dateKey}`).set(stats);
    }
    
    // Cleanup old cache entries
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);  // Keep cache for 7 days
    
    const oldCacheSnapshot = await db.collection('query_cache')
      .where('created_at', '<', admin.firestore.Timestamp.fromDate(cutoffDate))
      .get();
    
    const batch = db.batch();
    oldCacheSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  });
```

## 6. Performance Monitoring

### 6.1 Query Performance Tracking
```typescript
async function executeTimedQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    // Log performance metrics
    await db.collection('performance_metrics').add({
      query_name: queryName,
      duration_ms: duration,
      status: 'success',
      timestamp: admin.firestore.Timestamp.now()
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    await db.collection('performance_metrics').add({
      query_name: queryName,
      duration_ms: duration,
      status: 'error',
      error_message: error.message,
      timestamp: admin.firestore.Timestamp.now()
    });
    
    throw error;
  }
}
```

### 6.2 Storage Cost Optimization
```typescript
// Cleanup old events based on retention policy
export const cleanupOldEvents = functions.pubsub
  .schedule('0 3 * * 0')  // Weekly on Sunday at 3 AM
  .onRun(async (context) => {
    const retentionDays = 365;  // Keep 1 year of data
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);
    
    // Get buckets to process
    const bucketsSnapshot = await db.collection('buckets').get();
    
    for (const bucketDoc of bucketsSnapshot.docs) {
      const bucketId = bucketDoc.id;
      
      // Find old events
      const oldEventsSnapshot = await db
        .collection(`buckets/${bucketId}/events`)
        .where('timestamp', '<', cutoffTimestamp)
        .limit(500)  // Process in batches
        .get();
      
      if (!oldEventsSnapshot.empty) {
        const batch = db.batch();
        oldEventsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        console.log(`Deleted ${oldEventsSnapshot.docs.length} old events from bucket ${bucketId}`);
      }
    }
  });
```

Bu veri modelleme stratejisi, ActivityWatch'un mevcut yapısına uyumlu, performanslı ve ölçeklenebilir bir Firebase entegrasyonu sağlıyor. Query optimizasyonu, caching ve aggregation stratejileri ile büyük veri setlerinde bile hızlı sorgu performansı elde ediliyor. 