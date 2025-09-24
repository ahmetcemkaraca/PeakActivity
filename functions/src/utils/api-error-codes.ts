export const API_ERROR_CODES = {
  COMMON: {
    UNKNOWN_ERROR: 'COMMON_UNKNOWN_ERROR',
    INVALID_ARGUMENT: 'COMMON_INVALID_ARGUMENT',
    RESOURCE_NOT_FOUND: 'COMMON_RESOURCE_NOT_FOUND',
    UNAUTHORIZED: 'COMMON_UNAUTHORIZED',
    FORBIDDEN: 'COMMON_FORBIDDEN',
    INTERNAL_SERVER_ERROR: 'COMMON_INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'COMMON_SERVICE_UNAVAILABLE',
  },
  AUTH: {
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    USER_DISABLED: 'AUTH_USER_DISABLED',
    EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
    PHONE_NUMBER_ALREADY_EXISTS: 'AUTH_PHONE_NUMBER_ALREADY_EXISTS',
  },
  FIRESTORE: {
    TRANSACTION_FAILED: 'FIRESTORE_TRANSACTION_FAILED',
    DOCUMENT_NOT_FOUND: 'FIRESTORE_DOCUMENT_NOT_FOUND',
  },
  // Diğer servisler için hata kodları buraya eklenebilir
};

export const HTTP_STATUS_CODE_MAP: { [key: string]: number } = {
  [API_ERROR_CODES.COMMON.INVALID_ARGUMENT]: 400,
  [API_ERROR_CODES.COMMON.RESOURCE_NOT_FOUND]: 404,
  [API_ERROR_CODES.COMMON.UNAUTHORIZED]: 401,
  [API_ERROR_CODES.COMMON.FORBIDDEN]: 403,
  [API_ERROR_CODES.COMMON.INTERNAL_SERVER_ERROR]: 500,
  [API_ERROR_CODES.COMMON.SERVICE_UNAVAILABLE]: 503,
  [API_ERROR_CODES.AUTH.INVALID_CREDENTIALS]: 401,
  [API_ERROR_CODES.AUTH.USER_DISABLED]: 403,
  [API_ERROR_CODES.AUTH.EMAIL_ALREADY_EXISTS]: 409, // Conflict
  [API_ERROR_CODES.AUTH.PHONE_NUMBER_ALREADY_EXISTS]: 409, // Conflict
  [API_ERROR_CODES.FIRESTORE.DOCUMENT_NOT_FOUND]: 404,
  [API_ERROR_CODES.FIRESTORE.TRANSACTION_FAILED]: 500,
  [API_ERROR_CODES.COMMON.UNKNOWN_ERROR]: 500,
};

export class CustomError extends Error {
  public code: string;
  public details?: any;
  public httpStatus: number;

  constructor(code: string, message: string, details?: any, httpStatus?: number) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.details = details;
    this.httpStatus = httpStatus || HTTP_STATUS_CODE_MAP[code] || 500;

    // Prototype zincirini doğru şekilde ayarlayın
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class InvalidArgumentError extends CustomError {
  constructor(message: string = 'Geçersiz argümanlar sağlandı.', details?: any) {
    super(API_ERROR_CODES.COMMON.INVALID_ARGUMENT, message, details, 400);
    this.name = 'InvalidArgumentError';
    Object.setPrototypeOf(this, InvalidArgumentError.prototype);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Kaynak bulunamadı.', details?: any) {
    super(API_ERROR_CODES.COMMON.RESOURCE_NOT_FOUND, message, details, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'Yetkilendirme başarısız oldu.', details?: any) {
    super(API_ERROR_CODES.COMMON.UNAUTHORIZED, message, details, 401);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Bu eylemi gerçekleştirmeye izniniz yok.', details?: any) {
    super(API_ERROR_CODES.COMMON.FORBIDDEN, message, details, 403);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = 'Sunucu tarafında beklenmeyen bir hata oluştu.', details?: any) {
    super(API_ERROR_CODES.COMMON.INTERNAL_SERVER_ERROR, message, details, 500);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
