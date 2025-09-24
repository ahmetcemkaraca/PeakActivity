/**
 * Activity Data Composable
 *
 * Bu composable Activity verilerini yönetmek için reactive state sağlar.
 * Vue 3 Composition API patterns kullanır.
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { Ref, ComputedRef } from 'vue';

import type { AWEvent, AWBucket, QueryParams, QueryResult } from '~/types';
import { APIService, APIError } from '~/services/api';
import { getClient } from '~/util/awclient';
import { useErrorHandler } from './useErrorHandler';
import { useLoadingState } from './useLoadingState';

export interface UseActivityOptions {
  autoFetch?: boolean;
  refetchInterval?: number;
  cacheTimeout?: number;
}

export interface ActivityState {
  events: Ref<AWEvent[]>;
  buckets: Ref<Record<string, AWBucket>>;
  currentBucket: Ref<AWBucket | null>;
  totalDuration: ComputedRef<number>;
  eventCount: ComputedRef<number>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  lastFetch: Ref<Date | null>;
}

export interface ActivityActions {
  fetchEvents: (
    bucketId: string,
    params?: { start?: Date; end?: Date; limit?: number }
  ) => Promise<void>;
  fetchBuckets: () => Promise<void>;
  createEvent: (bucketId: string, event: Omit<AWEvent, 'id'>) => Promise<void>;
  deleteEvent: (bucketId: string, eventId: string) => Promise<void>;
  setBucket: (bucketId: string) => Promise<void>;
  query: (params: QueryParams) => Promise<QueryResult>;
  refresh: () => Promise<void>;
  clear: () => void;
}

export type UseActivityReturn = ActivityState & ActivityActions;

/**
 * Main composable for activity data management
 */
