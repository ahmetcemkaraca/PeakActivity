import { WebCryptoService } from './WebCryptoService';
import { EncryptionMetadata } from '../../../../functions/src/services/encryption/EncryptionMetadata';
import { KeyDerivationService } from '../../../../functions/src/services/encryption/KeyDerivationService';
import { EncryptionTypes } from '../../../../functions/src/services/encryption/EncryptionTypes';

export class ClientSideEncryption {
  private webCryptoService: WebCryptoService;
  private keyDerivationService: KeyDerivationService;

  constructor(webCryptoService: WebCryptoService, keyDerivationService: KeyDerivationService) {
    this.webCryptoService = webCryptoService;
    this.keyDerivationService = keyDerivationService;
  }

  /**
   * Aktivite verilerini kullanıcının anahtarıyla şifreler.
   * @param data Şifrelenecek ham veri (string).
   * @param userKey Kullanıcının master anahtarı (Base64 string).
   * @returns Şifrelenmiş veri ve metadata içeren bir obje.
   */
  async encryptActivityData(
    data: string,
    userKey: string
  ): Promise<{ encryptedData: string; metadata: EncryptionMetadata }> {
    const iv = await this.webCryptoService.generateIv();
    const encryptedData = await this.webCryptoService.encrypt(data, userKey, iv);

    const metadata: EncryptionMetadata = {
      algorithm: EncryptionTypes.AES256GCM, // Düzeltme: Enum değerini kullan
      iv: iv,
      version: '1.0', // İlk versiyon
    };

    return { encryptedData, metadata };
  }

  /**
   * Şifrelenmiş aktivite verilerini kullanıcının anahtarıyla çözer.
   * @param encryptedData Şifrelenmiş veri (string).
   * @param metadata Şifreleme metadata'sı.
   * @param userKey Kullanıcının master anahtarı (Base64 string).
   * @returns Çözülmüş ham veri (string).
   */
  async decryptActivityData(
    encryptedData: string,
    metadata: EncryptionMetadata,
    userKey: string
  ): Promise<string> {
    // Metadata'daki algoritmaya göre doğru servisi seçmek için burada bir kontrol yapılabilir.
    if (metadata.algorithm !== EncryptionTypes.AES256GCM) {
      // Düzeltme: Enum değerini kullan
      throw new Error(`Desteklenmeyen şifreleme algoritması: ${metadata.algorithm}`);
    }
    return this.webCryptoService.decrypt(encryptedData, userKey, metadata.iv);
  }
}
