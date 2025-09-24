/**
 * Error Handler Composable
 * 
 * Bu composable merkezi error handling sağlar.
 */

import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';

export interface ErrorInfo {
  message: string;
  code?: string;
  context?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface UseErrorHandlerReturn {
  errors: Ref<ErrorInfo[]>;
  currentError: ComputedRef<ErrorInfo | null>;
  hasErrors: ComputedRef<boolean>;
  handleError: (error: unknown, context?: string) => void;
  clearError: (index?: number) => void;
  clearAllErrors: () => void;
  getErrorMessage: (error: unknown) => string;
}

/**
 * Error handler composable
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const errors = ref<ErrorInfo[]>([]);

  const currentError = computed((): ErrorInfo | null => {
    return errors.value.length > 0 ? errors.value[errors.value.length - 1] : null;
  });

  const hasErrors = computed((): boolean => {
    return errors.value.length > 0;
  });

  /**
   * Extract error message from various error types
   */
  const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }

      if ('getUserMessage' in error && typeof error.getUserMessage === 'function') {
        return (error as any).getUserMessage();
      }

      if ('toString' in error && typeof error.toString === 'function') {
        return error.toString();
      }
    }

    return 'Bilinmeyen hata oluştu';
  };

  /**
   * Handle error and add to errors list
   */
  const handleError = (error: unknown, context?: string): void => {
    const errorInfo: ErrorInfo = {
      message: getErrorMessage(error),
      timestamp: new Date()
    };

    if (context) {
      errorInfo.context = context;
    }

    // Extract additional details if available
    if (error && typeof error === 'object') {
      if ('code' in error && typeof error.code === 'string') {
        errorInfo.code = error.code;
      }

      if ('details' in error && typeof error.details === 'object') {
        errorInfo.details = error.details as Record<string, unknown>;
      }
    }

    errors.value.push(errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context || 'Unknown'}]`, error);
    }

    // Keep only last 10 errors
    if (errors.value.length > 10) {
      errors.value = errors.value.slice(-10);
    }
  };

  /**
   * Clear specific error or last error
   */
  const clearError = (index?: number): void => {
    if (index !== undefined && index >= 0 && index < errors.value.length) {
      errors.value.splice(index, 1);
    } else if (errors.value.length > 0) {
      errors.value.pop();
    }
  };

  /**
   * Clear all errors
   */
  const clearAllErrors = (): void => {
    errors.value = [];
  };

  return {
    errors,
    currentError,
    hasErrors,
    handleError,
    clearError,
    clearAllErrors,
    getErrorMessage
  };
}
