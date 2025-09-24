import * as crypto from "crypto";
import * as bcrypt from "bcrypt";

export class RecoveryCodeService {
    private readonly CODE_LENGTH = 16; // Yedek kodun karakter uzunluğu
    private readonly HASH_SALT_ROUNDS = 10; // bcrypt için tuzlama turu sayısı

    /**
     * Belirtilen uzunlukta rastgele, alfanümerik bir yedek kod oluşturur.
     * @returns Oluşturulan yedek kod stringi.
     */
    public generateRecoveryCode(): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const bytes = crypto.randomBytes(this.CODE_LENGTH);
        for (let i = 0; i < this.CODE_LENGTH; i++) {
            result += characters.charAt(bytes[i] % characters.length);
        }
        return result;
    }

    /**
     * Bir yedek kodu hashler. Hashlenmiş kodlar güvenli bir şekilde saklanmalıdır.
     * @param code Hashlenecek yedek kod.
     * @returns Yedek kodun bcrypt hash'i.
     */
    public async hashRecoveryCode(code: string): Promise<string> {
        return bcrypt.hash(code, this.HASH_SALT_ROUNDS);
    }

    /**
     * Bir yedek kodu verilen hash ile karşılaştırır.
     * @param code Doğrulanacak yedek kod.
     * @param hashedCode Karşılaştırılacak hashlenmiş yedek kod.
     * @returns Kod eşleşiyorsa true, aksi takdirde false.
     */
    public async verifyRecoveryCode(code: string, hashedCode: string): Promise<boolean> {
        return bcrypt.compare(code, hashedCode);
    }

    /**
     * Kullanıcı için yedek kodları kaydeder. Daha önce kaydedilmiş kodları üzerine yazabilir.
     * @param userId Yedek kodların kaydedileceği kullanıcı kimliği.
     * @param hashedCodes Hashlenmiş yedek kodların listesi.
     * @returns İşlemin başarılı olup olmadığını belirten bir Promise.
     */
    public async saveRecoveryCodes(userId: string, hashedCodes: string[]): Promise<boolean> {
        console.log(`Kullanıcı ${userId} için yedek kodlar kaydediliyor.`);
        // TODO: Hashlenmiş kodları güvenli bir veritabanında depolayın.
        // Örneğin: Firestore.collection("userRecoveryCodes").doc(userId).set({ codes: hashedCodes });
        return true; // Başarılı olduğunu varsayalım
    }

    /**
     * Bir kullanıcının kaydedilmiş yedek kodlarını alır.
     * @param userId Yedek kodları alınacak kullanıcı kimliği.
     * @returns Hashlenmiş yedek kodların listesi veya bulunamazsa null.
     */
    public async getRecoveryCodes(userId: string): Promise<string[] | null> {
        console.log(`Kullanıcı ${userId} için yedek kodlar alınıyor.`);
        // TODO: Depolanan kodları çekin.
        // Örneğin: const doc = await Firestore.collection("userRecoveryCodes").doc(userId).get();
        // return doc.exists ? doc.data().codes : null;
        return []; // Şimdilik boş liste döndürüyoruz
    }
} 