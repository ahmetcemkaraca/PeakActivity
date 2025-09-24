/**
 * Error Management System
 *
 * Merkezi error handling, user-friendly error display ve error recovery
 * için comprehensive error management sistemi.
 */

import { computed, reactive } from 'vue';
import { useNotificationStore } from '../stores/modules/ui';

export interface ErrorInfo {
  id: string;
  type: 'network' | 'validation' | 'auth' | 'system' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userMessage: string;
  details?: any;
  timestamp: Date;
  resolved: boolean;
  retryable: boolean;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ErrorRecoveryAction {
  id: string;
  label: string;
  handler: () => Promise<void> | void;
  primary?: boolean;
}

class ErrorManager {
  private errors = reactive<Map<string, ErrorInfo>>(new Map());
  private notificationStore: ReturnType<typeof useNotificationStore>;

  constructor() {
    this.notificationStore = useNotificationStore();
  }

  /**
   * Error yakalama ve işleme
   */
  captureError(
    error: Error | string,
    context: {
      type?: ErrorInfo['type'];
      severity?: ErrorInfo['severity'];
      component?: string;
      action?: string;
      metadata?: Record<string, any>;
    } = {}
  ): string {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorDetails =
      typeof error === 'string'
        ? null
        : {
            stack: error.stack,
            name: error.name,
          };

    const errorInfo: ErrorInfo = {
      id: errorId,
      type: context.type ?? 'system',
      severity: context.severity ?? 'medium',
      message: errorMessage,
      userMessage: this.generateUserFriendlyMessage(errorMessage, context.type ?? 'system'),
      details: errorDetails,
      timestamp: new Date(),
      resolved: false,
      retryable: this.isRetryable(errorMessage, context.type ?? 'system'),
      ...(context.component && { component: context.component }),
      ...(context.action && { action: context.action }),
      ...(context.metadata && { metadata: context.metadata }),
    };

    this.errors.set(errorId, errorInfo);

    // Log error for debugging
    console.error('Error captured:', {
      id: errorId,
      message: errorMessage,
      context,
      details: errorDetails,
    });

    // Show user notification based on severity
    this.showErrorNotification(errorInfo);

    return errorId;
  }

  /**
   * Kullanıcı dostu error mesajları oluşturma
   */
  private generateUserFriendlyMessage(errorMessage: string, type: ErrorInfo['type']): string {
    const messageMap: Record<ErrorInfo['type'], Record<string, string>> = {
      network: {
        'Failed to fetch': 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
        'Network request failed': 'Sunucuya bağlanılamıyor. Lütfen daha sonra tekrar deneyin.',
        timeout: 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',
        default: 'Bağlantı sorunu yaşanıyor. İnternet bağlantınızı kontrol edin.',
      },
      validation: {
        required: 'Bu alan zorunludur.',
        'invalid email': 'Geçerli bir e-posta adresi girin.',
        'password too short': 'Şifre en az 8 karakter olmalıdır.',
        default: 'Girdiğiniz bilgileri kontrol edin.',
      },
      auth: {
        unauthorized: 'Bu işlem için yetkiniz bulunmuyor.',
        'token expired': 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
        'invalid credentials': 'Kullanıcı adı veya şifre hatalı.',
        default: 'Giriş sorunu yaşanıyor. Lütfen tekrar deneyin.',
      },
      system: {
        'out of memory': 'Sistem kaynakları yetersiz. Lütfen uygulamayı yeniden başlatın.',
        'file not found': 'İstenen dosya bulunamadı.',
        default: 'Sistem hatası oluştu. Teknik destek ile iletişime geçin.',
      },
      user: {
        default: 'İşlem tamamlanamadı. Lütfen tekrar deneyin.',
      },
    };

    const typeMessages = messageMap[type];

    // Find specific message or use default
    for (const [key, message] of Object.entries(typeMessages)) {
      if (key !== 'default' && errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return message;
      }
    }

    return typeMessages.default;
  }

  /**
   * Error'un retry edilebilir olup olmadığını kontrol etme
   */
  private isRetryable(errorMessage: string, type: ErrorInfo['type']): boolean {
    const retryablePatterns = {
      network: ['fetch', 'timeout', 'connection', 'network'],
      system: ['temporary', 'busy', 'overload'],
      user: ['invalid input', 'validation'],
    };

    const patterns = retryablePatterns[type as keyof typeof retryablePatterns] || [];
    return patterns.some(pattern => errorMessage.toLowerCase().includes(pattern.toLowerCase()));
  }

