/**
 * ActivityWatch Core Types
 * 
 * Bu dosya ActivityWatch sisteminin merkezi tip tanımlarını içerir.
 * Tüm 'any' kullanımları bu tip tanımlarla değiştirilmelidir.
 */

// Timestamp utilities
export interface TimestampRange {
  start: Date;
  end: Date;
}

export interface Duration {
  seconds: number;
  milliseconds?: number;
}

// Core ActivityWatch Event Structure
export interface AWEvent {
  id: string;
  timestamp: Date;
  duration: Duration;
  data: EventData;
}

// Event data can contain various information based on watcher type
export interface EventData {
  app?: string;
  title?: string;
  url?: string;
  category?: string[];
  afk?: boolean;
  status?: 'active' | 'afk' | 'unknown';
  idle?: boolean;
  audible?: boolean;
  incognito?: boolean;
  [key: string]: unknown;
}

// Bucket definition for event containers
export interface AWBucket {
  id: string;
  type: BucketType;
  hostname: string;
  client: string;
  created: Date;
  last_updated?: Date;
  metadata?: BucketMetadata;
}

export type BucketType = 
  | 'currentwindow'
  | 'afkstatus'
  | 'web.tab.current'
  | 'app.editor.activity'
  | 'stopwatch'
  | 'custom';

export interface BucketMetadata {
  start?: Date;
  end?: Date;
  [key: string]: unknown;
}

// Query system types
export interface QueryParams {
  timeperiods: TimestampRange[];
  query: string;
  name?: string;
  cache?: boolean;
}

export interface QueryResult {
  [bucketId: string]: AWEvent[];
}

// Category system
export interface Category {
  id?: number;
  name: string[];
  name_pretty?: string;
  subname?: string;
  rule: CategoryRule;
  data?: CategoryData;
  depth?: number;
  parent?: string[];
  children?: Category[];
}

export interface CategoryRule {
  type: 'regex' | 'none';
  regex?: string;
  ignore_case?: boolean;
}

export interface CategoryData {
  color?: string;
  score?: number;
  [key: string]: unknown;
}

// Settings and preferences
export interface UserSettings {
  theme: 'light' | 'dark';
  startOfDay: string;
  startOfWeek: string;
  durationDefault: number;
  useColorFallback: boolean;
  landingpage: string;
  requestTimeout: number;
  aiRecommendationsEnabled: boolean;
  aiAlertsEnabled: boolean;
  devmode: boolean;
  showYearly: boolean;
  useMultidevice: boolean;
  classes: Category[];
  views: View[];
  _loaded: boolean;
}

export interface View {
  id: string;
  name: string;
  elements: ViewElement[];
}

export interface ViewElement {
  type: string;
  size?: number;
  props?: Record<string, unknown>;
}

// Client and API types
export interface AWClientConfig {
  name: string;
  testing?: boolean;
  baseURL?: string;
  timeout?: number;
}

export interface APIResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

export interface APIError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// Export utility type guards
export function isAWEvent(obj: unknown): obj is AWEvent {
  return typeof obj === 'object' && obj !== null && 
    'id' in obj && 'timestamp' in obj && 'duration' in obj && 'data' in obj;
}

export function isAWBucket(obj: unknown): obj is AWBucket {
  return typeof obj === 'object' && obj !== null &&
    'id' in obj && 'type' in obj && 'hostname' in obj && 'client' in obj;
}

export function isCategory(obj: unknown): obj is Category {
  return typeof obj === 'object' && obj !== null &&
    'name' in obj && 'rule' in obj && Array.isArray((obj as Category).name);
}

// Helper types for safe access
export type SafeAccess<T, K extends keyof T> = T[K] | undefined;

export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
}
