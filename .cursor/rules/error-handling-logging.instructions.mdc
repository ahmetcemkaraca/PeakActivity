---
applyTo: "**/error/**,**/logging/**,**/utils/logger**,**/middleware/error**"
description: "Error handling patterns ve centralized logging standartları"
---

# Error Handling ve Centralized Logging

Bu dosya, PeakActivity projesinin error handling ve logging standartlarını tanımlar.

## Structured Error Handling

### Error Types ve Hierarchy
```typescript
// src/types/errors.ts
export enum ErrorType {
  // User errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  
  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  
  // Business logic errors
  BUSINESS_RULE_ERROR = 'BUSINESS_RULE_ERROR',
  DATA_INTEGRITY_ERROR = 'DATA_INTEGRITY_ERROR',
  
  // External service errors
  FIREBASE_ERROR = 'FIREBASE_ERROR',
  ACTIVITY_WATCH_ERROR = 'ACTIVITY_WATCH_ERROR',
  PRAISONAI_ERROR = 'PRAISONAI_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  component: string;
  action: string;
  timestamp: Date;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class BaseError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: ErrorContext;
  public readonly code: string;
  public readonly retryable: boolean;
  
  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity,
    context: ErrorContext,
    code?: string,
    retryable: boolean = false
  ) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.code = code || type;
    this.retryable = retryable;
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      retryable: this.retryable,
      context: this.context,
      stack: this.stack
    };
  }
}

// Specific error classes
export class ValidationError extends BaseError {
  constructor(message: string, context: ErrorContext, field?: string) {
    super(
      message,
      ErrorType.VALIDATION_ERROR,
      ErrorSeverity.LOW,
      { ...context, metadata: { field } }
    );
  }
}

export class DatabaseError extends BaseError {
  constructor(message: string, context: ErrorContext, originalError?: Error) {
    super(
      message,
      ErrorType.DATABASE_ERROR,
      ErrorSeverity.HIGH,
      { ...context, metadata: { originalError: originalError?.message } },
      undefined,
      true // Database errors are typically retryable
    );
  }
}

export class AIServiceError extends BaseError {
  constructor(message: string, context: ErrorContext, serviceType?: string) {
    super(
      message,
      ErrorType.AI_SERVICE_ERROR,
      ErrorSeverity.MEDIUM,
      { ...context, metadata: { serviceType } },
      undefined,
      true
    );
  }
}
```

