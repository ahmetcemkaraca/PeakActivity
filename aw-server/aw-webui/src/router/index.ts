/**
 * Vue Router Configuration
 *
 * Feature-based routing organization ile modern Vue 3 router configuration.
 * Lazy loading, guard patterns ve type safety.
 */

import { createRouter, createWebHistory } from 'vue-router';
import { useCoreStore } from '@/stores/modules/core';

// Lazy loaded page components
const DashboardView = () => import('@/views/DashboardView.vue');
const ActivityView = () => import('@/views/ActivityView.vue');
const SettingsView = () => import('@/views/SettingsView.vue');
const AIInsightsView = () => import('@/views/AIInsightsView.vue');

// Route definitions with meta information
const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      title: 'Dashboard',
      requiresAuth: false,
      showInNavigation: true,
      icon: 'dashboard',
    },
  },
  {
    path: '/activity',
    name: 'activity',
    component: ActivityView,
    meta: {
      title: 'Activity',
      requiresAuth: false,
      showInNavigation: true,
      icon: 'activity',
    },
  },
  {
    path: '/ai-insights',
    name: 'ai-insights',
    component: AIInsightsView,
    meta: {
      title: 'AI Insights',
      requiresAuth: false,
      showInNavigation: true,
      icon: 'brain',
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: {
      title: 'Settings',
      requiresAuth: false,
      showInNavigation: true,
      icon: 'settings',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: {
      title: 'Page Not Found',
      requiresAuth: false,
      showInNavigation: false,
    },
  },
];

// Router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to: any, _from: any, savedPosition: any) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// Navigation guards
router.beforeEach(async (to: any, _from: any, next: any) => {
  // Set page title
  const title = to.meta?.title as string;
  if (title) {
    document.title = `${title} - PeakActivity`;
  }

  // Authentication check (for future use)
  if (to.meta?.requiresAuth) {
    const coreStore = useCoreStore();
    // TODO: Implement authentication check when auth system is ready
    if (!coreStore.isInitialized) {
      // For now, just initialize core store
      await coreStore.initialize();
    }
  }

  next();
});

// Route helper utilities
export const routeUtils = {
  /**
   * Get navigation routes for menu
   */
  getNavigationRoutes() {
    return routes.filter(route => route.meta?.showInNavigation);
  },

  /**
   * Check if route requires authentication
   */
  requiresAuth(routeName: string): boolean {
    const route = routes.find(r => r.name === routeName);
    return route?.meta?.requiresAuth === true;
  },

  /**
   * Get route meta information
   */
  getRouteMeta(routeName: string) {
    const route = routes.find(r => r.name === routeName);
    return route?.meta;
  },
};

export default router;
