import { GoogleCalendarAuth } from "../../types/external-credentials.d";
import { EncryptionMetadata } from "./EncryptionMetadata";
import { UserKeyManager } from "./UserKeyManager";
import { BaseEncryptionService } from "./BaseEncryptionService";

export class GoogleCalendarTokenEncryption {
    private userKeyManager: UserKeyManager;
    private encryptionService: BaseEncryptionService;

    constructor(userKeyManager: UserKeyManager, encryptionService: BaseEncryptionService) {
        this.userKeyManager = userKeyManager;
        this.encryptionService = encryptionService;
    }

    /**
     * Google Calendar kimlik bilgilerini şifreler.
     * @param userId Kullanıcının kimliği.
     * @param accessToken Google Calendar Erişim Jetonu.
     * @param refreshToken Google Calendar Yenileme Jetonu.
     * @param expiryDate Erişim jetonunun sona erme tarihi (Unix timestamp).
     * @returns Şifrelenmiş GoogleCalendarAuth nesnesi.
     */
    public async encryptGoogleCalendarTokens(
        userId: string,
        accessToken: string,
        refreshToken: string,
        expiryDate: number
    ): Promise<GoogleCalendarAuth> {
        console.log(`Kullanıcı ${userId} için Google Calendar token'ları şifreleniyor.`);

        const masterKey = await this.userKeyManager.getMasterKey(userId);
        if (!masterKey) {
            throw new Error("Ana anahtar bulunamadı. Lütfen önce bir ana anahtar oluşturun.");
        }

        const payload = JSON.stringify({
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiryDate: expiryDate,
        });

        const encryptionResult = await this.encryptionService.encrypt(payload, masterKey); // masterKey kullanılarak şifrele

        const encryptedTokens: GoogleCalendarAuth = {
            encryptedPayload: encryptionResult.encryptedData,
            encryptionMetadata: encryptionResult.metadata,
            lastUpdated: new Date().toISOString(),
        };

        console.log(`Kullanıcı ${userId} için Google Calendar token'ları başarıyla şifrelendi.`);
        return encryptedTokens;
    }

    /**
     * Şifrelenmiş Google Calendar kimlik bilgilerini çözer.
     * @param userId Kullanıcının kimliği.
     * @param encryptedTokens Şifrelenmiş GoogleCalendarAuth nesnesi.
     * @returns Çözülmüş kimlik bilgileri (accessToken, refreshToken, expiryDate) içeren bir nesne.
     */
    public async decryptGoogleCalendarTokens(
        userId: string,
        encryptedTokens: GoogleCalendarAuth
    ): Promise<{ accessToken: string; refreshToken: string; expiryDate: number }> {
        console.log(`Kullanıcı ${userId} için Google Calendar token'ları çözülüyor.`);

        const masterKey = await this.userKeyManager.getMasterKey(userId);
        if (!masterKey) {
            throw new Error("Ana anahtar bulunamadı. Lütfen önce bir ana anahtar oluşturun.");
        }

        const decryptedPayload = await this.encryptionService.decrypt(
            encryptedTokens.encryptedPayload,
            encryptedTokens.encryptionMetadata,
            masterKey
        );

        const tokens = JSON.parse(decryptedPayload);
        console.log(`Kullanıcı ${userId} için Google Calendar token'ları başarıyla çözüldü.`);
        return tokens;
    }
} 