### Error Handler Middleware
```typescript
// functions/src/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { BaseError, ErrorSeverity } from '../types/errors';
import { Logger } from '../utils/logger';

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    type: string;
    requestId: string;
    timestamp: string;
    details?: any;
  };
}

export class ErrorHandler {
  private static logger = new Logger('ErrorHandler');
  
  /**
   * Express error handling middleware
   */
  static middleware() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      const requestId = req.headers['x-request-id'] as string || this.generateRequestId();
      
      // Convert to structured error if needed
      const structuredError = this.normalizeError(error, {
        userId: (req as any).user?.uid,
        requestId,
        component: 'api',
        action: `${req.method} ${req.path}`,
        timestamp: new Date(),
        userAgent: req.headers['user-agent'],
        metadata: {
          body: req.body,
          query: req.query,
          params: req.params
        }
      });
      
      // Log error
      this.logError(structuredError);
      
      // Send appropriate response
      const response = this.createErrorResponse(structuredError);
      const statusCode = this.getStatusCode(structuredError);
      
      res.status(statusCode).json(response);
    };
  }
  
  /**
   * Async error wrapper for Express routes
   */
  static asyncWrapper(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
  
  /**
   * Client-side error handler
   */
  static handleClientError(error: Error, context: Partial<ErrorContext>): void {
    const structuredError = this.normalizeError(error, {
      component: 'client',
      action: context.action || 'unknown',
      timestamp: new Date(),
      ...context
    });
    
    this.logError(structuredError);
    this.reportErrorToService(structuredError);
  }
  
  private static normalizeError(error: Error, context: Partial<ErrorContext>): BaseError {
    if (error instanceof BaseError) {
      return error;
    }
    
    // Detect error type from message/stack
    const errorType = this.detectErrorType(error);
    const severity = this.determineSeverity(error, errorType);
    
    return new BaseError(
      error.message,
      errorType,
      severity,
      context as ErrorContext,
      undefined,
      this.isRetryable(error, errorType)
    );
  }
  
  private static detectErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // Firebase errors
    if (message.includes('firebase') || stack.includes('firebase')) {
      return ErrorType.FIREBASE_ERROR;
    }
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorType.NETWORK_ERROR;
    }
    
    // Database errors
    if (message.includes('firestore') || message.includes('database') || message.includes('query')) {
      return ErrorType.DATABASE_ERROR;
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorType.VALIDATION_ERROR;
    }
    
    // Auth errors
    if (message.includes('auth') || message.includes('permission') || message.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION_ERROR;
    }
    
    return ErrorType.BUSINESS_RULE_ERROR; // Default
  }
  
  private static determineSeverity(error: Error, type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.VALIDATION_ERROR:
      case ErrorType.AUTHENTICATION_ERROR:
        return ErrorSeverity.LOW;
        
      case ErrorType.BUSINESS_RULE_ERROR:
      case ErrorType.AI_SERVICE_ERROR:
        return ErrorSeverity.MEDIUM;
        
      case ErrorType.DATABASE_ERROR:
      case ErrorType.FIREBASE_ERROR:
        return ErrorSeverity.HIGH;
        
      case ErrorType.DATA_INTEGRITY_ERROR:
        return ErrorSeverity.CRITICAL;
        
      default:
        return ErrorSeverity.MEDIUM;
    }
  }
  
  private static isRetryable(error: Error, type: ErrorType): boolean {
    const retryableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.DATABASE_ERROR,
      ErrorType.AI_SERVICE_ERROR,
      ErrorType.FIREBASE_ERROR
    ];
    
    return retryableTypes.includes(type) && !error.message.includes('permanent');
  }
  
  private static getStatusCode(error: BaseError): number {
    switch (error.type) {
      case ErrorType.VALIDATION_ERROR:
        return 400;
      case ErrorType.AUTHENTICATION_ERROR:
        return 401;
      case ErrorType.AUTHORIZATION_ERROR:
        return 403;
      case ErrorType.DATABASE_ERROR:
      case ErrorType.FIREBASE_ERROR:
        return 500;
      case ErrorType.NETWORK_ERROR:
        return 503;
      default:
        return 500;
    }
  }
  
  private static createErrorResponse(error: BaseError): ErrorResponse {
    return {
      error: {
        message: this.getUserFriendlyMessage(error),
        code: error.code,
        type: error.type,
        requestId: error.context.requestId || 'unknown',
        timestamp: error.context.timestamp.toISOString(),
        details: error.severity === ErrorSeverity.LOW ? error.context.metadata : undefined
      }
    };
  }
  
  private static getUserFriendlyMessage(error: BaseError): string {
    const friendlyMessages: Record<string, string> = {
      [ErrorType.VALIDATION_ERROR]: 'Girilen bilgiler geçersiz',
      [ErrorType.AUTHENTICATION_ERROR]: 'Giriş yapmanız gerekiyor',
      [ErrorType.AUTHORIZATION_ERROR]: 'Bu işlem için yetkiniz bulunmuyor',
      [ErrorType.DATABASE_ERROR]: 'Veritabanı hatası oluştu',
      [ErrorType.NETWORK_ERROR]: 'Bağlantı hatası oluştu',
      [ErrorType.AI_SERVICE_ERROR]: 'AI servisi geçici olarak kullanılamıyor',
      [ErrorType.FIREBASE_ERROR]: 'Servis geçici olarak kullanılamıyor'
    };
    
    return friendlyMessages[error.type] || 'Beklenmeyen bir hata oluştu';
  }
  
  private static logError(error: BaseError): void {
    this.logger.error('Error occurred', {
      error: error.toJSON(),
      severity: error.severity
    });
  }
  
  private static reportErrorToService(error: BaseError): void {
    // Report to external error tracking service (Sentry, Bugsnag, etc.)
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      console.error('Critical error reported:', error.toJSON());
      // Send to external service
    }
  }
  
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Centralized Logging System

### Logger Implementation
```typescript
// src/utils/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  metadata?: Record<string, any>;
  userId?: string;
  requestId?: string;
  environment: string;
  version: string;
}

export class Logger {
  private component: string;
  private static minLevel: LogLevel = LogLevel.INFO;
  private static logQueue: LogEntry[] = [];
  private static batchSize = 10;
  private static flushInterval = 5000; // 5 seconds
  
