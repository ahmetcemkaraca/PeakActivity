export interface EncryptionMetadata {
    /**
     * Şifreleme algoritması (örneğin, "AES-256-GCM").
     */
    algorithm: string;
    /**
     * Başlatma vektörü veya nonce (Base64url kodlamalı).
     */
    iv: string;
    /**
     * Anahtar türetme için kullanılan tuz (salt) (Base64url kodlamalı).
     */
    salt: string;
    /**
     * Şifreleme metadata versiyonu.
     */
    version: string;
    /**
     * İsteğe bağlı ek kimlik doğrulama verisi (AAD), GCM gibi algoritmalar için.
     */
    aad?: string;
}

export interface ExternalCredential {
    /**
     * Kimlik bilgisinin şifrelenmiş payload'u (Base64url kodlamalı).
     */
    encryptedPayload: string;
    /**
     * Şifreleme için kullanılan meta veriler.
     */
    encryptionMetadata: EncryptionMetadata;
    /**
     * Kimlik bilgisinin en son güncellendiği zaman damgası (ISO 8601 formatında).
     */
    lastUpdated: string;
}

export interface TrelloCredentials extends ExternalCredential {
    // Trello'ya özel ek alanlar buraya gelebilir
    // Örneğin: userId, trelloMemberId
}

export interface JiraCredentials extends ExternalCredential {
    // Jira'ya özel ek alanlar buraya gelebilir
    // Örneğin: userId, jiraAccountId, jiraSiteUrl
}

export interface GoogleCalendarAuth extends ExternalCredential {
    // Google Calendar'a özel ek alanlar buraya gelebilir
    // Örneğin: userId, email
} 