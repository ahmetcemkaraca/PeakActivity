import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseEncryptionService } from '../../../src/services/encryption/BaseEncryptionService';

// Test için sahte bir alt sınıf
class ConcreteEncryptionService extends BaseEncryptionService {
  async encrypt(data: string, key: string, iv: string): Promise<string> {
    // Basitçe data, key ve iv'i birleştirip dön
    return `${data}|${key}|${iv}`;
  }
  async decrypt(encryptedData: string, key: string, iv: string): Promise<string> {
    // Basitçe ayırıp ilk kısmı dön
    return encryptedData.split('|')[0];
  }
  async generateIv(): Promise<string> {
    return 'dummyiv';
  }
}

// Türkçe açıklamalar eklendi

describe('BaseEncryptionService (Concrete)', () => {
  let encryptionService: ConcreteEncryptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    encryptionService = new ConcreteEncryptionService();
  });

  it('Veriyi şifrelemeli ve çözebilmeli', async () => {
    const data = 'testVeri';
    const key = 'testKey';
    const iv = 'testIv';
    const encrypted = await encryptionService.encrypt(data, key, iv);
    expect(typeof encrypted).toBe('string');
    const decrypted = await encryptionService.decrypt(encrypted, key, iv);
    expect(decrypted).toBe(data);
  });

  it('IV üretmeli ve string dönmeli', async () => {
    const iv = await encryptionService.generateIv();
    expect(typeof iv).toBe('string');
    expect(iv.length).toBeGreaterThan(0);
  });
});
