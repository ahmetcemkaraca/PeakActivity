import { TOTPService } from './TOTPService';
import { SMSService } from './SMSService';
import { BackupCodesService } from './BackupCodesService';
import { TwoFactorAuthData } from '../../types/two-factor-auth.d';

export class TwoFactorManager {
  private totpService: TOTPService;
  private smsService: SMSService;
  private backupCodesService: BackupCodesService;

  constructor() {
    this.totpService = new TOTPService();
    this.smsService = new SMSService();
    this.backupCodesService = new BackupCodesService();
  }

  /**
   * Bir kullanıcı için 2FA kurulumunu başlatır ve bir gizli anahtar oluşturur.
   * @param userId Kullanıcının kimliği.
   * @returns Gizli anahtar ve OTPAuth URI içeren bir Promise.
   */
  public async initiateTOTPSetup(userId: string): Promise<{ secret: string; uri: string }> {
    const secret = this.totpService.generateSecret();
    const uri = this.totpService.generateTOTPUri(userId, 'PeakActivity', secret);
    // TODO: Gizli anahtarı güvenli bir şekilde saklayın (örn. Firestore, şifreli).
    // Kullanıcının 2FA durumunu güncelle (TwoFactorAuthData).
    console.log(
      `Kullanıcı ${userId} için TOTP kurulumu başlatıldı. Gizli anahtar: ${secret}, URI: ${uri}`
    );
    return { secret, uri };
  }

  /**
   * Kullanıcının girdiği kod ile TOTP kurulumunu doğrular ve etkinleştirir.
   * @param userId Kullanıcının kimliği.
   * @param secret Gizli anahtarın base32 formatında stringi.
   * @param token Kullanıcının girdiği 6 haneli TOTP kodu.
   * @returns Doğrulama başarılı olursa true, aksi takdirde false.
   */
  public async verifyAndEnableTOTP(
    userId: string,
    secret: string,
    token: string
  ): Promise<boolean> {
    const isValid = this.totpService.verifyToken(secret, token);
    if (isValid) {
      // TODO: Gizli anahtarı güvenli bir şekilde kalıcı olarak depolayın (örn. şifrelenmiş).
      // Kullanıcının 2FA durumunu 'hasTotp: true' olarak güncelle.
      console.log(`Kullanıcı ${userId} için TOTP başarıyla etkinleştirildi.`);
      return true;
    } else {
      console.warn(`Kullanıcı ${userId} için TOTP doğrulama başarısız oldu.`);
      return false;
    }
  }

  /**
   * SMS tabanlı 2FA kurulumunu başlatır ve doğrulama kodu gönderir.
   * @param userId Kullanıcının kimliği.
   * @param phoneNumber Doğrulama kodu gönderilecek telefon numarası.
   * @returns Gönderim başarılı olursa true, aksi takdirde false.
   */
  public async initiateSmsSetup(userId: string, phoneNumber: string): Promise<boolean> {
    // TODO: Telefon numarasını güvenli bir şekilde depolayın (örn. şifrelenmiş).
    return this.smsService.sendVerificationCode(phoneNumber);
  }

  /**
   * SMS doğrulama kodunu kontrol eder ve SMS 2FA'yı etkinleştirir.
   * @param userId Kullanıcının kimliği.
   * @param phoneNumber Telefon numarası.
   * @param code Kullanıcının girdiği doğrulama kodu.
   * @returns Doğrulama başarılı olursa true, aksi takdirde false.
   */
  public async verifyAndEnableSms(
    userId: string,
    phoneNumber: string,
    code: string
  ): Promise<boolean> {
    const isValid = await this.smsService.verifyCode(phoneNumber, code);
    if (isValid) {
      // TODO: Kullanıcının 2FA durumunu 'hasSms: true' olarak güncelle.
      console.log(`Kullanıcı ${userId} için SMS 2FA başarıyla etkinleştirildi.`);
      return true;
    } else {
      console.warn(`Kullanıcı ${userId} için SMS doğrulama başarısız oldu.`);
      return false;
    }
  }

  /**
   * Yedek kodları oluşturur ve kullanıcıya sunar.
   * @param userId Kullanıcının kimliği.
   * @returns Oluşturulan yedek kodların listesi (düz metin).
   */
  public async generateAndSaveBackupCodes(userId: string): Promise<string[]> {
    const codes = this.backupCodesService.generateBackupCodes();
    const hashedCodes = await this.backupCodesService.hashBackupCodes(codes);
    await this.backupCodesService.saveBackupCodes(userId, hashedCodes);
    // TODO: Kullanıcının 2FA durumunu 'hasBackupCodes: true' olarak güncelle.
    console.log(`Kullanıcı ${userId} için yedek kodlar oluşturuldu ve kaydedildi.`);
    return codes; // Kullanıcıya düz metin kodları gösterilmelidir
  }

  /**
   * Bir yedek kodu kullanarak 2FA'yı doğrular ve kodu geçersiz kılar.
   * @param userId Kullanıcının kimliği.
   * @param code Kullanıcının girdiği yedek kod.
   * @returns Doğrulama başarılı olursa true, aksi takdirde false.
   */
  public async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const isValid = await this.backupCodesService.verifyAndInvalidateCode(userId, code);
    if (isValid) {
      console.log(`Kullanıcı ${userId} için yedek kod başarıyla doğrulandı.`);
      return true;
    } else {
      console.warn(`Kullanıcı ${userId} için yedek kod doğrulama başarısız oldu.`);
      return false;
    }
  }

  /**
   * Bir kullanıcının mevcut 2FA durumunu getirir.
   * @param userId Kullanıcının kimliği.
   * @returns TwoFactorAuthData nesnesi veya null eğer 2FA ayarlanmamışsa.
   */
  public async getTwoFactorStatus(userId: string): Promise<TwoFactorAuthData | null> {
    // TODO: Kullanıcının 2FA durumunu veritabanından çekin.
    console.log(`Kullanıcı ${userId} için 2FA durumu alınıyor.`);
    return null; // Şimdilik null döndürüyoruz
  }

  /**
   * Bir kullanıcının 2FA'sını tamamen devre dışı bırakır.
   * @param userId Kullanıcının kimliği.
   * @returns Devre dışı bırakma başarılı olursa true, aksi takdirde false.
   */
  public async disableTwoFactor(userId: string): Promise<boolean> {
    // TODO: Tüm 2FA ayarlarını silin ve 2FA durumunu devre dışı bırakın.
    console.log(`Kullanıcı ${userId} için 2FA devre dışı bırakılıyor.`);
    return true; // Şimdilik başarılı olduğunu varsayalım
  }
}
