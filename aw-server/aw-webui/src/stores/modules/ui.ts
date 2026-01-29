/**
 * UI Store Module
 * 
 * Kullanıcı arayüzü state management için UI store modülü.
 * Tema, layout, navigation ve modal durumları için merkezi store.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Theme and appearance store
export const useUIStore = defineStore('ui', () => {
  // State
  const theme = ref<'light' | 'dark' | 'auto'>('auto');
  const sidebarCollapsed = ref(false);
  const headerFixed = ref(true);
  const footerVisible = ref(true);
  
  // Computed
  const isDarkMode = computed(() => {
    if (theme.value === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme.value === 'dark';
  });
  
  // Actions
  const toggleTheme = (): void => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme.value);
    theme.value = themes[(currentIndex + 1) % themes.length];
  };
  
  const setTheme = (newTheme: 'light' | 'dark' | 'auto'): void => {
    theme.value = newTheme;
  };
  
  const toggleSidebar = (): void => {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  };
  
  const setSidebarCollapsed = (collapsed: boolean): void => {
    sidebarCollapsed.value = collapsed;
  };
  
  return {
    // State
    theme,
    sidebarCollapsed,
    headerFixed,
    footerVisible,
    
    // Computed
    isDarkMode,
    
    // Actions
    toggleTheme,
    setTheme,
    toggleSidebar,
    setSidebarCollapsed
  };
});

// Modal management store
export const useModalStore = defineStore('modal', () => {
  // State
  const activeModals = ref<Map<string, { visible: boolean; data?: any }>>(new Map());
  const modalStack = ref<string[]>([]);
  
  // Computed
  const hasActiveModals = computed(() => modalStack.value.length > 0);
  const topModal = computed(() => 
    modalStack.value.length > 0 ? modalStack.value[modalStack.value.length - 1] : null
  );
  
  // Actions
  const openModal = (modalId: string, data?: any): void => {
    activeModals.value.set(modalId, { visible: true, data });
    
    // Add to stack if not already present
    if (!modalStack.value.includes(modalId)) {
      modalStack.value.push(modalId);
    }
  };
  
  const closeModal = (modalId: string): void => {
    const modal = activeModals.value.get(modalId);
    if (modal) {
      modal.visible = false;
    }
    
    // Remove from stack
    const index = modalStack.value.indexOf(modalId);
    if (index > -1) {
      modalStack.value.splice(index, 1);
    }
  };
  
  const closeAllModals = (): void => {
    activeModals.value.clear();
    modalStack.value = [];
  };
  
  const getModalData = (modalId: string): any => {
    return activeModals.value.get(modalId)?.data;
  };
  
  const isModalVisible = (modalId: string): boolean => {
    return activeModals.value.get(modalId)?.visible ?? false;
  };
  
  return {
    // State
    activeModals,
    modalStack,
    
    // Computed
    hasActiveModals,
    topModal,
    
    // Actions
    openModal,
    closeModal,
    closeAllModals,
    getModalData,
    isModalVisible
  };
});

// Loading and toast notification store
export const useNotificationStore = defineStore('notification', () => {
  // State
  const loadingStates = ref<Map<string, boolean>>(new Map());
  const toasts = ref<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration: number;
    timestamp: Date;
  }>>([]);
  
  // Computed
  const globalLoading = computed(() => 
    Array.from(loadingStates.value.values()).some(state => state)
  );
  
  const activeToasts = computed(() => 
    toasts.value.filter(toast => {
      const elapsed = Date.now() - toast.timestamp.getTime();
      return elapsed < toast.duration;
    })
  );
  
  // Actions
  const setLoading = (key: string, loading: boolean): void => {
    loadingStates.value.set(key, loading);
  };
  
  const clearLoading = (key: string): void => {
    loadingStates.value.delete(key);
  };
  
  const clearAllLoading = (): void => {
    loadingStates.value.clear();
  };
  
  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration: number = 5000
  ): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    toasts.value.push({
      id,
      type,
      title,
      message,
      duration,
      timestamp: new Date()
    });
    
    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
    
    return id;
  };
  
  const removeToast = (id: string): void => {
    const index = toasts.value.findIndex(toast => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };
  
  const clearAllToasts = (): void => {
    toasts.value = [];
  };
  
  // Convenience methods
  const showSuccess = (title: string, message: string, duration?: number): string => 
    showToast('success', title, message, duration);
  
  const showError = (title: string, message: string, duration?: number): string => 
    showToast('error', title, message, duration);
  
  const showWarning = (title: string, message: string, duration?: number): string => 
    showToast('warning', title, message, duration);
  
  const showInfo = (title: string, message: string, duration?: number): string => 
    showToast('info', title, message, duration);
  
  return {
    // State
    loadingStates,
    toasts,
    
    // Computed
    globalLoading,
    activeToasts,
    
    // Actions
    setLoading,
    clearLoading,
    clearAllLoading,
    showToast,
    removeToast,
    clearAllToasts,
    
    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
});

// Navigation and routing store
export const useNavigationStore = defineStore('navigation', () => {
  // State
  const breadcrumbs = ref<Array<{ label: string; route?: string }>>([]);
  const navigationHistory = ref<string[]>([]);
  const currentRoute = ref<string>('');
  
  // Computed
  const canGoBack = computed(() => navigationHistory.value.length > 1);
  
  // Actions
  const setBreadcrumbs = (newBreadcrumbs: Array<{ label: string; route?: string }>): void => {
    breadcrumbs.value = newBreadcrumbs;
  };
  
  const addBreadcrumb = (label: string, route?: string): void => {
    breadcrumbs.value.push({ label, ...(route !== undefined && { route }) });
  };
  
  const clearBreadcrumbs = (): void => {
    breadcrumbs.value = [];
  };
  
  const updateCurrentRoute = (route: string): void => {
    if (currentRoute.value !== route) {
      navigationHistory.value.push(route);
      
      // Keep history limited to last 50 entries
      if (navigationHistory.value.length > 50) {
        navigationHistory.value = navigationHistory.value.slice(-50);
      }
    }
    currentRoute.value = route;
  };
  
  const getPreviousRoute = (): string | null => {
    return navigationHistory.value.length > 1 
      ? navigationHistory.value[navigationHistory.value.length - 2]
      : null;
  };
  
  return {
    // State
    breadcrumbs,
    navigationHistory,
    currentRoute,
    
    // Computed
    canGoBack,
    
    // Actions
    setBreadcrumbs,
    addBreadcrumb,
    clearBreadcrumbs,
    updateCurrentRoute,
    getPreviousRoute
  };
});
