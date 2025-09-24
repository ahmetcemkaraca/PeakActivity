export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status: 'success' | 'error';
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ErrorResponse {
  error: ApiError;
  status: 'error';
  timestamp: string;
}

export function successResponse<T>(
  data?: T,
  message: string = 'İşlem başarıyla tamamlandı.'
): ApiResponse<T> {
  return {
    data,
    message,
    status: 'success',
    timestamp: new Date().toISOString(),
  };
}

export function errorResponse(code: string, message: string, details?: any): ErrorResponse {
  return {
    error: {
      code,
      message,
      details,
    },
    status: 'error',
    timestamp: new Date().toISOString(),
  };
}
