/**
 * Components Barrel Export
 *
 * Bu dosya tüm component'leri merkezi bir noktadan export eder.
 * Feature-based component organization için barrel exports kullanılır.
 */

// UI Kit Components
export { default as ErrorBoundary } from './common/ErrorBoundary.vue';
export { default as LoadingSpinner } from './common/LoadingSpinner.vue';
export { default as ToastNotification } from './common/ToastNotification.vue';
export { default as ConfirmDialog } from './common/ConfirmDialog.vue';

// Form Components
export { default as InputTimeInterval } from './forms/InputTimeInterval.vue';
export { default as ColorPicker } from './forms/ColorPicker.vue';
export { default as SelectCategories } from './forms/SelectCategories.vue';
export { default as SelectCategoriesOrPattern } from './forms/SelectCategoriesOrPattern.vue';

// Activity Components
export { default as ActivityView } from './activity/ActivityView.vue';
export { default as SelectableVisualization } from './activity/SelectableVisualization.vue';
export { default as SelectableEventView } from './activity/SelectableEventView.vue';
export { default as EventEditor } from './activity/EventEditor.vue';
export { default as EventList } from './activity/EventList.vue';

// AI Components
export { default as AIInsightsDisplay } from './ai/AIInsightsDisplay.vue';
export { default as AnomalyDetectionDisplay } from './ai/AnomalyDetectionDisplay.vue';
export { default as BehavioralTrendsDisplay } from './ai/BehavioralTrendsDisplay.vue';
export { default as FocusQualityScoreDisplay } from './ai/FocusQualityScoreDisplay.vue';

// Goals and Tracking Components
export { default as GoalList } from './goals/GoalList.vue';
export { default as GoalProgressBar } from './goals/GoalProgressBar.vue';
export { default as EditGoalModal } from './goals/EditGoalModal.vue';

// Category Components
export { default as CategoryEditTree } from './categories/CategoryEditTree.vue';
export { default as CategoryEditModal } from './categories/CategoryEditModal.vue';

// Layout Components
export { default as Header } from './layout/Header.vue';
export { default as Footer } from './layout/Footer.vue';
export { default as Sidebar } from './layout/Sidebar.vue';

// Chart Components
export { default as BarChart } from './charts/BarChart.vue';

// Development Components
export { default as DevOnly } from './development/DevOnly.vue';

// Notification Components
export { default as NewReleaseNotification } from './notifications/NewReleaseNotification.vue';
export { default as UserSatisfactionPoll } from './notifications/UserSatisfactionPoll.vue';

// Query Components
export { default as QueryOptions } from './query/QueryOptions.vue';
