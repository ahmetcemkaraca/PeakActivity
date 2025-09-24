/**
 * Safe Access Utilities
 *
 * Bu dosya null/undefined güvenli erişim yardımcıları içerir.
 * Tüm optional chaining ve null check'leri burada merkezi olarak yönetilir.
 */

/**
 * Safely access object property
 */
export function safeAccess<T, K extends keyof T>(
  obj: T | null | undefined,
  key: K
): T[K] | undefined {
  return obj?.[key];
}

/**
 * Safely access nested object properties using dot notation
 */
export function safeDeepAccess<T>(obj: unknown, path: string, defaultValue?: T): T | undefined {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  try {
    const result = path.split('.').reduce((current: unknown, key: string): unknown => {
      return current && typeof current === 'object' && current !== null && key in current
        ? (current as Record<string, unknown>)[key]
        : undefined;
    }, obj);

    return (result as T) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Type guard to check if value is not null or undefined
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if value is not null, undefined, or empty string
 */
export function isNotEmpty<T>(value: T | null | undefined | ''): value is T {
  return value !== null && value !== undefined && value !== '';
}

/**
 * Safely get array element at index
 */
export function safeArrayAccess<T>(array: T[] | null | undefined, index: number): T | undefined {
  if (!Array.isArray(array) || index < 0 || index >= array.length) {
    return undefined;
  }
  return array[index];
}

/**
 * Safely get first element of array
 */
export function safeFirst<T>(array: T[] | null | undefined): T | undefined {
  return safeArrayAccess(array, 0);
}

/**
 * Safely get last element of array
 */
export function safeLast<T>(array: T[] | null | undefined): T | undefined {
  if (!Array.isArray(array) || array.length === 0) {
    return undefined;
  }
  return array[array.length - 1];
}

/**
 * Safely parse JSON string
 */
export function safeJsonParse<T>(json: string | null | undefined, defaultValue?: T): T | undefined {
  if (typeof json !== 'string') {
    return defaultValue;
  }

  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely stringify JSON
 */
export function safeJsonStringify(obj: unknown, defaultValue: string = '{}'): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return defaultValue;
  }
}

/**
 * Safely convert to number
 */
export function safeNumber(value: unknown, defaultValue?: number): number | undefined {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
}

/**
 * Safely convert to string
 */
export function safeString(value: unknown, defaultValue?: string): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return defaultValue;
  }

  try {
    return String(value);
  } catch {
    return defaultValue;
  }
}

/**
 * Safely convert to boolean
 */
export function safeBoolean(value: unknown, defaultValue?: boolean): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }

  if (typeof value === 'number') {
    return Boolean(value);
  }

  return defaultValue;
}

/**
 * Safely execute a function and return result or default value
 */
export function safeTry<T>(fn: () => T, defaultValue?: T): T | undefined {
  try {
    return fn();
  } catch {
    return defaultValue;
  }
}

/**
 * Safely execute async function with timeout
 */
export async function safeAsyncTry<T>(
  fn: () => Promise<T>,
  timeoutMs?: number,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    if (timeoutMs) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), timeoutMs);
      });

      return await Promise.race([fn(), timeoutPromise]);
    } else {
      return await fn();
    }
  } catch {
    return defaultValue;
  }
}

/**
 * Check if object has property safely
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

/**
 * Safely filter array removing null/undefined values
 */
export function filterDefined<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(isNotNull);
}

/**
 * Safely map array with null protection
 */
export function safeMap<T, U>(
  array: T[] | null | undefined,
  mapper: (item: T, index: number) => U
): U[] {
  if (!Array.isArray(array)) {
    return [];
  }

  try {
    return array.map(mapper);
  } catch {
    return [];
  }
}

/**
 * Safely reduce array with null protection
 */
export function safeReduce<T, U>(
  array: T[] | null | undefined,
  reducer: (acc: U, current: T, index: number) => U,
  initialValue: U
): U {
  if (!Array.isArray(array)) {
    return initialValue;
  }

  try {
    return array.reduce(reducer, initialValue);
  } catch {
    return initialValue;
  }
}

/**
 * Create a safe object merger
 */
export function safeMerge<T extends object>(
  target: T | null | undefined,
  source: Partial<T> | null | undefined
): T {
  if (!target || typeof target !== 'object') {
    return (source as T) || ({} as T);
  }

  if (!source || typeof source !== 'object') {
    return target;
  }

  try {
    return { ...target, ...source };
  } catch {
    return target;
  }
}

/**
 * Type assertion with runtime check
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  errorMessage?: string
): T {
  if (guard(value)) {
    return value;
  }
  throw new TypeError(errorMessage || 'Type assertion failed');
}

/**
 * Optional type assertion - returns undefined instead of throwing
 */
export function optionalAssertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T
): T | undefined {
  try {
    return assertType(value, guard);
  } catch {
    return undefined;
  }
}
