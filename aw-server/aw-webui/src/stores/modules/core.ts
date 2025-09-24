/**
 * Core Store Module
 *
 * Temel application state management için core store modülü.
 * Activity tracking, buckets ve server iletişimi için merkezi store.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AWEvent, APIResponse } from '../../types';

// Core data management store
export const useCoreStore = defineStore('core', () => {
  // State
  const isInitialized = ref(false);
  const lastSyncTime = ref<Date | null>(null);
  const syncInProgress = ref(false);

  // Computed
  const syncStatus = computed(() => ({
    isInitialized: isInitialized.value,
    lastSync: lastSyncTime.value,
    inProgress: syncInProgress.value,
  }));

  // Actions
  const initialize = async (): Promise<void> => {
    try {
      syncInProgress.value = true;
      // Core initialization logic
      await new Promise(resolve => setTimeout(resolve, 100)); // Placeholder
      isInitialized.value = true;
      lastSyncTime.value = new Date();
    } catch (error) {
      console.error('Core store initialization failed:', error);
      throw error;
    } finally {
      syncInProgress.value = false;
    }
  };

  const resetCore = (): void => {
    isInitialized.value = false;
    lastSyncTime.value = null;
    syncInProgress.value = false;
  };

  return {
    // State
    isInitialized,
    lastSyncTime,
    syncInProgress,

    // Computed
    syncStatus,

    // Actions
    initialize,
    resetCore,
  };
});

// Data synchronization store
export const useDataSyncStore = defineStore('dataSync', () => {
  // State
  const pendingChanges = ref<Map<string, AWEvent>>(new Map());
  const syncInterval = ref<number | null>(null);
  const autoSyncEnabled = ref(true);

  // Computed
  const hasPendingChanges = computed(() => pendingChanges.value.size > 0);

  // Actions
  const addPendingChange = (eventId: string, event: AWEvent): void => {
    pendingChanges.value.set(eventId, event);
  };

  const clearPendingChanges = (): void => {
    pendingChanges.value.clear();
  };

  const startAutoSync = (intervalMs: number = 30000): void => {
    if (syncInterval.value) {
      clearInterval(syncInterval.value);
    }

    syncInterval.value = window.setInterval(async () => {
      if (autoSyncEnabled.value && hasPendingChanges.value) {
        await syncPendingChanges();
      }
    }, intervalMs);
  };

  const stopAutoSync = (): void => {
    if (syncInterval.value) {
      clearInterval(syncInterval.value);
      syncInterval.value = null;
    }
  };

  const syncPendingChanges = async (): Promise<APIResponse<void>> => {
    try {
      // Sync logic implementation
      const changes = Array.from(pendingChanges.value.values());
      console.log(`Syncing ${changes.length} pending changes`);

      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 500));

      clearPendingChanges();

      return {
        data: undefined,
        status: 200,
        headers: {},
      };
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        data: undefined,
        status: 500,
        headers: {},
      };
    }
  };

  return {
    // State
    pendingChanges,
    autoSyncEnabled,

    // Computed
    hasPendingChanges,

    // Actions
    addPendingChange,
    clearPendingChanges,
    startAutoSync,
    stopAutoSync,
    syncPendingChanges,
  };
});

// Application lifecycle store
export const useAppLifecycleStore = defineStore('appLifecycle', () => {
  // State
  const appState = ref<'loading' | 'ready' | 'error'>('loading');
  const initializationSteps = ref<Array<{ name: string; completed: boolean; error?: string }>>([]);

  // Computed
  const isAppReady = computed(() => appState.value === 'ready');
  const initializationProgress = computed(() => {
    const completed = initializationSteps.value.filter(step => step.completed).length;
    const total = initializationSteps.value.length;
    return total > 0 ? (completed / total) * 100 : 0;
  });

  // Actions
  const addInitializationStep = (name: string): void => {
    initializationSteps.value.push({ name, completed: false });
  };

  const completeInitializationStep = (name: string): void => {
    const step = initializationSteps.value.find(s => s.name === name);
    if (step) {
      step.completed = true;
    }
  };

  const failInitializationStep = (name: string, error: string): void => {
    const step = initializationSteps.value.find(s => s.name === name);
    if (step) {
      step.error = error;
    }
    appState.value = 'error';
  };

  const setAppReady = (): void => {
    appState.value = 'ready';
  };

  const resetApp = (): void => {
    appState.value = 'loading';
    initializationSteps.value = [];
  };

  return {
    // State
    appState,
    initializationSteps,

    // Computed
    isAppReady,
    initializationProgress,

    // Actions
    addInitializationStep,
    completeInitializationStep,
    failInitializationStep,
    setAppReady,
    resetApp,
  };
});
