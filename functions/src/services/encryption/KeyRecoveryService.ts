import { SecurityQuestionService } from "./SecurityQuestionService";
import { RecoveryCodeService } from "./RecoveryCodeService";
import { UserKeyManager } from "./UserKeyManager";
import { UserConsent } from "../../types/user-consent.d";
import * as admin from 'firebase-admin';
import { KeyDerivationService } from "./KeyDerivationService";
import { SecureStorageService } from "./SecureStorageService";

export class KeyRecoveryService {
    private securityQuestionService: SecurityQuestionService;
    private recoveryCodeService: RecoveryCodeService;
    private userKeyManager: UserKeyManager;
    private firestore: admin.firestore.Firestore;

    constructor() {
        this.securityQuestionService = new SecurityQuestionService();
        this.recoveryCodeService = new RecoveryCodeService();
        const keyDerivationService = new KeyDerivationService();
        const firestoreInstance = admin.firestore();

        const secureStorageService: SecureStorageService = {
          store: async (key: string, value: string) => {
            console.log(`Firestore'a ${key} depolanıyor...`);
            await firestoreInstance.collection("secureStorage").doc(key).set({ value });
          },
          retrieve: async (key: string) => {
            console.log(`Firestore'dan ${key} alınıyor...`);
            const doc = await firestoreInstance.collection("secureStorage").doc(key).get();
            return doc.exists ? doc.data()?.value : null;
          },
          delete: async (key: string) => {
            console.log(`Firestore'dan ${key} siliniyor...`);
            await firestoreInstance.collection("secureStorage").doc(key).delete();
          }
        };

        this.userKeyManager = new UserKeyManager(keyDerivationService, secureStorageService);
        this.firestore = firestoreInstance;
    }

    public async initiateKeyRecovery(userId: string, verificationData: any, consent: UserConsent): Promise<boolean> {
        console.log(`Kullanıcı ${userId} için anahtar kurtarma başlatılıyor.`);

        if (!consent.allowSensitivePersonalData) {
            console.error("Anahtar kurtarma için yeterli gizlilik rızası yok.");
            return false;
        }

        if (verificationData.securityAnswers) {
            const userAnswers = verificationData.securityAnswers;
            const storedAnswers = await this.securityQuestionService.getUserSecurityAnswers(userId);

            if (!storedAnswers || storedAnswers.length === 0) {
                console.warn(`Kullanıcı ${userId} için kaydedilmiş güvenlik cevabı bulunamadı.`);
                return false;
            }

            let allAnswersCorrect = true;
            for (const userAnswer of userAnswers) {
                const stored = storedAnswers.find(sa => sa.questionId === userAnswer.questionId);
                if (!stored || !(await this.securityQuestionService.verifyAnswer(userAnswer.answer, stored.hashedAnswer))) {
                    allAnswersCorrect = false;
                    break;
                }
            }
            if (!allAnswersCorrect) {
                console.warn(`Kullanıcı ${userId} için güvenlik soruları doğrulaması başarısız oldu.`);
                return false;
            }
            console.log(`Kullanıcı ${userId} için güvenlik soruları başarıyla doğrulandı.`);
        }

        if (verificationData.recoveryCode) {
            const code = verificationData.recoveryCode;
            const storedCodes = await this.recoveryCodeService.getRecoveryCodes(userId);

            if (!storedCodes || storedCodes.length === 0) {
                console.warn(`Kullanıcı ${userId} için kaydedilmiş yedek kod bulunamadı.`);
                return false;
            }

            let codeVerified = false;
            for (const hashedCode of storedCodes) {
                if (await this.recoveryCodeService.verifyRecoveryCode(code, hashedCode)) {
                    codeVerified = true;
                    break;
                }
            }
            if (!codeVerified) {
                console.warn(`Kullanıcı ${userId} için yedek kod doğrulaması başarısız oldu.`);
                return false;
            }
            console.log(`Kullanıcı ${userId} için yedek kod başarıyla doğrulandı.`);
        }

        const storedUserKey = await this.userKeyManager.getStoredUserKey(userId);
        if (!storedUserKey) {
          console.error("Kullanıcı anahtarı depolamada bulunamadı.");
          return false;
        }

        console.log(`Kullanıcı ${userId} için anahtar kurtarma süreci başarılı oldu.`);
        return true;
    }

    public async resetMasterKey(userId: string, newPassword?: string): Promise<boolean> {
        console.log(`Kullanıcı ${userId} için ana anahtar sıfırlanıyor.`);
        if (newPassword) {
          await this.userKeyManager.createUserKey(userId, newPassword);
          console.log(`Kullanıcı ${userId} için yeni anahtar parola ile oluşturuldu.`);
        } else {
          console.warn("Yeni parola belirtilmedi. Master anahtar rastgele oluşturulmayacak, mevcut anahtar kullanılacak veya manuel olarak ayarlanması gerekecek.");
          return false;
        }
        
        // TODO: Tüm eski şifreli verileri yeni anahtarla yeniden şifrele (anahtar rotasyonu).
        console.log(`Kullanıcı ${userId} için ana anahtar başarıyla sıfırlandı.`);
        return true;
    }
} 