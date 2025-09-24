import { DataTransmissionType } from '../encryption/DataTransmissionTypes';
import { BaseEncryptionService } from '../encryption/BaseEncryptionService'; // BaseEncryptionService'i import et
import { EncryptionMetadata } from '../encryption/EncryptionMetadata';
import { EncryptionTypes } from '../encryption/EncryptionTypes'; // EncryptionTypes'ı import et

// Gerekirse başka servisler (örn: AnonymizationService) buraya import edilebilir.

export class ActivityDataProcessor {
  private encryptionService: BaseEncryptionService;

  constructor(encryptionService: BaseEncryptionService) {
    this.encryptionService = encryptionService;
  }

  /**
   * Aktivite verilerini belirtilen gönderim tipine göre işler.
   * @param data İşlenecek ham aktivite verisi.
   * @param type Veri gönderim tipi (RAW, ENCRYPTED_AI_ENABLED, ENCRYPTED_AI_DISABLED).
   * @param userKey Kullanıcının şifreleme anahtarı (şifreleme gerektiren tipler için).
   * @returns İşlenmiş veri ve ilgili metadata.
   */
  async processActivityData(
    data: string,
    type: DataTransmissionType,
    userKey?: string
  ): Promise<{ processedData: string; transmissionType: DataTransmissionType; metadata?: EncryptionMetadata }> {
    switch (type) {
      case DataTransmissionType.RAW:
        // Ham veri, ek işleme veya şifreleme yok.
        return { processedData: data, transmissionType: type };

      case DataTransmissionType.ENCRYPTED_AI_ENABLED:
        if (!userKey) {
          throw new Error("ENCRYPTED_AI_ENABLED tipi için kullanıcı anahtarı gerekli.");
        }
        // Veriyi şifrele ve AI analizi için uygun formatta bırak.
        const ivForAI = await this.encryptionService.generateIv();
        const encryptedDataForAI = await this.encryptionService.encrypt(data, userKey, ivForAI);
        const metadataForAI: EncryptionMetadata = {
            algorithm: EncryptionTypes.AES256GCM, // Enum değerini kullan
            iv: ivForAI,
            version: "1.0",
        };
        return { processedData: encryptedDataForAI, transmissionType: type, metadata: metadataForAI };

      case DataTransmissionType.ENCRYPTED_AI_DISABLED:
        if (!userKey) {
          throw new Error("ENCRYPTED_AI_DISABLED tipi için kullanıcı anahtarı gerekli.");
        }
        // Veriyi şifrele, AI analizi yapılmayacak.
        const ivForDisabledAI = await this.encryptionService.generateIv();
        const encryptedDataForDisabledAI = await this.encryptionService.encrypt(data, userKey, ivForDisabledAI);
        const metadataForDisabledAI: EncryptionMetadata = {
            algorithm: EncryptionTypes.AES256GCM, // Enum değerini kullan
            iv: ivForDisabledAI,
            version: "1.0",
        };
        return { processedData: encryptedDataForDisabledAI, transmissionType: type, metadata: metadataForDisabledAI };

      default:
        throw new Error(`Desteklenmeyen veri gönderim tipi: ${type}`);
    }
  }

  // Buraya, AI analizi öncesi veya sonrası anonimleştirme, veri temizleme gibi
  // ek işleme mantıkları eklenebilir.
} 