  constructor(component: string) {
    this.component = component;
    
    // Start batch flushing
    if (typeof window === 'undefined') { // Server-side only
      this.startBatchFlushing();
    }
  }
  
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }
  
  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }
  
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }
  
  error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, metadata);
  }
  
  fatal(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.FATAL, message, metadata);
    
    // Immediate flush for fatal errors
    this.flushLogs();
  }
  
  /**
   * Activity-specific logging
   */
  logActivity(action: string, userId: string, metadata?: Record<string, any>): void {
    this.info(`Activity: ${action}`, {
      ...metadata,
      userId,
      category: 'user_activity'
    });
  }
  
  /**
   * Performance logging
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, `Performance: ${operation}`, {
      ...metadata,
      duration,
      category: 'performance'
    });
  }
  
  /**
   * Security event logging
   */
  logSecurity(event: string, userId?: string, metadata?: Record<string, any>): void {
    this.warn(`Security: ${event}`, {
      ...metadata,
      userId,
      category: 'security'
    });
  }
  
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (level < Logger.minLevel) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      metadata,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    };
    
    // Add request context if available
    this.enrichWithContext(entry);
    
    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      this.consoleOutput(entry);
    }
    
    // Queue for batch processing
    Logger.logQueue.push(entry);
    
    // Immediate flush for high-priority logs
    if (level >= LogLevel.ERROR) {
      this.flushLogs();
    }
  }
  
  private enrichWithContext(entry: LogEntry): void {
    // Add request ID from async local storage or context
    // Implementation depends on your async context strategy
    
    // Try to get user ID from current context
    try {
      const context = this.getCurrentContext();
      if (context) {
        entry.userId = context.userId;
        entry.requestId = context.requestId;
      }
    } catch {
      // Context not available
    }
  }
  
  private getCurrentContext(): any {
    // Implementation for getting current request context
    // Could use async_hooks or similar
    return null;
  }
  
  private consoleOutput(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const levelColors = ['\x1b[36m', '\x1b[32m', '\x1b[33m', '\x1b[31m', '\x1b[35m'];
    const resetColor = '\x1b[0m';
    
    const color = levelColors[entry.level] || '';
    const level = levelNames[entry.level] || 'UNKNOWN';
    
    console.log(
      `${color}[${entry.timestamp}] ${level} [${entry.component}] ${entry.message}${resetColor}`,
      entry.metadata ? JSON.stringify(entry.metadata, null, 2) : ''
    );
  }
  
  private startBatchFlushing(): void {
    setInterval(() => {
      if (Logger.logQueue.length > 0) {
        this.flushLogs();
      }
    }, Logger.flushInterval);
  }
  
  private async flushLogs(): Promise<void> {
    if (Logger.logQueue.length === 0) return;
    
    const logsToFlush = Logger.logQueue.splice(0, Logger.batchSize);
    
    try {
      await this.sendToLoggingService(logsToFlush);
    } catch (error) {
      // If sending fails, put logs back in queue
      Logger.logQueue.unshift(...logsToFlush);
      console.error('Failed to send logs:', error);
    }
  }
  
  private async sendToLoggingService(logs: LogEntry[]): Promise<void> {
    // Send to external logging service (Google Cloud Logging, etc.)
    if (typeof window === 'undefined') {
      // Server-side: send to Google Cloud Logging
      await this.sendToCloudLogging(logs);
    } else {
      // Client-side: send to analytics or logging endpoint
      await this.sendToAnalytics(logs);
    }
  }
  
  private async sendToCloudLogging(logs: LogEntry[]): Promise<void> {
    // Google Cloud Logging implementation
    console.log(`Sending ${logs.length} logs to Cloud Logging`);
    
    // Implementation for Cloud Logging API
    // Use @google-cloud/logging library
  }
  
  private async sendToAnalytics(logs: LogEntry[]): Promise<void> {
    // Client-side analytics implementation
    logs.forEach(log => {
      if (window.gtag) {
        window.gtag('event', 'log_entry', {
          level: LogLevel[log.level],
          component: log.component,
          message: log.message
        });
      }
    });
  }
  
  /**
   * Configure logger settings
   */
  static configure(options: {
    minLevel?: LogLevel;
    batchSize?: number;
    flushInterval?: number;
  }): void {
    if (options.minLevel !== undefined) Logger.minLevel = options.minLevel;
    if (options.batchSize !== undefined) Logger.batchSize = options.batchSize;
    if (options.flushInterval !== undefined) Logger.flushInterval = options.flushInterval;
  }
}
```

## Client-Side Error Boundary

### React Error Boundary
```typescript
// src/components/ErrorBoundary.vue
<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-container">
      <h2>{{ $t('error.unexpected_error') }}</h2>
      <p>{{ $t('error.description') }}</p>
      
      <details v-if="showDetails" class="error-details">
        <summary>{{ $t('error.technical_details') }}</summary>
        <pre>{{ errorInfo }}</pre>
      </details>
      
      <div class="error-actions">
        <button @click="retry" class="btn-primary">
          {{ $t('error.retry') }}
        </button>
        <button @click="reportError" class="btn-secondary">
          {{ $t('error.report') }}
        </button>
        <button @click="showDetails = !showDetails" class="btn-link">
          {{ showDetails ? $t('error.hide_details') : $t('error.show_details') }}
        </button>
      </div>
    </div>
  </div>
  
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';

