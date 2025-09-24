import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserKeyManager } from '../../../src/services/encryption/UserKeyManager';
import { KeyDerivationService } from '../../../src/services/encryption/KeyDerivationService';
import { SecureStorageService } from '../../../src/services/encryption/SecureStorageService';

// Mock servisler
const mockKeyDerivationService = {
    generateSalt: vi.fn(),
    deriveKey: vi.fn(),
    verifyKey: vi.fn(),
};
const mockSecureStorageService = {
    store: vi.fn(),
    retrieve: vi.fn(),
    delete: vi.fn(),
};

describe('UserKeyManager', () => {
    let userKeyManager: UserKeyManager;

    beforeEach(() => {
        vi.clearAllMocks();
        userKeyManager = new UserKeyManager(
            mockKeyDerivationService as unknown as KeyDerivationService,
            mockSecureStorageService as unknown as SecureStorageService
        );
    });

    it('Kullanıcı anahtarı oluşturmalı ve güvenli şekilde saklamalı', async () => {
        mockKeyDerivationService.generateSalt.mockResolvedValue(Buffer.from('testSalt'));
        mockKeyDerivationService.deriveKey.mockResolvedValue({ key: 'base64key' });
        mockSecureStorageService.store.mockResolvedValue(undefined);

        const result = await userKeyManager.createUserKey('user1', 'sifre123');
        expect(result).toBe('base64key');
        expect(mockKeyDerivationService.generateSalt).toHaveBeenCalled();
        expect(mockKeyDerivationService.deriveKey).toHaveBeenCalledWith('sifre123', Buffer.from('testSalt'));
        expect(mockSecureStorageService.store).toHaveBeenCalled();
    });

    it('Saklanan kullanıcı anahtarını doğru şekilde getirmeli ve doğrulamalı', async () => {
        const keyMeta = { key: 'base64key', salt: 'dGVzdFNhbHQ=' };
        mockSecureStorageService.retrieve.mockResolvedValue(JSON.stringify(keyMeta));
        mockKeyDerivationService.verifyKey.mockResolvedValue(true);

        const result = await userKeyManager.retrieveUserKey('user1', 'sifre123');
        expect(result).toBe('base64key');
        expect(mockSecureStorageService.retrieve).toHaveBeenCalledWith('user_key_user1');
        expect(mockKeyDerivationService.verifyKey).toHaveBeenCalled();
    });

    it('Anahtar doğrulaması başarısızsa null dönmeli', async () => {
        const keyMeta = { key: 'base64key', salt: 'dGVzdFNhbHQ=' };
        mockSecureStorageService.retrieve.mockResolvedValue(JSON.stringify(keyMeta));
        mockKeyDerivationService.verifyKey.mockResolvedValue(false);

        const result = await userKeyManager.retrieveUserKey('user1', 'sifre123');
        expect(result).toBeNull();
    });
}); 