---
applyTo: "functions/**/*.ts,aw-server/**/*.py"
description: "Firebase integration patterns and cloud architecture guidelines"
---

# Firebase Entegrasyon Kılavuzu

Bu dosya, ActivityWatch ile Firebase entegrasyonu için mimari kalıpları ve en iyi uygulamaları tanımlar.

## ActivityWatch Server Firebase Entegrasyonu

### Storage Method Selection
```python
# aw-server/main.py içinde depolama metodu seçimi
storage_methods = {
    "peewee": PeeweeStorage,      # Local SQLite/Postgres
    "memory": MemoryStorage,       # In-memory (testing)
    "firestore": FirestoreStorage  # Firebase cloud storage
}
```

### Core Data Models
- **Event**: `{id, timestamp, duration, data}` - Temel aktivite takip birimi
- **Bucket**: Type'a göre event container'ları (`"afk.status"`, `"window.title"`)
- **Datastore**: Storage backend'leri için abstract interface

## Firebase Cloud Functions Mimarisi

```typescript
functions/src/
├── api/                    // ActivityWatch API endpoints
│   ├── buckets.ts         // Bucket CRUD operations
│   ├── events.ts          // Event management  
│   ├── heartbeat.ts       // Real-time heartbeat
│   └── query.ts           // Query2 engine
├── triggers/               // Firestore triggers
│   ├── onBucketCreate.ts  // Bucket creation handling
│   ├── onEventCreate.ts   // Real-time processing
│   └── onUserCreate.ts    // User initialization
├── scheduled/              // Scheduled functions
│   ├── aggregation.ts     // Daily/hourly aggregations
│   └── cleanup.ts         // Data retention policies
└── utils/
    ├── auth.ts            // Authentication helpers
    ├── firestore.ts       // Database utilities
    └── validation.ts      // Data validation
```

## Authentication Patterns

### Middleware Pattern
```typescript
export const requireAuth = (handler: Function) => {
  return async (data: any, context: CallableContext) => {
    const user = await authenticateUser(context);
    return handler(data, context, user);
  };
};
```

### Multi-device Authorization
```typescript
export async function checkDeviceLimit(userId: string, deviceId: string): Promise<boolean> {
  const userDoc = await firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  const deviceLimit = userData.customClaims?.device_limit || 3;
  const registeredDevices = userData.devices || [];
  
  if (registeredDevices.includes(deviceId)) return true;
  if (registeredDevices.length < deviceLimit) {
    await userDoc.ref.update({
      devices: [...registeredDevices, deviceId],
      lastSeen: new Date()
    });
    return true;
  }
  
  return false;
}
```

## Firestore Data Modeling

### Collection Hierarchy
```
/users/{userId}/
├── buckets/{bucketId}/
│   ├── metadata (document)
│   └── events/{eventId}/
├── aggregations/{period}/
└── settings (document)
```

### Data Conversion Patterns
```typescript
function convertAWEventToFirebase(event: AWEvent, bucketId: string) {
  return {
    ...event,
    bucket_id: bucketId,
    date_key: format(event.timestamp, 'yyyy-MM-dd'),
    hour_key: format(event.timestamp, 'yyyy-MM-dd-HH'),
    created_at: new Date()
  };
}
```

## Error Handling Patterns

```typescript
// Firebase Functions error handling
try {
  const result = await processData(data);
  return { success: true, data: result };
} catch (error) {
  logger.error('Process failed', { error: error.message, data });
  throw new HttpsError('internal', 'İşlem başarısız oldu', error);
}
```

## Security Rules Guidelines

- Firestore rules'da user-based data isolation
- Authentication zorunluluğu tüm operations için
- Rate limiting ve quota kontrolü
- Sensitive data'nın client-side encryption'ı
