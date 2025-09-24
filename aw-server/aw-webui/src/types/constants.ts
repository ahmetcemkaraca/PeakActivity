/**
 * Application Constants
 * 
 * Bu dosya uygulama genelinde kullanılan sabitleri içerir.
 */

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
} as const;

export type Theme = typeof THEMES[keyof typeof THEMES];

// Duration constants (milliseconds)
export const DURATIONS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

// Default pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5,
} as const;

// API endpoints
export const API_ENDPOINTS = {
  BUCKETS: '/api/0/buckets',
  EVENTS: '/api/0/events',
  QUERY: '/api/0/query',
  INFO: '/api/0/info',
  SETTINGS: '/api/0/settings',
} as const;

// Bucket types
export const BUCKET_TYPES = {
  CURRENT_WINDOW: 'currentwindow',
  AFK_STATUS: 'afkstatus',
  WEB_TAB: 'web.tab.current',
  EDITOR_ACTIVITY: 'app.editor.activity',
  STOPWATCH: 'stopwatch',
  CUSTOM: 'custom',
} as const;

export type BucketType = typeof BUCKET_TYPES[keyof typeof BUCKET_TYPES];

// Event status types
export const EVENT_STATUS = {
  ACTIVE: 'active',
  AFK: 'afk',
  UNKNOWN: 'unknown',
} as const;

export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];

// Category rule types
export const CATEGORY_RULE_TYPES = {
  REGEX: 'regex',
  NONE: 'none',
} as const;

export type CategoryRuleType = typeof CATEGORY_RULE_TYPES[keyof typeof CATEGORY_RULE_TYPES];

// View element types
export const VIEW_ELEMENT_TYPES = {
  TOP_APPS: 'top_apps',
  TOP_TITLES: 'top_titles',
  TOP_CATEGORIES: 'top_categories',
  TOP_DOMAINS: 'top_domains',
  TIMELINE_BARCHART: 'timeline_barchart',
  CATEGORY_TREE: 'category_tree',
  CATEGORY_SUNBURST: 'category_sunburst',
  STOPWATCH: 'stopwatch',
  SUMMARY: 'summary',
} as const;

export type ViewElementType = typeof VIEW_ELEMENT_TYPES[keyof typeof VIEW_ELEMENT_TYPES];

// Colors
export const COLORS = {
  PRIMARY: '#007bff',
  SECONDARY: '#6c757d',
  SUCCESS: '#28a745',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#17a2b8',
  LIGHT: '#f8f9fa',
  DARK: '#343a40',
  UNCATEGORIZED: '#CCC',
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  SETTINGS: 'aw-settings',
  CATEGORIES: 'aw-categories',
  VIEWS: 'aw-views',
  THEME: 'aw-theme',
  LAST_SYNC: 'aw-last-sync',
  USER_PREFERENCES: 'aw-user-preferences',
} as const;

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  BUCKET_ID: /^[a-zA-Z0-9_.-]+$/,
  HOSTNAME: /^[a-zA-Z0-9.-]+$/,
} as const;

// Time format patterns
export const TIME_FORMATS = {
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSXXX',
  DATE_ONLY: 'yyyy-MM-dd',
  TIME_ONLY: 'HH:mm:ss',
  DISPLAY: 'MMM dd, yyyy HH:mm',
  SHORT: 'MM/dd/yyyy',
} as const;

// Query limits
export const QUERY_LIMITS = {
  MAX_EVENTS: 10000,
  MAX_TIMEPERIODS: 100,
  MAX_QUERY_LENGTH: 10000,
  DEFAULT_LIMIT: 1000,
} as const;

// File size limits (bytes)
export const FILE_LIMITS = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,   // 5MB
  MAX_DOCUMENT_SIZE: 50 * 1024 * 1024, // 50MB
} as const;

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'text/plain', 'application/json'],
  EXPORTS: ['application/json', 'text/csv', 'application/zip'],
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  AI_INSIGHTS: 'ai_insights',
  CLOUD_SYNC: 'cloud_sync',
  TEAM_FEATURES: 'team_features',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  BETA_FEATURES: 'beta_features',
} as const;

export type FeatureFlag = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

// Default settings
export const DEFAULT_SETTINGS = {
  THEME: THEMES.LIGHT,
  START_OF_DAY: '00:00',
  START_OF_WEEK: 'monday',
  DURATION_DEFAULT: 5,
  USE_COLOR_FALLBACK: true,
  LANDING_PAGE: '/home',
  REQUEST_TIMEOUT: 30,
  AI_RECOMMENDATIONS_ENABLED: true,
  AI_ALERTS_ENABLED: true,
  DEV_MODE: false,
  SHOW_YEARLY: false,
  USE_MULTIDEVICE: false,
} as const;

// WebSocket events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  EVENT_UPDATE: 'event_update',
  BUCKET_UPDATE: 'bucket_update',
  SETTINGS_UPDATE: 'settings_update',
  ERROR: 'error',
} as const;

export type WSEventType = typeof WS_EVENTS[keyof typeof WS_EVENTS];
