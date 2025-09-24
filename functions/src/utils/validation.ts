/**
 * Validation Utilities for Firebase Functions
 *
 * Bu dosya Firebase Functions için runtime validation sağlar.
 * Zod schemas ile birlikte tip güvenli validation sistemi.
 */

import { z } from 'zod';
import { https } from 'firebase-functions/v1';

/**
 * Generic request validator using Zod schemas
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new https.HttpsError('invalid-argument', 'Invalid request data', {
      errors: result.error.errors,
      received: data,
    });
  }
  return result.data;
}

/**
 * Validate user authentication context
 */
export function validateAuth(context: { auth?: { uid: string; email?: string } }): {
  uid: string;
  email?: string;
} {
  if (!context.auth) {
    throw new https.HttpsError(
      'unauthenticated',
      'User must be authenticated to access this function'
    );
  }

  if (!context.auth.uid) {
    throw new https.HttpsError('permission-denied', 'Invalid user authentication data');
  }

  return context.auth;
}

/**
 * Validate required fields
 */
export function validateRequired<T>(value: T | null | undefined, fieldName: string): T {
  if (value === undefined || value === null || value === '') {
    throw new https.HttpsError('invalid-argument', `Field '${fieldName}' is required`, {
      field: fieldName,
      value,
    });
  }
  return value;
}

/**
 * Validate field type
 */
export function validateType<T>(value: unknown, expectedType: string, fieldName: string): T {
  const actualType = typeof value;
  if (actualType !== expectedType) {
    throw new https.HttpsError(
      'invalid-argument',
      `Field '${fieldName}' must be of type ${expectedType}, got ${actualType}`,
      { field: fieldName, expectedType, actualType, value }
    );
  }
  return value as T;
}

/**
 * Validate email format
 */
export function validateEmail(email: string, fieldName: string = 'email'): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new https.HttpsError(
      'invalid-argument',
      `Field '${fieldName}' must be a valid email address`,
      { field: fieldName, value: email }
    );
  }
  return email;
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): string {
  if (value.length < minLength || value.length > maxLength) {
    throw new https.HttpsError(
      'invalid-argument',
      `Field '${fieldName}' must be between ${minLength} and ${maxLength} characters`,
      { field: fieldName, value, minLength, maxLength, actualLength: value.length }
    );
  }
  return value;
}

/**
 * Validate array length
 */
export function validateArrayLength<T>(
  array: T[],
  minLength: number,
  maxLength: number,
  fieldName: string
): T[] {
  if (array.length < minLength || array.length > maxLength) {
    throw new https.HttpsError(
      'invalid-argument',
      `Field '${fieldName}' must contain between ${minLength} and ${maxLength} items`,
      { field: fieldName, minLength, maxLength, actualLength: array.length }
    );
  }
  return array;
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): number {
  if (value < min || value > max) {
    throw new https.HttpsError(
      'invalid-argument',
      `Field '${fieldName}' must be between ${min} and ${max}`,
      { field: fieldName, value, min, max }
    );
  }
  return value;
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string
): T {
  if (!allowedValues.includes(value as T)) {
    throw new https.HttpsError(
      'invalid-argument',
      `Field '${fieldName}' must be one of: ${allowedValues.join(', ')}`,
      { field: fieldName, value, allowedValues }
    );
  }
  return value as T;
}

/**
 * Validate date format (ISO string)
 */
export function validateISODate(value: string, fieldName: string): Date {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new https.HttpsError(
      'invalid-argument',
      `Field '${fieldName}' must be a valid ISO date string`,
      { field: fieldName, value }
    );
  }
  return date;
}

/**
 * Validate URL format
 */
export function validateURL(value: string, fieldName: string): string {
  try {
    new URL(value);
    return value;
  } catch {
    throw new https.HttpsError('invalid-argument', `Field '${fieldName}' must be a valid URL`, {
      field: fieldName,
      value,
    });
  }
}

/**
 * Validate object properties
 */
export function validateObjectKeys<T extends Record<string, unknown>>(
  obj: T,
  requiredKeys: (keyof T)[],
  optionalKeys: (keyof T)[] = [],
  fieldName: string = 'object'
): T {
  const objKeys = Object.keys(obj);
  const allowedKeys = [...requiredKeys, ...optionalKeys].map(String);

  // Check for required keys
  for (const key of requiredKeys) {
    if (!(String(key) in obj)) {
      throw new https.HttpsError(
        'invalid-argument',
        `Field '${fieldName}' is missing required property '${String(key)}'`,
        { field: fieldName, missingKey: key, requiredKeys }
      );
    }
  }

  // Check for unexpected keys
  for (const key of objKeys) {
    if (!allowedKeys.includes(key)) {
      throw new https.HttpsError(
        'invalid-argument',
        `Field '${fieldName}' contains unexpected property '${key}'`,
        { field: fieldName, unexpectedKey: key, allowedKeys }
      );
    }
  }

  return obj;
}

