import * as functions from 'firebase-functions';
import { CallableContext } from 'firebase-functions/v1/https';
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { API_ERROR_CODES, CustomError } from '../utils/api-error-codes';

interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken;
}

// Callable Functions için kimlik doğrulama zorunluluğu
export const requireAuth = (handler: Function) => {
    return async (data: any, context: CallableContext) => {
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'The function must be called while authenticated.'
            );
        }
        return handler(data, context);
    };
};

// Express.js middleware'i için kimlik doğrulama zorunluluğu
export const requireAuthMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.path.startsWith('/api/public')) {
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(
            new CustomError(
                API_ERROR_CODES.COMMON.UNAUTHORIZED,
                'Yetkilendirme başlığı eksik veya geçersiz.',
                null,
                401
            )
        );
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error: any) {
        console.error('Kimlik doğrulama hatası:', error);
        return next(
            new CustomError(
                API_ERROR_CODES.COMMON.UNAUTHORIZED,
                'Geçersiz veya süresi dolmuş token.',
                null,
                401
            )
        );
    }
};

// Abonelik seviyesi kontrolü middleware'i
export const requireSubscription = (requiredLevel: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(
                new CustomError(
                    API_ERROR_CODES.COMMON.FORBIDDEN,
                    'Abonelik kontrolü için kimlik doğrulanmış kullanıcı gerekli.',
                    null,
                    403
                )
            );
        }

        const userSubscriptionLevel = (req.user.customClaims as any)?.subscriptionLevel || 'free'; // Varsayılan: free

        // Basit bir kontrol: istenen seviye kullanıcının seviyesinden düşük veya eşit olmalı
        // Gerçek dünyada daha karmaşık bir seviye hiyerarşisi olabilir (örn. 'premium' > 'standard' > 'free')
        const subscriptionLevels: { [key: string]: number } = {
            'free': 0,
            'standard': 1,
            'premium': 2,
        };

        if (subscriptionLevels[userSubscriptionLevel] < subscriptionLevels[requiredLevel]) {
            return next(
                new CustomError(
                    API_ERROR_CODES.COMMON.FORBIDDEN,
                    `Bu özelliğe erişmek için en az ${requiredLevel} abonelik seviyesi gereklidir. Mevcut seviyeniz: ${userSubscriptionLevel}.`,
                    null,
                    403
                )
            );
        }

        next();
    };
}; 