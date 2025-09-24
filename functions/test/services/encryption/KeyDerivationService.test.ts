import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeyDerivationService } from '../../../src/services/encryption/KeyDerivationService';

// Türkçe açıklamalar eklendi

describe('KeyDerivationService', () => {
    let keyDerivationService: KeyDerivationService;

    beforeEach(() => {
        vi.clearAllMocks();
        keyDerivationService = new KeyDerivationService();
    });

    it('Salt üretmeli ve Buffer olarak dönmeli', async () => {
        const salt = await keyDerivationService.generateSalt();
        expect(salt).toBeInstanceOf(Buffer);
        expect(salt.length).toBeGreaterThan(0);
    });

    it('Şifre ve salt ile anahtar türetmeli', async () => {
        const password = 'testSifre123!';
        const salt = Buffer.from('testSalt');
        const { key } = await keyDerivationService.deriveKey(password, salt);
        expect(typeof key).toBe('string'); // Base64 string
        expect(key.length).toBeGreaterThan(0);
    });

    it('Doğru şifre ile anahtar doğrulaması başarılı olmalı', async () => {
        const password = 'testSifre123!';
        const salt = Buffer.from('testSalt');
        const { key } = await keyDerivationService.deriveKey(password, salt);
        const isValid = await keyDerivationService.verifyKey(password, key, salt);
        expect(isValid).toBe(true);
    });

    it('Yanlış şifre ile anahtar doğrulaması başarısız olmalı', async () => {
        const password = 'testSifre123!';
        const salt = Buffer.from('testSalt');
        const { key } = await keyDerivationService.deriveKey(password, salt);
        const isValid = await keyDerivationService.verifyKey('yanlisSifre', key, salt);
        expect(isValid).toBe(false);
    });
}); 