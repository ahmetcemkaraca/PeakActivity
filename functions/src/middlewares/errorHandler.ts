import { Request, Response, NextFunction } from 'express';
import {
  CustomError,
  InternalServerError,
  API_ERROR_CODES,
  HTTP_STATUS_CODE_MAP,
} from '../utils/api-error-codes';
import { errorResponse } from '../utils/api-response-formats';

/**
 * Merkezi hata işleme middleware'i.
 * Tüm fırlatılan hataları yakalar ve standart bir API hata yanıtı formatına dönüştürür.
 * @param err Yakalanan hata nesnesi.
 * @param req Express Request nesnesi.
 * @param res Express Response nesnesi.
 * @param next Bir sonraki middleware fonksiyonu.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('API Hata Yakalandı:', err);

  let errorToRespond: CustomError;

  if (err instanceof CustomError) {
    errorToRespond = err;
  } else if (err instanceof Error) {
    // Bilinmeyen hatalar için genel InternalServerError kullan
    errorToRespond = new InternalServerError(err.message, { originalError: err.message });
  } else {
    // Hiçbir hata sınıfına uymayan durumlar için
    errorToRespond = new InternalServerError('Bilinmeyen bir sunucu hatası oluştu.', {
      originalError: err,
    });
  }

  const httpStatus = errorToRespond.httpStatus || HTTP_STATUS_CODE_MAP[errorToRespond.code] || 500;

  res
    .status(httpStatus)
    .json(errorResponse(errorToRespond.code, errorToRespond.message, errorToRespond.details));
};