interface Props {
  fallback?: () => void;
  onError?: (error: Error) => void;
}

const props = withDefaults(defineProps<Props>(), {
  fallback: () => {},
  onError: () => {}
});

const hasError = ref(false);
const errorInfo = ref('');
const showDetails = ref(false);
const logger = new Logger('ErrorBoundary');

onErrorCaptured((error: Error, instance, info) => {
  hasError.value = true;
  errorInfo.value = `${error.message}\n\nStack: ${error.stack}\n\nComponent: ${info}`;
  
  // Log error
  logger.error('Component error captured', {
    error: error.message,
    stack: error.stack,
    componentInfo: info,
    url: window.location.href,
    userAgent: navigator.userAgent
  });
  
  // Report to error tracking service
  ErrorHandler.handleClientError(error, {
    component: 'vue-error-boundary',
    action: 'component-error',
    metadata: { componentInfo: info }
  });
  
  // Call parent error handler
  props.onError(error);
  
  return false; // Prevent error from propagating
});

const retry = () => {
  hasError.value = false;
  errorInfo.value = '';
  showDetails.value = false;
  
  // Try to reload the page as last resort
  window.location.reload();
};

const reportError = () => {
  // Send detailed error report
  const errorReport = {
    message: errorInfo.value,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    userId: 'current-user-id' // Get from auth context
  };
  
  // Send to support system
  logger.error('User reported error', errorReport);
  
  // Show confirmation
  alert('Error raporu gönderildi. Teşekkürler!');
};
</script>

<style scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-container {
  max-width: 600px;
  text-align: center;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
}

.error-details {
  margin: 1rem 0;
  text-align: left;
}

.error-details pre {
  background: #f1f3f4;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
}

.error-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary, .btn-link {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-link {
  background: transparent;
  color: #007bff;
  text-decoration: underline;
}
</style>
```

## Retry Mechanisms

### Intelligent Retry Logic
```typescript
// src/utils/retry-handler.ts
export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export class RetryHandler {
  private static defaultOptions: RetryOptions = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryCondition: (error) => {
      // Retry on network errors and temporary failures
      return error.message.includes('network') || 
             error.message.includes('timeout') ||
             error.message.includes('503') ||
             error.message.includes('502');
    }
  };
  
  /**
   * Execute with exponential backoff retry
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error;
    
    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (!opts.retryCondition!(lastError) || attempt === opts.maxAttempts) {
          throw lastError;
        }
        
        // Call retry callback
        opts.onRetry?.(attempt, lastError);
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1),
          opts.maxDelay
        );
        
        await this.delay(delay);
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Database operation with retry
   */
  static async retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const logger = new Logger('RetryHandler');
    
    return this.executeWithRetry(operation, {
      maxAttempts: 5,
      baseDelay: 500,
      retryCondition: (error) => {
        // Retry on connection errors, timeouts, rate limits
        const retryableErrors = [
          'connection', 'timeout', 'rate limit', 'unavailable',
          'deadline exceeded', 'resource exhausted'
        ];
        
        return retryableErrors.some(pattern => 
          error.message.toLowerCase().includes(pattern)
        );
      },
      onRetry: (attempt, error) => {
        logger.warn(`Database operation retry`, {
          operation: operationName,
          attempt,
          error: error.message,
          nextRetryIn: Math.min(500 * Math.pow(2, attempt - 1), 10000)
        });
      }
    });
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage examples
export const databaseService = {
  async getUserData(userId: string) {
    return RetryHandler.retryDatabaseOperation(
      () => db.collection('users').doc(userId).get(),
      'getUserData'
    );
  },
  
  async saveUserActivity(userId: string, activity: any) {
    return RetryHandler.executeWithRetry(
      () => db.collection('users').doc(userId).collection('activities').add(activity),
      {
        maxAttempts: 3,
        onRetry: (attempt, error) => {
          console.warn(`Save activity retry ${attempt}: ${error.message}`);
        }
      }
    );
  }
};
```

Bu error handling ve logging sistemi ile robust, maintainable ve debug edilebilir bir uygulama geliştirebilirsiniz.
