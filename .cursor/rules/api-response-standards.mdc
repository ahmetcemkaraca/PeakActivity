# API Yanıt ve Hata Mesajı Standartları

Bu belge, PeakActivity projesindeki tüm Firebase Cloud Functions API uç noktaları için standart yanıt ve hata mesajı formatlarını tanımlar. Amacımız, tutarlı, tahmin edilebilir ve kolayca tüketilebilir bir API sağlamaktır.

## 1. Başarı Yanıtları

Tüm başarılı API yanıtları aşağıdaki `ApiResponse` formatına uygun olmalıdır:

```typescript
export interface ApiResponse<T> {
  data?: T;          // İşlem sonucu dönen veri (opsiyonel)
  message?: string;  // Başarı mesajı (opsiyonel, varsayılan değer kullanılabilir)
  status: 'success'; // İşlem durumu
  timestamp: string; // İşlemin gerçekleştiği zaman damgası (ISO 8601 formatında)
}

// Yardımcı Fonksiyon:
export function successResponse<T>(data?: T, message: string = 'İşlem başarıyla tamamlandı.'): ApiResponse<T> {
  // ... implementasyon ...
}
```

**Örnek Başarı Yanıtı:**

```json
{
  "data": {
    "userId": "some-user-id",
    "email": "user@example.com"
  },
  "message": "Kullanıcı bilgileri başarıyla getirildi.",
  "status": "success",
  "timestamp": "2025-07-13T10:30:00.000Z"
}
```

## 2. Hata Yanıtları

Tüm API hata yanıtları aşağıdaki `ErrorResponse` formatına uygun olmalıdır:

```typescript
export interface ApiError {
  code: string;    // Uygulama içi benzersiz hata kodu
  message: string; // Hatanın kullanıcıya gösterilebilecek kısa açıklaması
  details?: any;   // Hata hakkında ek detaylar (örn. validasyon hataları için alan bazlı mesajlar)
}

export interface ErrorResponse {
  error: ApiError;     // Hata detaylarını içeren nesne
  status: 'error';     // İşlem durumu
  timestamp: string;   // Hatanın gerçekleştiği zaman damgası (ISO 8601 formatında)
}

// Yardımcı Fonksiyon:
export function errorResponse(code: string, message: string, details?: any): ErrorResponse {
  // ... implementasyon ...
}
```

**Örnek Hata Yanıtı:**

```json
{
  "error": {
    "code": "COMMON_INVALID_ARGUMENT",
    "message": "Sağlanan URL formatı geçersiz.",
    "details": {
      "field": "url",
      "value": "invalid-url-string"
    }
  },
  "status": "error",
  "timestamp": "2025-07-13T10:35:00.000Z"
}
```

## 3. Hata Kodları ve HTTP Durum Kodu Eşleşmeleri

Hatalar için özel olarak tanımlanmış uygulama içi hata kodları (`API_ERROR_CODES`) kullanılmalıdır. Bu kodlar, HTTP durum kodlarıyla aşağıdaki gibi eşleştirilmelidir:

```typescript
export const API_ERROR_CODES = {
  COMMON: {
    UNKNOWN_ERROR: "COMMON_UNKNOWN_ERROR",             // Genel bilinmeyen hata
    INVALID_ARGUMENT: "COMMON_INVALID_ARGUMENT",       // Geçersiz giriş argümanı (HTTP 400 Bad Request)
    RESOURCE_NOT_FOUND: "COMMON_RESOURCE_NOT_FOUND",   // Kaynak bulunamadı (HTTP 404 Not Found)
    UNAUTHORIZED: "COMMON_UNAUTHORIZED",             // Kimlik doğrulama başarısız (HTTP 401 Unauthorized)
    FORBIDDEN: "COMMON_FORBIDDEN",                 // Yetkilendirme başarısız (HTTP 403 Forbidden)
    INTERNAL_SERVER_ERROR: "COMMON_INTERNAL_SERVER_ERROR", // Sunucu iç hatası (HTTP 500 Internal Server Error)
    SERVICE_UNAVAILABLE: "COMMON_SERVICE_UNAVAILABLE",   // Servis kullanılamıyor (HTTP 503 Service Unavailable)
  },
  AUTH: {
    INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",     // Geçersiz kimlik bilgileri (HTTP 401 Unauthorized)
    USER_DISABLED: "AUTH_USER_DISABLED",             // Kullanıcı devre dışı (HTTP 403 Forbidden)
    EMAIL_ALREADY_EXISTS: "AUTH_EMAIL_ALREADY_EXISTS",   // E-posta zaten kayıtlı (HTTP 409 Conflict)
    PHONE_NUMBER_ALREADY_EXISTS: "AUTH_PHONE_NUMBER_ALREADY_EXISTS", // Telefon numarası zaten kayıtlı (HTTP 409 Conflict)
  },
  FIRESTORE: {
    TRANSACTION_FAILED: "FIRESTORE_TRANSACTION_FAILED", // Firestore işlem hatası (HTTP 500 Internal Server Error)
    DOCUMENT_NOT_FOUND: "FIRESTORE_DOCUMENT_NOT_FOUND", // Firestore belge bulunamadı (HTTP 404 Not Found)
  },
  // Diğer servisler/modüller için hata kodları buraya eklenebilir.
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
  [API_ERROR_CODES.AUTH.EMAIL_ALREADY_EXISTS]: 409,
  [API_ERROR_CODES.AUTH.PHONE_NUMBER_ALREADY_EXISTS]: 409,
  [API_ERROR_CODES.FIRESTORE.DOCUMENT_NOT_FOUND]: 404,
  [API_ERROR_CODES.FIRESTORE.TRANSACTION_FAILED]: 500,
  [API_ERROR_CODES.COMMON.UNKNOWN_ERROR]: 500,
};
```

## 4. Özel Hata Sınıfları

Uygulama içinde daha okunabilir ve yönetilebilir hata fırlatmak için `CustomError` temel sınıfından türetilmiş özel hata sınıfları kullanılmalıdır. Bu sınıflar, uygun `API_ERROR_CODES` ve HTTP durum kodlarıyla ilişkilendirilmiştir.

```typescript
// functions/src/utils/api-error-codes.ts dosyasından alınmıştır.

export class CustomError extends Error {
  public code: string;
  public details?: any;
  public httpStatus: number;

  constructor(code: string, message: string, details?: any, httpStatus?: number) {
    // ... implementasyon ...
  }
}

export class InvalidArgumentError extends CustomError {
  constructor(message: string = "Geçersiz argümanlar sağlandı.", details?: any) {
    super(API_ERROR_CODES.COMMON.INVALID_ARGUMENT, message, details, 400);
    // ... implementasyon ...
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = "Kaynak bulunamadı.", details?: any) {
    super(API_ERROR_CODES.COMMON.RESOURCE_NOT_FOUND, message, details, 404);
    // ... implementasyon ...
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = "Yetkilendirme başarısız oldu.", details?: any) {
    super(API_ERROR_CODES.COMMON.UNAUTHORIZED, message, details, 401);
    // ... implementasyon ...
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = "Bu eylemi gerçekleştirmeye izniniz yok.", details?: any) {
    super(API_ERROR_CODES.COMMON.FORBIDDEN, message, details, 403);
    // ... implementasyon ...
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = "Sunucu tarafında beklenmeyen bir hata oluştu.", details?: any) {
    super(API_ERROR_CODES.COMMON.INTERNAL_SERVER_ERROR, message, details, 500);
    // ... implementasyon ...
  }
}
```

## 5. Uygulama Talimatları

*   Tüm API uç noktaları, başarılı yanıtlar için `successResponse` ve hatalı yanıtlar için `errorResponse` yardımcı fonksiyonlarını kullanmalıdır.
*   Hata durumlarında uygun `CustomError` sınıfını fırlatılmalıdır. Merkezi hata işleyici bu hataları yakalayıp standart `ErrorResponse` formatına dönüştürecektir.
*   Yeni hata senaryoları için `API_ERROR_CODES` içine yeni kodlar eklenmeli ve gerekiyorsa `HTTP_STATUS_CODE_MAP` güncellenmelidir.
*   Dış kütüphanelerden veya Firebase SDK'larından kaynaklanan hatalar yakalanmalı ve standart `CustomError` sınıflarına dönüştürülmelidir.

Bu standartlara uyum, API'mizin hem geliştiriciler hem de kullanıcılar için daha öngörülebilir ve güvenilir olmasını sağlayacaktır. 