/**
 * Validate file size
 */
export function validateFileSize(
  sizeBytes: number,
  maxSizeBytes: number,
  fieldName: string
): number {
  if (sizeBytes > maxSizeBytes) {
    throw new https.HttpsError(
      'invalid-argument',
      `File '${fieldName}' exceeds maximum size of ${formatBytes(maxSizeBytes)}`,
      { field: fieldName, sizeBytes, maxSizeBytes }
    );
  }
  return sizeBytes;
}

/**
 * Validate MIME type
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: string[],
  fieldName: string
): string {
  if (!allowedTypes.includes(mimeType)) {
    throw new https.HttpsError(
      'invalid-argument',
      `File '${fieldName}' must be one of the following types: ${allowedTypes.join(', ')}`,
      { field: fieldName, mimeType, allowedTypes }
    );
  }
  return mimeType;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(params: { page?: number; limit?: number; offset?: number }): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const offset = Math.max(0, params.offset || (page - 1) * limit);

  return { page, limit, offset };
}

/**
 * Validate timezone
 */
export function validateTimezone(timezone: string, fieldName: string = 'timezone'): string {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    throw new https.HttpsError(
      'invalid-argument',
      `Field '${fieldName}' must be a valid timezone`,
      { field: fieldName, value: timezone }
    );
  }
}

/**
 * Validate hex color
 */
export function validateHexColor(color: string, fieldName: string = 'color'): string {
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexColorRegex.test(color)) {
    throw new https.HttpsError(
      'invalid-argument',
      `Field '${fieldName}' must be a valid hex color (e.g., #FF0000)`,
      { field: fieldName, value: color }
    );
  }
  return color;
}

/**
 * Create a middleware function for validation
 */
export function validationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => validateRequest(schema, data);
}

/**
 * Helper function to format bytes
 */
function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Sanitize string input
 */
export function sanitizeString(
  input: string,
  options: {
    maxLength?: number;
    allowedChars?: RegExp;
    trim?: boolean;
    toLowerCase?: boolean;
  } = {}
): string {
  let result = input;

  if (options.trim !== false) {
    result = result.trim();
  }

  if (options.toLowerCase) {
    result = result.toLowerCase();
  }

  if (options.allowedChars) {
    result = result.replace(options.allowedChars, '');
  }

  if (options.maxLength) {
    result = result.substring(0, options.maxLength);
  }

  return result;
}

/**
 * Validate and sanitize user input
 */
export function validateAndSanitizeInput(
  input: unknown,
  rules: {
    type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'date';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: readonly string[];
    sanitize?: boolean;
  },
  fieldName: string
): unknown {
  // Check if required
  if (rules.required && (input === null || input === undefined || input === '')) {
    throw new https.HttpsError('invalid-argument', `Field '${fieldName}' is required`, {
      field: fieldName,
    });
  }

  // Return early if optional and empty
  if (!rules.required && (input === null || input === undefined || input === '')) {
    return input;
  }

  // Type validation and conversion
  switch (rules.type) {
    case 'string':
      const str = validateType<string>(input, 'string', fieldName);
      if (rules.minLength !== undefined || rules.maxLength !== undefined) {
        validateStringLength(str, rules.minLength || 0, rules.maxLength || Infinity, fieldName);
      }
      if (rules.pattern && !rules.pattern.test(str)) {
        throw new https.HttpsError(
          'invalid-argument',
          `Field '${fieldName}' does not match required pattern`,
          { field: fieldName, value: str, pattern: rules.pattern.source }
        );
      }
      if (rules.enum) {
        validateEnum(str, rules.enum, fieldName);
      }
      return rules.sanitize ? sanitizeString(str) : str;

    case 'number':
      const num = validateType<number>(input, 'number', fieldName);
      if (rules.min !== undefined || rules.max !== undefined) {
        validateNumberRange(num, rules.min || -Infinity, rules.max || Infinity, fieldName);
      }
      return num;

    case 'boolean':
      return validateType<boolean>(input, 'boolean', fieldName);

    case 'email':
      const email = validateType<string>(input, 'string', fieldName);
      return validateEmail(email, fieldName);

    case 'url':
      const url = validateType<string>(input, 'string', fieldName);
      return validateURL(url, fieldName);

    case 'date':
      const dateStr = validateType<string>(input, 'string', fieldName);
      return validateISODate(dateStr, fieldName);

    default:
      throw new https.HttpsError('internal', `Unknown validation type: ${rules.type}`, {
        type: rules.type,
      });
  }
}
