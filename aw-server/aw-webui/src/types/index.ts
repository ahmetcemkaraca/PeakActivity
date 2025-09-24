/**
 * Core Module Barrel Exports
 *
 * Bu dosya core modüllerinin merkezi export noktasıdır.
 * Clean architecture patterns için barrel exports kullanılır.
 */

// Type definitions
export * from './core';

// Utilities
export * from '../utils/safe-access';

// Constants
export * from './constants';

// Re-export common types for convenience
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
} from './core';
