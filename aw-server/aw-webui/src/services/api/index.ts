/**
 * API Service Layer
 *
 * Bu dosya merkezi API servis katmanını sağlar.
 * Type-safe HTTP requests ve error handling ile.
 */

import { AWClient } from 'aw-client';

import type {
  AWEvent,
  AWBucket,
  QueryParams,
  QueryResult,
  APIResponse,
  APIError,
  UserSettings,
  Category,
} from '~/types';
import { safeAccess, isNotNull } from '~/utils/safe-access';

// API Service class with centralized request handling
export class APIService {
  private client: AWClient;
  private baseURL: string;

  constructor(client: AWClient, baseURL?: string) {
    this.client = client;
    this.baseURL = baseURL || '';
  }

  /**
   * Generic request method with error handling
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    try {
      const response = await this.client.req.request({
        method,
        url: `${this.baseURL}${endpoint}`,
        data,
      });

      if (response.status >= 400) {
        throw new APIError({
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: 'HTTP_ERROR',
          details: { status: response.status, statusText: response.statusText },
        });
      }

      return response.data as T;
    } catch (error: unknown) {
      if (error instanceof APIError) {
        throw error;
      }

      // Handle network errors
      if (error && typeof error === 'object' && 'code' in error) {
        throw new APIError({
          message: 'Network error occurred',
          code: 'NETWORK_ERROR',
          details: { originalError: error },
        });
      }

      // Handle unknown errors
      throw new APIError({
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        details: { originalError: error },
      });
    }
  }

  /**
   * Bucket operations
   */
  async getBuckets(): Promise<Record<string, AWBucket>> {
    return this.request<Record<string, AWBucket>>('GET', '/api/0/buckets/');
  }

  async getBucket(bucketId: string): Promise<AWBucket> {
    return this.request<AWBucket>('GET', `/api/0/buckets/${bucketId}`);
  }

  async createBucket(bucket: Omit<AWBucket, 'created' | 'last_updated'>): Promise<void> {
    return this.request<void>('POST', `/api/0/buckets/${bucket.id}`, bucket);
  }

