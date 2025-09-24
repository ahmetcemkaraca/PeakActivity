import { UserConsent } from "../types/user-consent.d";
import { db } from "../firebaseAdmin"; // Firestore instance'ı
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { FirestoreError, ValidationError, NotFoundError, handleError, validateRequired } from '../utils/errorHandler';

export class UserConsentManager {
    private firestore: admin.firestore.Firestore;

    constructor() {
        this.firestore = db; // functions/src/firebaseAdmin.ts'den alınan global db instance'ı
    }

    /**
     * Kullanıcının rıza tercihlerini kaydeder veya günceller.
     * @param userId Kullanıcının kimliği.
     * @param consentData Kullanıcının rıza verileri.
     * @returns İşlemin başarılı olup olmadığını belirten bir Promise.
     */
    public async saveUserConsent(userId: string, consentData: UserConsent): Promise<boolean> {
        try {
            validateRequired(userId, 'userId');
            validateRequired(consentData, 'consentData');
            
            logger.info(`Saving consent data for user ${userId}`);
            await this.firestore
                .collection("users")
                .doc(userId)
                .collection("settings")
                .doc("consent")
                .set(consentData);
            
            logger.info(`Consent data saved successfully for user ${userId}`);
            return true;
        } catch (error: any) {
            if (error.code?.startsWith('firestore/')) {
                throw new FirestoreError('save user consent', error);
            }
            handleError(error, 'UserConsentManager.saveUserConsent');
        }
    }

    /**
     * Bir kullanıcının rıza tercihlerini alır.
     * @param userId Kullanıcının kimliği.
     * @returns UserConsent nesnesi veya bulunamazsa null.
     */
    public async getUserConsent(userId: string): Promise<UserConsent | null> {
        try {
            validateRequired(userId, 'userId');
            
            logger.info(`Retrieving consent data for user ${userId}`);
            const doc = await this.firestore
                .collection("users")
                .doc(userId)
                .collection("settings")
                .doc("consent")
                .get();
            
            if (doc.exists) {
                const data = doc.data() as UserConsent;
                logger.info(`Consent data found for user ${userId}`);
                return data;
            } else {
                logger.info(`No consent data found for user ${userId}, returning default values`);
                // Varsayılan rıza değerleri döndürülebilir
                return {
                    allowAnonymousSystemData: false,
                    allowAnonymizedUsageData: false,
                    allowSensitivePersonalData: false,
                    lastUpdated: new Date().toISOString(),
                };
            }
        } catch (error: any) {
            if (error.code?.startsWith('firestore/')) {
                throw new FirestoreError('get user consent', error);
            }
            handleError(error, 'UserConsentManager.getUserConsent');
        }
    }

    /**
     * Kullanıcının AI analizi için rızasını günceller.
     * @param userId Kullanıcının kimliği.
     * @param allow AI analizi için yeni rıza durumu.
     * @returns İşlemin başarılı olup olmadığını belirten bir Promise.
     */
    public async updateAIPromptConsent(userId: string, allow: boolean): Promise<boolean> {
        try {
            validateRequired(userId, 'userId');
            if (typeof allow !== 'boolean') {
                throw new ValidationError('allow parameter must be a boolean', 'allow', allow);
            }
            
            logger.info(`Updating AI prompt consent for user ${userId} to ${allow}`);
            
            const currentConsent = await this.getUserConsent(userId);
            if (!currentConsent) {
                logger.warn(`No existing consent found for user ${userId}, creating new consent`);
                return await this.saveUserConsent(userId, {
                    allowAnonymousSystemData: false,
                    allowAnonymizedUsageData: false,
                    allowSensitivePersonalData: allow,
                    lastUpdated: new Date().toISOString(),
                });
            }
            
            currentConsent.allowSensitivePersonalData = allow;
            currentConsent.lastUpdated = new Date().toISOString();
            return await this.saveUserConsent(userId, currentConsent);
        } catch (error: any) {
            if (error.code?.startsWith('firestore/')) {
                throw new FirestoreError('update AI prompt consent', error);
            }
            handleError(error, 'UserConsentManager.updateAIPromptConsent');
        }
    }
} 