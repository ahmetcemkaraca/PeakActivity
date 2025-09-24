export interface TwoFactorAuthData {
    /**
     * İki faktörlü kimlik doğrulamanın etkin olup olmadığını gösterir.
     */
    enabled: boolean;
    /**
     * TOTP (Time-based One-Time Password) ayarlarının mevcut olup olmadığını gösterir.
     */
    hasTotp: boolean;
    /**
     * SMS tabanlı iki faktörlü kimlik doğrulamanın mevcut olup olmadığını gösterir.
     */
    hasSms: boolean;
    /**
     * Yedek kodların mevcut olup olmadığını gösterir.
     */
    hasBackupCodes: boolean;
    /**
     * WebAuthn/FIDO2 ayarlarının mevcut olup olmadığını gösterir.
     */
    hasWebAuthn: boolean;
    /**
     * İki faktörlü kimlik doğrulama ayarlarının en son güncellendiği zaman damgası (ISO 8601 formatında).
     */
    lastUpdated: string;
} 