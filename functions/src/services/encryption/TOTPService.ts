import * as OTPAuth from 'otpauth';
import * as crypto from 'crypto';

export class TOTPService {
  /**
   * Yeni bir TOTP gizli anahtarı oluşturur.
   * Bu anahtar kullanıcıya QR kodu olarak sunulmalıdır.
   * @returns Gizli anahtarın base32 formatında stringi.
   */
  public generateSecret(): string {
    const secretBytes = crypto.randomBytes(20); // 20 bayt = 160 bit (TOTP için önerilen uzunluk)
    const secret = new OTPAuth.Secret(secretBytes); // Secret objesi oluştur
    return secret.base32; // Base32 kodlaması
  }

  /**
   * Verilen gizli anahtar ve kullanıcının girdiği kod ile bir TOTP kodunu doğrular.
   * @param secret Gizli anahtarın base32 formatında stringi.
   * @param token Kullanıcının girdiği 6 haneli TOTP kodu.
   * @returns Doğrulama başarılı olursa true, aksi takdirde false.
   */
  public verifyToken(secret: string, token: string): boolean {
    const otp = new OTPAuth.TOTP({
      secret: secret,
      digits: 6,
      period: 30,
      algorithm: 'SHA1', // Google Authenticator varsayılanı
    });
    try {
      // Doğrulama penceresi (drift) toleransı eklenebilir, örneğin 1 veya 2 periyot
      const delta = otp.validate({
        token: token,
        window: 1, // 1 periyotluk sapmaya izin ver (30 saniye)
      });
      return delta !== null; // Delta null değilse doğrulama başarılıdır
    } catch (error) {
      console.error('TOTP jeton doğrulanırken hata oluştu:', error);
      return false;
    }
  }

  /**
   * Bir TOTP URI'si oluşturur (Authenticator uygulamaları için QR kodu oluşturmada kullanılır).
   * @param userId Kullanıcı kimliği (genellikle e-posta adresi).
   * @param serviceName Hizmetin adı (uygulama adı).
   * @param secret Gizli anahtarın base32 formatında stringi.
   * @returns OTPAuth URI stringi.
   */
  public generateTOTPUri(userId: string, serviceName: string, secret: string): string {
    const otp = new OTPAuth.TOTP({
      label: userId,
      issuer: serviceName,
      secret: secret,
    });
    return otp.toString(); // otpauth://totp/EXAMPLE%20SERVICE:user@example.com?secret=...
  }
}
