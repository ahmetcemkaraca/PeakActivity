import CryptoJS from 'crypto-js';
import { BaseEncryptionService } from '../../../../functions/src/services/encryption/BaseEncryptionService';
import { CryptoUtils } from '../../../../functions/src/services/encryption/CryptoUtils';

export class CryptoJSFallbackService extends BaseEncryptionService {
  constructor() {
    super();
  }

  /**
   * Veriyi CryptoJS kullanarak AES şifreleme ile şifreler.
   * @param data Şifrelenecek ham veri (string).
   * @param key Şifreleme anahtarı (Base64 string).
   * @param iv Şifreleme IV (Base64 string).
   * @returns Şifrelenmiş veri (Base64 string).
   */
  async encrypt(data: string, key: string, iv: string): Promise<string> {
    const keyWordArray = CryptoJS.enc.Base64.parse(key);
    const ivWordArray = CryptoJS.enc.Base64.parse(iv);
    const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.toString();
  }

  /**
   * CryptoJS kullanarak AES şifreleme ile şifrelenmiş veriyi çözer.
   * @param encryptedData Şifrelenmiş veri (Base64 string).
   * @param key Şifre çözme anahtarı (Base64 string).
   * @param iv Şifre çözme IV (Base64 string).
   * @returns Çözülmüş ham veri (string).
   */
  async decrypt(encryptedData: string, key: string, iv: string): Promise<string> {
    const keyWordArray = CryptoJS.enc.Base64.parse(key);
    const ivWordArray = CryptoJS.enc.Base64.parse(iv);
    const decrypted = CryptoJS.AES.decrypt(encryptedData, keyWordArray, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  /**
   * 16 baytlık rastgele bir IV (Initialization Vector) oluşturur ve Base64 olarak döndürür.
   * @returns Base64 kodlanmış IV stringi.
   */
  async generateIv(): Promise<string> {
    const ivBytes = CryptoUtils.generateRandomBytes(16);
    return CryptoUtils.bytesToBase64(ivBytes);
  }
} 