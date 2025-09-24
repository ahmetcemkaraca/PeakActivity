/**
 * Firebase Cloud Functions Type Definitions
 * 
 * Bu dosya Firebase Functions için tip güvenli tanımlar içerir.
 * Runtime validation ile compile-time safety sağlar.
 */

import { z } from 'zod';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// User document structure
export interface UserDocument {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  created_at: FieldValue;
  last_login?: FieldValue;
  preferences: UserPreferences;
  subscription?: UserSubscription;
  settings: UserSettings;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  ai: AISettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  insights: boolean;
  goals: boolean;
  focus_mode: boolean;
}

export interface PrivacySettings {
  data_sharing: boolean;
  analytics: boolean;
  ai_processing: boolean;
  cloud_sync: boolean;
}

export interface AISettings {
  recommendations_enabled: boolean;
  auto_categorization: boolean;
  predictive_insights: boolean;
  behavioral_analysis: boolean;
}

export interface UserSubscription {
  plan: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  current_period_start: Timestamp;
  current_period_end: Timestamp;
  trial_end?: Timestamp;
}

export interface UserSettings {
  dashboard_layout: DashboardLayout;
  data_retention_days: number;
  sync_frequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  focus_modes: FocusMode[];
  goals: Goal[];
}

// Activity data types
export interface ActivityEventFirestore {
  id: string;
  user_id: string;
  bucket_id: string;
  timestamp: Timestamp;
  duration: number;
  data: ActivityEventData;
  date_key: string; // yyyy-MM-dd for partitioning
  hour_key: string; // yyyy-MM-dd-HH for aggregation
  processed: boolean;
  created_at: Timestamp;
}

export interface ActivityEventData {
  app?: string;
  title?: string;
  url?: string;
  category?: string[];
  afk?: boolean;
  status?: 'active' | 'afk' | 'unknown';
  idle?: boolean;
  audible?: boolean;
  incognito?: boolean;
  location?: GeoLocation;
  device_info?: DeviceInfo;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  country?: string;
  city?: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser?: string;
  screen_resolution?: string;
  user_agent?: string;
}

// Goals and insights
export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: GoalType;
  target: GoalTarget;
  period: GoalPeriod;
  status: GoalStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type GoalType = 
  | 'time_limit'
  | 'time_target'
  | 'productivity_score'
  | 'category_balance'
  | 'focus_sessions';

export interface GoalTarget {
  value: number;
  unit: 'minutes' | 'hours' | 'score' | 'sessions' | 'percentage';
  categories?: string[];
  apps?: string[];
}

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface Insight {
  id: string;
  user_id: string;
  type: InsightType;
  title: string;
  description: string;
  data: InsightData;
  confidence: number; // 0-1
  priority: InsightPriority;
  actionable: boolean;
  actions?: InsightAction[];
  created_at: Timestamp;
  expires_at?: Timestamp;
}

export type InsightType = 
  | 'productivity_trend'
  | 'focus_pattern'
  | 'time_waste_detection'
  | 'goal_progress'
  | 'behavioral_change'
  | 'optimization_suggestion';

export type InsightPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface InsightData {
  metrics?: Record<string, number>;
  trends?: TimeSeriesData[];
  categories?: string[];
  apps?: string[];
  recommendations?: string[];
  [key: string]: unknown;
}

export interface InsightAction {
  type: 'block_app' | 'set_reminder' | 'create_goal' | 'enable_focus_mode';
  label: string;
  data: Record<string, unknown>;
}

export interface TimeSeriesData {
  timestamp: Timestamp;
  value: number;
  label?: string;
}

// Focus modes and automation
export interface FocusMode {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  configuration: FocusModeConfig;
  schedule?: FocusModeSchedule;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface FocusModeConfig {
  block_apps?: string[];
  block_categories?: string[];
  block_websites?: string[];
  allow_apps?: string[];
  allow_categories?: string[];
  allow_websites?: string[];
  mute_notifications?: boolean;
  auto_suggest_breaks?: boolean;
  break_interval_minutes?: number;
  break_duration_minutes?: number;
  background_sounds?: boolean;
  theme_override?: 'focus' | 'minimal';
}

export interface FocusModeSchedule {
  enabled: boolean;
  days: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  start_time: string; // HH:mm format
  end_time: string; // HH:mm format
  timezone: string;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
  theme: string;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  config: WidgetConfig;
}

export type WidgetType = 
  | 'time_summary'
  | 'top_apps'
  | 'top_categories'
  | 'productivity_score'
  | 'goals_progress'
  | 'focus_sessions'
  | 'insights'
  | 'calendar_view';

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  time_range: 'today' | 'week' | 'month' | 'year';
  show_details: boolean;
  color_theme?: string;
  filters?: WidgetFilters;
}

export interface WidgetFilters {
  categories?: string[];
  apps?: string[];
  exclude_categories?: string[];
  exclude_apps?: string[];
}

// Zod validation schemas
export const CreateActivityEventSchema = z.object({
  timestamp: z.string().datetime(),
  duration: z.number().positive(),
  data: z.record(z.unknown()),
  bucket_id: z.string().min(1)
});

export const CreateGoalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['time_limit', 'time_target', 'productivity_score', 'category_balance', 'focus_sessions']),
  target: z.object({
    value: z.number().positive(),
    unit: z.enum(['minutes', 'hours', 'score', 'sessions', 'percentage']),
    categories: z.array(z.string()).optional(),
    apps: z.array(z.string()).optional()
  }),
  period: z.enum(['daily', 'weekly', 'monthly', 'custom'])
});

export const CreateFocusModeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  configuration: z.object({
    block_apps: z.array(z.string()).optional(),
    block_categories: z.array(z.string()).optional(),
    block_websites: z.array(z.string()).optional(),
    allow_apps: z.array(z.string()).optional(),
    allow_categories: z.array(z.string()).optional(),
    allow_websites: z.array(z.string()).optional(),
    mute_notifications: z.boolean().optional(),
    auto_suggest_breaks: z.boolean().optional(),
    break_interval_minutes: z.number().positive().optional(),
    break_duration_minutes: z.number().positive().optional()
  })
});

export const UpdateUserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    insights: z.boolean().optional(),
    goals: z.boolean().optional(),
    focus_mode: z.boolean().optional()
  }).optional(),
  privacy: z.object({
    data_sharing: z.boolean().optional(),
    analytics: z.boolean().optional(),
    ai_processing: z.boolean().optional(),
    cloud_sync: z.boolean().optional()
  }).optional(),
  ai: z.object({
    recommendations_enabled: z.boolean().optional(),
    auto_categorization: z.boolean().optional(),
    predictive_insights: z.boolean().optional(),
    behavioral_analysis: z.boolean().optional()
  }).optional()
});

// Type inference from schemas
export type CreateActivityEventRequest = z.infer<typeof CreateActivityEventSchema>;
export type CreateGoalRequest = z.infer<typeof CreateGoalSchema>;
export type CreateFocusModeRequest = z.infer<typeof CreateFocusModeSchema>;
export type UpdateUserPreferencesRequest = z.infer<typeof UpdateUserPreferencesSchema>;

// HTTP Response types
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
}

export type APIResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// Utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
