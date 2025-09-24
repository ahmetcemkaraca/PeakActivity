---
applyTo: 'functions/src/api/**/*.ts'
description: 'API response standards and data modeling guidelines'
---

# API Geliştirme Standartları

Bu dosya, PeakActivity API'leri için yanıt formatları ve veri modelleme
standartlarını tanımlar.

## Standart API Response Format

### Başarılı Yanıtlar

```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  version: string;
}

// Örnek kullanım
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
}
```

### Hata Yanıtları

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  version: string;
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
}
```

## ActivityWatch API Compatibility

### Event CRUD Operations

```typescript
// GET /0/buckets/{bucket_id}/events
interface GetEventsResponse {
  events: AWEvent[];
  count: number;
  has_more: boolean;
}

// POST /0/buckets/{bucket_id}/events
interface CreateEventRequest {
  timestamp: string;
  duration: number;
  data: Record<string, any>;
}

// POST /0/buckets/{bucket_id}/heartbeat
interface HeartbeatRequest {
  timestamp: string;
  duration: number;
  data: Record<string, any>;
  pulsetime: number;
}
```

### Bucket Management

```typescript
interface BucketMetadata {
  id: string;
  type: string;
  client: string;
  hostname: string;
  created: string;
  name?: string;
  data?: Record<string, any>;
}

interface CreateBucketRequest {
  type: string;
  client: string;
  hostname: string;
  name?: string;
  data?: Record<string, any>;
}
```

## Firebase Cloud Functions Response Patterns

### Authentication Middleware Response

```typescript
export const authenticatedFunction = onCall(
  { enforceAppCheck: true },
  async (request): Promise<SuccessResponse<any> | ErrorResponse> => {
    try {
      // Authentication check
      if (!request.auth) {
        return createErrorResponse(
          'AUTH_REQUIRED',
          'Kullanıcı kimlik doğrulaması gerekli'
        );
      }

      const result = await processRequest(request.data);
      return createSuccessResponse(result);
    } catch (error) {
      logger.error('Function execution failed', { error: error.message });
      return createErrorResponse(
        'INTERNAL_ERROR',
        'İç sunucu hatası',
        error.message
      );
    }
  }
);
```

### Pagination Support

```typescript
interface PaginationRequest {
  limit?: number;
  offset?: number;
  cursor?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
    next_cursor?: string;
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  request: PaginationRequest
): PaginatedResponse<T> {
  const limit = request.limit || 50;
  const offset = request.offset || 0;

  return {
    items,
    pagination: {
      total,
      limit,
      offset,
      has_more: offset + items.length < total,
      next_cursor:
        offset + items.length < total
          ? Buffer.from(`${offset + limit}`).toString('base64')
          : undefined,
    },
  };
}
```

## Input Validation Patterns

### Zod Schema Validation

```typescript
import { z } from 'zod';

// Activity event validation
export const ActivityEventSchema = z.object({
  timestamp: z.string().datetime(),
  duration: z.number().min(0),
  data: z.record(z.any()),
  bucket_id: z.string().min(1),
});

// User settings validation
export const UserSettingsSchema = z.object({
  timezone: z.string(),
  start_of_day: z.string().regex(/^\d{2}:\d{2}$/),
  privacy_mode: z.boolean(),
  data_retention_days: z.number().min(1).max(3650),
});

// Validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      throw new HttpsError('invalid-argument', 'Geçersiz giriş verisi', error);
    }
  };
}
```

## Rate Limiting ve Quota

### Request Rate Limiting

```typescript
interface RateLimitConfig {
  requests_per_minute: number;
  requests_per_hour: number;
  burst_size: number;
}

export class RateLimiter {
  private static readonly CONFIGS: Record<string, RateLimitConfig> = {
    free: { requests_per_minute: 60, requests_per_hour: 1000, burst_size: 10 },
    premium: {
      requests_per_minute: 300,
      requests_per_hour: 10000,
      burst_size: 50,
    },
    pro: {
      requests_per_minute: 1000,
      requests_per_hour: 50000,
      burst_size: 200,
    },
  };

  static async checkLimit(userId: string, tier: string): Promise<boolean> {
    const config = this.CONFIGS[tier] || this.CONFIGS['free'];
    const key = `rate_limit:${userId}`;

    // Redis-based rate limiting implementation
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, 60); // 1 minute window
    }

    return current <= config.requests_per_minute;
  }
}
```

## Error Handling Standards

### Standart Error Codes

```typescript
export const API_ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'Kullanıcı kimlik doğrulaması gerekli',
  AUTH_INVALID: 'Geçersiz kimlik bilgileri',
  AUTH_EXPIRED: 'Oturum süresi dolmuş',

  // Authorization errors
  FORBIDDEN: 'Bu işlem için yetkiniz yok',
  QUOTA_EXCEEDED: 'Kullanım kotası aşıldı',

  // Validation errors
  INVALID_INPUT: 'Geçersiz giriş verisi',
  MISSING_REQUIRED: 'Gerekli alan eksik',

  // Resource errors
  NOT_FOUND: 'Kaynak bulunamadı',
  ALREADY_EXISTS: 'Kaynak zaten mevcut',

  // System errors
  INTERNAL_ERROR: 'İç sunucu hatası',
  SERVICE_UNAVAILABLE: 'Servis geçici olarak kullanılamıyor',
} as const;
```

### Structured Error Logging

```typescript
export function logError(error: Error, context: Record<string, any> = {}) {
  logger.error('API Error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  });
}
```

## API Versioning Strategy

### URL-based Versioning

```typescript
// v1 endpoints
export const apiV1 = functions.https.onRequest(express().use('/v1', v1Router));

// v2 endpoints with backward compatibility
export const apiV2 = functions.https.onRequest(express().use('/v2', v2Router));

// Version detection middleware
export function versionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const version = req.path.split('/')[1] || 'v1';
  req.apiVersion = version;
  next();
}
```