  /**
   * Severity'e göre notification gösterme
   */
  private showErrorNotification(errorInfo: ErrorInfo): void {
    const duration = {
      low: 3000,
      medium: 5000,
      high: 8000,
      critical: 0, // Manual dismiss only
    }[errorInfo.severity];

    const title = {
      low: 'Bilgi',
      medium: 'Uyarı',
      high: 'Hata',
      critical: 'Kritik Hata',
    }[errorInfo.severity];

    const type = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'error',
    }[errorInfo.severity] as 'info' | 'warning' | 'error';

    this.notificationStore.showToast(type, title, errorInfo.userMessage, duration);
  }

  /**
   * Error'u çözümleme
   */
  resolveError(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
    }
  }

  /**
   * Error'u silme
   */
  removeError(errorId: string): void {
    this.errors.delete(errorId);
  }

  /**
   * Tüm çözümlenmiş error'ları temizleme
   */
  clearResolvedErrors(): void {
    Array.from(this.errors.entries()).forEach(([id, error]) => {
      if (error.resolved) {
        this.errors.delete(id);
      }
    });
  }

  /**
   * Eski error'ları temizleme
   */
  clearOldErrors(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);

    Array.from(this.errors.entries()).forEach(([id, error]) => {
      if (error.timestamp < cutoff) {
        this.errors.delete(id);
      }
    });
  }

  /**
   * Error retry işlemi
   */
  async retryError(errorId: string, retryHandler?: () => Promise<void>): Promise<boolean> {
    const error = this.errors.get(errorId);
    if (!error || !error.retryable) {
      return false;
    }

    try {
      if (retryHandler) {
        await retryHandler();
      }

      this.resolveError(errorId);
      this.notificationStore.showSuccess('Başarılı', 'İşlem başarıyla yeniden denendi.');
      return true;
    } catch (retryError) {
      this.captureError(retryError as Error, {
        type: 'system',
        severity: 'medium',
        ...(error.component && { component: error.component }),
        action: `retry_${error.action || 'unknown'}`,
        metadata: { originalErrorId: errorId },
      });
      return false;
    }
  }

  /**
   * Error istatistikleri
   */
  get errorStats() {
    const errorsList = Array.from(this.errors.values());

    return {
      total: errorsList.length,
      unresolved: errorsList.filter(e => !e.resolved).length,
      byType: errorsList.reduce(
        (acc, error) => {
          acc[error.type] = (acc[error.type] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorInfo['type'], number>
      ),
      bySeverity: errorsList.reduce(
        (acc, error) => {
          acc[error.severity] = (acc[error.severity] || 0) + 1;
          return acc;
        },
        {} as Record<ErrorInfo['severity'], number>
      ),
      recent: errorsList.filter(
        e => Date.now() - e.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
      ).length,
    };
  }

  /**
   * Error'ları listeleme
   */
  getErrors(filters?: {
    type?: ErrorInfo['type'];
    severity?: ErrorInfo['severity'];
    resolved?: boolean;
    component?: string;
  }) {
    let errorsList = Array.from(this.errors.values());

    if (filters) {
      if (filters.type) {
        errorsList = errorsList.filter(e => e.type === filters.type);
      }
      if (filters.severity) {
        errorsList = errorsList.filter(e => e.severity === filters.severity);
      }
      if (filters.resolved !== undefined) {
        errorsList = errorsList.filter(e => e.resolved === filters.resolved);
      }
      if (filters.component) {
        errorsList = errorsList.filter(e => e.component === filters.component);
      }
    }

    return errorsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Singleton instance
export const errorManager = new ErrorManager();

/**
 * Vue composable for error management
 */
export function useErrorHandler() {
  const captureError = (
    error: Error | string,
    context?: Parameters<typeof errorManager.captureError>[1]
  ) => {
    return errorManager.captureError(error, context);
  };

  const handleAsyncError = async <T>(
    operation: () => Promise<T>,
    context?: Parameters<typeof errorManager.captureError>[1]
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      captureError(error as Error, context);
      return null;
    }
  };

  const withErrorBoundary = <T extends any[], R>(
    fn: (...args: T) => R,
    context?: Parameters<typeof errorManager.captureError>[1]
  ) => {
    return (...args: T): R | null => {
      try {
        return fn(...args);
      } catch (error) {
        captureError(error as Error, context);
        return null;
      }
    };
  };

  return {
    captureError,
    handleAsyncError,
    withErrorBoundary,
    resolveError: errorManager.resolveError.bind(errorManager),
    retryError: errorManager.retryError.bind(errorManager),
    removeError: errorManager.removeError.bind(errorManager),
    clearResolvedErrors: errorManager.clearResolvedErrors.bind(errorManager),
    getErrors: errorManager.getErrors.bind(errorManager),
    errorStats: computed(() => errorManager.errorStats),
  };
}
