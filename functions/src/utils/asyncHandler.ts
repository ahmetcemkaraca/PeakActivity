import { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Async Express route handler'ları için bir wrapper fonksiyonudur.
 * Asenkron bir fonksiyonda meydana gelen herhangi bir hatayı yakalar
 * ve Express'in hata işleme middleware'ine (next fonk.) iletir.
 * Bu, try-catch bloklarının her rotada tekrarını önler.
 * @param fn Asenkron Express rota işleyici fonksiyonu.
 * @returns Hataları yakalayan ve next() çağrısıyla ileten bir Express rota işleyici.
 */
export const asyncHandler =
  (fn: AsyncFunction) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
