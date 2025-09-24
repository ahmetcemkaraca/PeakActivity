/**
 * Store Modules Barrel Export
 *
 * Bu dosya tüm store modüllerini merkezi bir noktadan export eder.
 * Feature-based store organization pattern'ini destekler.
 */

// Core modules
export * from './core';
export * from './ui';
export * from './ai';

// Re-export existing stores with module organization
export { useActivityStore } from '../activity';
export { useAuthStore } from '../auth';
export { useBucketsStore } from '../buckets';
export { useCategoryStore } from '../categories';
export { usePredictionStore } from '../prediction';
export { useServerStore } from '../server';
export { useSettingsStore } from '../settings';
export { useViewsStore } from '../views';
export { useAgentStore } from '../agent';

// Type exports from core types
export type {
  AWEvent,
  AWBucket,
  Category,
  UserSettings,
  View,
  ViewElement,
  QueryParams,
  QueryResult,
  APIResponse,
  APIError,
  ValidationError,
} from '../../types/core';
