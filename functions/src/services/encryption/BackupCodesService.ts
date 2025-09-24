import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export class BackupCodesService {
  private readonly CODE_LENGTH = 10; // Her yedek kodun karakter uzunluğu
  private readonly NUMBER_OF_CODES = 10; // Oluşturulacak yedek kod sayısı
  private readonly HASH_SALT_ROUNDS = 10; // bcrypt için tuzlama turu sayısı

  /**
   * Belirtilen sayıda rastgele, alfanümerik yedek kodlar oluşturur.
   * @returns Oluşturulan yedek kod stringlerinin listesi.
   */
  public generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < this.NUMBER_OF_CODES; i++) {
      codes.push(this.generateSingleCode(this.CODE_LENGTH));
    }
    return codes;
  }

  private generateSingleCode(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += characters.charAt(bytes[i] % characters.length);
    }
    return result;
  }

  /**
   * Bir yedek kod listesini hashler. Hashlenmiş kodlar güvenli bir şekilde saklanmalıdır.
   * @param codes Hashlenecek yedek kod stringlerinin listesi.
   * @returns Hashlenmiş yedek kod stringlerinin Promise listesi.
   */
  public async hashBackupCodes(codes: string[]): Promise<string[]> {
    const hashedCodes: Promise<string>[] = codes.map(code =>
      bcrypt.hash(code, this.HASH_SALT_ROUNDS)
    );
    return Promise.all(hashedCodes);
  }

  /**
   * Bir yedek kodu verilen hashlenmiş kod listesinde doğrular.
   * Doğrulanan kod, tekrar kullanılmasını önlemek için devre dışı bırakılmalıdır.
   * @param userId Doğrulama yapılan kullanıcının kimliği.
   * @param code Doğrulanacak yedek kod.
   * @returns Doğrulama başarılı olursa true, aksi takdirde false.
   */
  public async verifyAndInvalidateCode(userId: string, code: string): Promise<boolean> {
    console.log(`Kullanıcı ${userId} için yedek kod doğrulanıyor.`);
    const storedHashedCodes = await this.getStoredBackupCodes(userId);

    if (!storedHashedCodes || storedHashedCodes.length === 0) {
      console.warn(`Kullanıcı ${userId} için kaydedilmiş yedek kod bulunamadı.`);
      return false;
    }

    let codeVerified = false;
    let invalidatedIndex: number = -1;

    for (let i = 0; i < storedHashedCodes.length; i++) {
      const hashedCode = storedHashedCodes[i];
      if (await bcrypt.compare(code, hashedCode)) {
        codeVerified = true;
        invalidatedIndex = i;
        break;
      }
    }

    if (codeVerified) {
      // Kodu kullanıldı olarak işaretle veya listeden kaldır
      // TODO: Firestore veya veritabanı entegrasyonu ile kodu gerçekten geçersiz kıl.
      // Örneğin: storedHashedCodes.splice(invalidatedIndex, 1); ve güncellemeyi kaydet.
      console.log(
        `Kullanıcı ${userId} için yedek kod başarıyla doğrulandı ve geçersiz kılındı (yer tutucu).`
      );
      return true;
    } else {
      console.warn(`Kullanıcı ${userId} için yedek kod doğrulaması başarısız oldu.`);
      return false;
    }
  }

  /**
   * Bir kullanıcının mevcut yedek kodlarını alır.
   * @param userId Yedek kodları alınacak kullanıcı kimliği.
   * @returns Hashlenmiş yedek kodların listesi veya bulunamazsa null.
   */
  public async getStoredBackupCodes(userId: string): Promise<string[] | null> {
    console.log(`Kullanıcı ${userId} için depolanmış yedek kodlar alınıyor.`);
    // TODO: Yedek kodları güvenli bir veritabanından çekin (sadece hashlenmiş halleri).
    // Örneğin: const doc = await Firestore.collection("userBackupCodes").doc(userId).get();
    // return doc.exists ? doc.data().codes : null;
    return []; // Şimdilik boş liste döndürüyoruz
  }

  /**
   * Bir kullanıcının yedek kodlarını kaydeder.
   * @param userId Yedek kodların kaydedileceği kullanıcı kimliği.
   * @param hashedCodes Hashlenmiş yedek kodların listesi.
   * @returns İşlemin başarılı olup olmadığını belirten bir Promise.
   */
  public async saveBackupCodes(userId: string, hashedCodes: string[]): Promise<boolean> {
    console.log(`Kullanıcı ${userId} için yedek kodlar kaydediliyor.`);
    // TODO: Hashlenmiş kodları güvenli bir veritabanında depolayın.
    // Örneğin: await Firestore.collection("userBackupCodes").doc(userId).set({ codes: hashedCodes });
    return true; // Şimdilik başarılı olduğunu varsayalım
  }
}
