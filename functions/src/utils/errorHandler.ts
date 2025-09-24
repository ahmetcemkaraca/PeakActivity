/**
 * Firebase Functions Exception Handling Utilities
 *
 * Bu modül, Firebase Functions'da tutarlı exception handling sağlar.
 * Spesifik error türleri tanımlar ve merkezi error handling mekanizmaları sunar.
 */

import { logger } from 'firebase-functions';
import { https } from 'firebase-functions/v1';

/**
 * Custom Error Types for Firebase Functions
 */
export class PeakActivityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'PeakActivityError';
  }
}

export class ValidationError extends PeakActivityError {
  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', 400, { field, value });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends PeakActivityError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_REQUIRED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends PeakActivityError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'INSUFFICIENT_PERMISSIONS', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends PeakActivityError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, { resource });
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends PeakActivityError {
  constructor(message: string, conflictingResource?: string) {
    super(message, 'CONFLICT', 409, { conflictingResource });
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends PeakActivityError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends PeakActivityError {
  constructor(service: string, originalError?: any) {
    super(`External service error: ${service}`, 'EXTERNAL_SERVICE_ERROR', 502, {
      service,
      originalError: originalError?.message || originalError,
    });
    this.name = 'ExternalServiceError';
  }
}

export class FirestoreError extends PeakActivityError {
  constructor(operation: string, originalError?: any) {
    super(`Firestore operation failed: ${operation}`, 'FIRESTORE_ERROR', 500, {
      operation,
      originalError: originalError?.message || originalError,
    });
    this.name = 'FirestoreError';
  }
}

/**
 * Error Handler Middleware
 */
export function handleError(error: any, context?: string): never {
  const contextStr = context ? ` in ${context}` : '';

  if (error instanceof PeakActivityError) {
    logger.error(`PeakActivity error${contextStr}:`, {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
    });
    throw new https.HttpsError(mapToFirebaseErrorCode(error.code), error.message, error.details);
  }

  // Firebase Admin SDK errors
  if (error.code && error.code.startsWith('firestore/')) {
    logger.error(`Firestore error${contextStr}:`, error);
    throw new https.HttpsError('internal', 'Database operation failed', {
      code: error.code,
    });
  }

  // Network/HTTP errors
  if (error.code && (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED')) {
    logger.error(`Network error${contextStr}:`, error);
    throw new https.HttpsError('unavailable', 'External service unavailable', {
      code: error.code,
    });
  }

  // Unknown errors
  logger.error(`Unexpected error${contextStr}:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
  });

  throw new https.HttpsError('internal', 'An unexpected error occurred');
}

/**
 * Maps custom error codes to Firebase error codes
 */
function mapToFirebaseErrorCode(code: string): https.FunctionsErrorCode {
  const mapping: Record<string, https.FunctionsErrorCode> = {
    VALIDATION_ERROR: 'invalid-argument',
    AUTH_REQUIRED: 'unauthenticated',
    INSUFFICIENT_PERMISSIONS: 'permission-denied',
    NOT_FOUND: 'not-found',
    CONFLICT: 'already-exists',
    RATE_LIMIT_EXCEEDED: 'resource-exhausted',
    EXTERNAL_SERVICE_ERROR: 'unavailable',
    FIRESTORE_ERROR: 'internal',
  };

  return mapping[code] || 'internal';
}

/**
 * Safe async wrapper with automatic error handling
 */
export function safeAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string,
  defaultValue?: R
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (defaultValue !== undefined) {
        logger.warn(
          `Function ${fn.name} failed${context ? ` in ${context}` : ''}, returning default value:`,
          error
        );
        return defaultValue;
      }
      handleError(error, context || fn.name);
    }
  };
}

/**
 * Safe sync wrapper with automatic error handling
 */
export function safe<T extends any[], R>(
  fn: (...args: T) => R,
  context?: string,
  defaultValue?: R
) {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      if (defaultValue !== undefined) {
        logger.warn(
          `Function ${fn.name} failed${context ? ` in ${context}` : ''}, returning default value:`,
          error
        );
        return defaultValue;
      }
      handleError(error, context || fn.name);
    }
  };
}

/**
 * Retry wrapper with exponential backoff
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          break;
        }

        // Don't retry on authentication or validation errors
        if (
          error instanceof AuthenticationError ||
          error instanceof ValidationError ||
          error instanceof AuthorizationError
        ) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(
          `Attempt ${attempt}/${maxAttempts} failed${context ? ` in ${context}` : ''}, retrying in ${delay}ms:`,
          error
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    handleError(lastError, context);
  };
}

/**
 * Validation helper
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName, value);
  }
}

export function validateType(value: any, expectedType: string, fieldName: string): void {
  if (typeof value !== expectedType) {
    throw new ValidationError(`${fieldName} must be of type ${expectedType}`, fieldName, {
      actualType: typeof value,
      expectedType,
    });
  }
}

export function validateEmail(email: string, fieldName: string = 'email'): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError(`${fieldName} must be a valid email address`, fieldName, email);
  }
}