  async deleteBucket(bucketId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/0/buckets/${bucketId}`);
  }

  /**
   * Event operations
   */
  async getEvents(
    bucketId: string,
    params?: {
      start?: Date;
      end?: Date;
      limit?: number;
    }
  ): Promise<AWEvent[]> {
    let endpoint = `/api/0/buckets/${bucketId}/events`;

    if (params) {
      const searchParams = new URLSearchParams();
      if (params.start) searchParams.set('start', params.start.toISOString());
      if (params.end) searchParams.set('end', params.end.toISOString());
      if (params.limit) searchParams.set('limit', params.limit.toString());

      const queryString = searchParams.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }

    return this.request<AWEvent[]>('GET', endpoint);
  }

  async createEvent(bucketId: string, event: Omit<AWEvent, 'id'>): Promise<AWEvent> {
    return this.request<AWEvent>('POST', `/api/0/buckets/${bucketId}/events`, event);
  }

  async createEvents(bucketId: string, events: Omit<AWEvent, 'id'>[]): Promise<void> {
    return this.request<void>('POST', `/api/0/buckets/${bucketId}/events`, events);
  }

  async deleteEvent(bucketId: string, eventId: string): Promise<void> {
    return this.request<void>('DELETE', `/api/0/buckets/${bucketId}/events/${eventId}`);
  }

  /**
   * Query operations
   */
  async query(params: QueryParams): Promise<QueryResult> {
    return this.request<QueryResult>('POST', '/api/0/query/', params);
  }

  /**
   * Settings operations
   */
  async getSettings(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/api/0/settings/');
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    return this.request<void>('POST', '/api/0/settings/', settings);
  }

  /**
   * Info operations
   */
  async getInfo(): Promise<{
    name: string;
    version: string;
    hostname: string;
    device_id: string;
  }> {
    return this.request('GET', '/api/0/info');
  }

  /**
   * AI Feature operations
   */
  async getFocusQualityScore(
    events: AWEvent[],
    userTz: string
  ): Promise<{
    score: number;
    factors: Record<string, number>;
    recommendations: string[];
  }> {
    return this.request('POST', '/api/0/ai/focus-quality-score', {
      events,
      user_tz: userTz,
    });
  }

  async getBehavioralTrends(
    dailyTotals: Array<{ date: string; duration: number; category: string[] }>,
    window: number
  ): Promise<{
    trends: Array<{ date: string; trend: 'increasing' | 'decreasing' | 'stable' }>;
    insights: string[];
  }> {
    return this.request('POST', '/api/0/ai/behavioral-trends', {
      daily_totals: dailyTotals,
      window,
    });
  }

  async getAnomalyDetection(
    dailyTotals: Array<{ date: string; duration: number; category: string[] }>
  ): Promise<{
    anomalies: Array<{ date: string; severity: 'low' | 'medium' | 'high'; reason: string }>;
    baseline: Record<string, number>;
  }> {
    return this.request('POST', '/api/0/ai/anomaly-detection', {
      daily_totals: dailyTotals,
    });
  }

  async applyCommunityRules(
    event: AWEvent,
    communityRules: Array<{ pattern: string; category: string[] }>
  ): Promise<{
    matched: boolean;
    category?: string[];
    confidence: number;
  }> {
    return this.request('POST', '/api/0/ai/community-rules', {
      event,
      community_rules: communityRules,
    });
  }

  async getContextualCategorization(
    context: string,
    language?: string
  ): Promise<{
    category: string[];
    confidence: number;
    alternatives: Array<{ category: string[]; confidence: number }>;
  }> {
    return this.request('POST', '/api/0/ai/contextual-categorization', {
      context,
      language,
    });
  }
}

/**
 * Create API service instance with proper error handling
 */
export function createAPIService(client: AWClient, baseURL?: string): APIService {
  if (!client) {
    throw new APIError({
      message: 'AWClient is required to create API service',
      code: 'INVALID_CLIENT',
    });
  }

  return new APIService(client, baseURL);
}

/**
 * API Error class for consistent error handling
 */
export class APIError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(params: { message: string; code: string; details?: Record<string, unknown> }) {
    super(params.message);
    this.name = 'APIError';
    this.code = params.code;
    this.details = params.details;
  }

  /**
   * Check if error is of specific type
   */
  public isType(code: string): boolean {
    return this.code === code;
  }

  /**
   * Get user-friendly error message
   */
  public getUserMessage(): string {
    switch (this.code) {
      case 'NETWORK_ERROR':
        return 'İnternet bağlantınızı kontrol edin';
      case 'HTTP_ERROR':
        const status = safeAccess(this.details, 'status');
        if (status === 404) return 'İstenen kaynak bulunamadı';
        if (status === 401) return 'Yetkilendirme gerekli';
        if (status === 403) return 'Bu işlem için yetkiniz yok';
        if (status === 500) return 'Sunucu hatası oluştu';
        return 'Bir hata oluştu';
      case 'VALIDATION_ERROR':
        return 'Girilen veriler geçerli değil';
      case 'TIMEOUT_ERROR':
        return 'İstek zaman aşımına uğradı';
      default:
        return 'Beklenmeyen bir hata oluştu';
    }
  }

  /**
   * Serialize error for logging
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Response transformer utilities
 */
export class ResponseTransformer {
  /**
   * Transform raw API response to typed data
   */
  static transformEvent(raw: unknown): AWEvent | null {
    if (!raw || typeof raw !== 'object') return null;

    const obj = raw as Record<string, unknown>;

    if (!isNotNull(obj.id) || !isNotNull(obj.timestamp) || !isNotNull(obj.duration)) {
      return null;
    }

    return {
      id: String(obj.id),
      timestamp: new Date(String(obj.timestamp)),
      duration: { seconds: Number(obj.duration) },
      data: (obj.data as Record<string, unknown>) || {},
    };
  }

  /**
   * Transform bucket data
   */
  static transformBucket(raw: unknown): AWBucket | null {
    if (!raw || typeof raw !== 'object') return null;

    const obj = raw as Record<string, unknown>;

    if (!isNotNull(obj.id) || !isNotNull(obj.type) || !isNotNull(obj.hostname)) {
      return null;
    }

    return {
      id: String(obj.id),
      type: String(obj.type) as any, // TODO: Add proper type validation
      hostname: String(obj.hostname),
      client: String(obj.client || 'unknown'),
      created: new Date(String(obj.created)),
      last_updated: obj.last_updated ? new Date(String(obj.last_updated)) : undefined,
      metadata: (obj.metadata as Record<string, unknown>) || {},
    };
  }

  /**
   * Transform category data
   */
  static transformCategory(raw: unknown): Category | null {
    if (!raw || typeof raw !== 'object') return null;

    const obj = raw as Record<string, unknown>;

    if (!Array.isArray(obj.name) || !isNotNull(obj.rule)) {
      return null;
    }

    return {
      id: obj.id ? Number(obj.id) : undefined,
      name: obj.name as string[],
      rule: obj.rule as any, // TODO: Add proper rule validation
      data: (obj.data as Record<string, unknown>) || {},
    };
  }
}
