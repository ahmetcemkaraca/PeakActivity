/**
 * Loading State Composable
 * 
 * Bu composable loading state yönetimi sağlar.
 */

import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';

export interface LoadingState {
  [key: string]: boolean;
}

export interface UseLoadingStateReturn {
  isLoading: ComputedRef<boolean>;
  loadingStates: Ref<LoadingState>;
  setLoading: (loading: boolean, key?: string) => void;
  getLoading: (key: string) => boolean;
  clearLoading: (key?: string) => void;
  clearAllLoading: () => void;
}

/**
 * Loading state composable
 */
export function useLoadingState(): UseLoadingStateReturn {
  const loadingStates = ref<LoadingState>({
    default: false
  });

  // Global loading state - true if any operation is loading
  const isLoading = computed((): boolean => {
    return Object.values(loadingStates.value).some(loading => loading);
  });

  /**
   * Set loading state for a specific key or default
   */
  const setLoading = (loading: boolean, key: string = 'default'): void => {
    loadingStates.value[key] = loading;
  };

  /**
   * Get loading state for a specific key
   */
  const getLoading = (key: string): boolean => {
    return loadingStates.value[key] || false;
  };

  /**
   * Clear loading state for a specific key or default
   */
  const clearLoading = (key: string = 'default'): void => {
    loadingStates.value[key] = false;
  };

  /**
   * Clear all loading states
   */
  const clearAllLoading = (): void => {
    Object.keys(loadingStates.value).forEach(key => {
      loadingStates.value[key] = false;
    });
  };

  return {
    isLoading,
    loadingStates,
    setLoading,
    getLoading,
    clearLoading,
    clearAllLoading
  };
}