export function useActivity(options: UseActivityOptions = {}): UseActivityReturn {
  // Dependencies
  const { handleError, clearError } = useErrorHandler();
  const { isLoading, setLoading } = useLoadingState();

  // Create API service
  const apiService = new APIService(getClient());

  // State
  const events = ref<AWEvent[]>([]);
  const buckets = ref<Record<string, AWBucket>>({});
  const currentBucket = ref<AWBucket | null>(null);
  const error = ref<string | null>(null);
  const lastFetch = ref<Date | null>(null);

  // Computed values
  const totalDuration = computed((): number => {
    return events.value.reduce((total, event) => {
      return total + (event.duration.seconds || 0);
    }, 0);
  });

  const eventCount = computed((): number => {
    return events.value.length;
  });

  // Cache management
  const cache = new Map<string, { data: unknown; timestamp: number }>();
  const cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5 minutes

  /**
   * Check if cached data is valid
   */
  const isCacheValid = (key: string): boolean => {
    const cached = cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < cacheTimeout;
  };

  /**
   * Set cache data
   */
  const setCache = (key: string, data: unknown): void => {
    cache.set(key, { data, timestamp: Date.now() });
  };

  /**
   * Get cached data
   */
  const getCache = <T>(key: string): T | null => {
    const cached = cache.get(key);
    return cached && isCacheValid(key) ? (cached.data as T) : null;
  };

  /**
   * Fetch events for a bucket
   */
  const fetchEvents = async (
    bucketId: string,
    params?: { start?: Date; end?: Date; limit?: number }
  ): Promise<void> => {
    const cacheKey = `events_${bucketId}_${JSON.stringify(params)}`;

    // Check cache first
    const cachedEvents = getCache<AWEvent[]>(cacheKey);
    if (cachedEvents) {
      events.value = cachedEvents;
      return;
    }

    try {
      setLoading(true);
      clearError();

      const fetchedEvents = await apiService.getEvents(bucketId, params);

      // Transform and validate events
      const validEvents = fetchedEvents.filter(event => {
        return (
          event &&
          typeof event === 'object' &&
          'id' in event &&
          'timestamp' in event &&
          'duration' in event
        );
      });

      events.value = validEvents;
      setCache(cacheKey, validEvents);
      lastFetch.value = new Date();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof APIError ? err.getUserMessage() : 'Events yüklenirken hata oluştu';

      error.value = errorMessage;
      handleError(err, 'fetchEvents');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch all buckets
   */
  const fetchBuckets = async (): Promise<void> => {
    const cacheKey = 'buckets_all';

    // Check cache first
    const cachedBuckets = getCache<Record<string, AWBucket>>(cacheKey);
    if (cachedBuckets) {
      buckets.value = cachedBuckets;
      return;
    }

    try {
      setLoading(true);
      clearError();

      const fetchedBuckets = await apiService.getBuckets();
      buckets.value = fetchedBuckets;
      setCache(cacheKey, fetchedBuckets);
      lastFetch.value = new Date();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof APIError ? err.getUserMessage() : 'Buckets yüklenirken hata oluştu';

      error.value = errorMessage;
      handleError(err, 'fetchBuckets');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new event
   */
  const createEvent = async (bucketId: string, event: Omit<AWEvent, 'id'>): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const newEvent = await apiService.createEvent(bucketId, event);

      // Add to local state
      events.value = [...events.value, newEvent];

      // Clear cache for this bucket
      const cacheKeys = Array.from(cache.keys()).filter(key =>
        key.startsWith(`events_${bucketId}`)
      );
      cacheKeys.forEach(key => cache.delete(key));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof APIError ? err.getUserMessage() : 'Event oluşturulurken hata oluştu';

      error.value = errorMessage;
      handleError(err, 'createEvent');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an event
   */
  const deleteEvent = async (bucketId: string, eventId: string): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      await apiService.deleteEvent(bucketId, eventId);

      // Remove from local state
      events.value = events.value.filter(event => event.id !== eventId);

      // Clear cache for this bucket
      const cacheKeys = Array.from(cache.keys()).filter(key =>
        key.startsWith(`events_${bucketId}`)
      );
      cacheKeys.forEach(key => cache.delete(key));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof APIError ? err.getUserMessage() : 'Event silinirken hata oluştu';

      error.value = errorMessage;
      handleError(err, 'deleteEvent');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set current bucket
   */
  const setBucket = async (bucketId: string): Promise<void> => {
    try {
      const bucket = buckets.value[bucketId];
      if (bucket) {
        currentBucket.value = bucket;
      } else {
        // Fetch bucket if not in cache
        const fetchedBucket = await apiService.getBucket(bucketId);
        currentBucket.value = fetchedBucket;
        buckets.value[bucketId] = fetchedBucket;
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof APIError ? err.getUserMessage() : 'Bucket yüklenirken hata oluştu';

      error.value = errorMessage;
      handleError(err, 'setBucket');
    }
  };

  /**
   * Execute a query
   */
  const query = async (params: QueryParams): Promise<QueryResult> => {
    const cacheKey = `query_${JSON.stringify(params)}`;

    // Check cache first
    const cachedResult = getCache<QueryResult>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    try {
      setLoading(true);
      clearError();

      const result = await apiService.query(params);
      setCache(cacheKey, result);

      return result;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof APIError ? err.getUserMessage() : 'Sorgu çalıştırılırken hata oluştu';

      error.value = errorMessage;
      handleError(err, 'query');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh all data
   */
  const refresh = async (): Promise<void> => {
    // Clear all cache
    cache.clear();

    // Refetch data
    await Promise.all([
      fetchBuckets(),
      currentBucket.value ? fetchEvents(currentBucket.value.id) : Promise.resolve(),
    ]);
  };

  /**
   * Clear all state
   */
  const clear = (): void => {
    events.value = [];
    buckets.value = {};
    currentBucket.value = null;
    error.value = null;
    lastFetch.value = null;
    cache.clear();
  };

  // Auto-fetch on mount if enabled
  if (options.autoFetch !== false) {
    onMounted(() => {
      fetchBuckets();
    });
  }

  // Auto-refresh interval
  let refreshInterval: NodeJS.Timeout | null = null;
  if (options.refetchInterval && options.refetchInterval > 0) {
    onMounted(() => {
      refreshInterval = setInterval(refresh, options.refetchInterval);
    });
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  // Watch for bucket changes and auto-fetch events
  watch(
    currentBucket,
    newBucket => {
      if (newBucket && options.autoFetch !== false) {
        fetchEvents(newBucket.id);
      }
    },
    { immediate: false }
  );

  return {
    // State
    events,
    buckets,
    currentBucket,
    totalDuration,
    eventCount,
    isLoading,
    error,
    lastFetch,

    // Actions
    fetchEvents,
    fetchBuckets,
    createEvent,
    deleteEvent,
    setBucket,
    query,
    refresh,
    clear,
  };
}
