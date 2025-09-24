export interface WebAuthnRegistrationRequest {
    /**
     * WebAuthn kayıt işlemi için sunucudan alınan meydan okuma (challenge).
     */
    challenge: string;
    /**
     * WebAuthn kimlik doğrulayıcı oluşturma seçenekleri.
     */
    publicKeyCredentialCreationOptions: any; // Credential Creation Options için yer tutucu
}

export interface WebAuthnRegistrationResponse {
    /**
     * WebAuthn kayıt işlemi sonucu oluşturulan kimlik bilgisi (credential) yanıtı.
     */
    attestationObject: string; // Base64url veya ArrayBuffer olarak
    clientDataJSON: string;    // Base64url veya ArrayBuffer olarak
}

export interface WebAuthnAuthenticationRequest {
    /**
     * WebAuthn kimlik doğrulama işlemi için sunucudan alınan meydan okuma (challenge).
     */
    challenge: string;
    /**
     * WebAuthn kimlik doğrulayıcı isteme seçenekleri.
     */
    publicKeyCredentialRequestOptions: any; // Credential Request Options için yer tutucu
}

export interface WebAuthnAuthenticationResponse {
    /**
     * WebAuthn kimlik doğrulama işlemi sonucu oluşturulan kimlik bilgisi (credential) yanıtı.
     */
    authenticatorData: string; // Base64url veya ArrayBuffer olarak
    clientDataJSON: string;    // Base64url veya ArrayBuffer olarak
    signature: string;         // Base64url veya ArrayBuffer olarak
    userHandle: string;        // Base64url veya ArrayBuffer olarak
}

export interface WebAuthnCredential {
    /**
     * Kayıtlı WebAuthn kimlik bilgisinin kimliği.
     */
    id: string; // Credential ID (Base64url)
    /**
     * Kimlik bilgisinin bağlı olduğu kullanıcının kimliği.
     */
    userId: string;
    /**
     * Kimlik doğrulayıcının ortak anahtarı.
     */
    publicKey: string; // Public key (DER formatında Base64url)
    /**
     * Kimlik doğrulayıcı verisi (Authenticator Data).
     */
    authenticatorData: string; // Base64url
    /**
     * Güven faktörü (counter). Yeniden oynatma saldırılarını önlemek için kullanılır.
     */
    counter: number;
    /**
     * Kimlik bilgisinin kaydedildiği zaman damgası.
     */
    createdAt: string;
    /**
     * Kimlik bilgisi için bir isim veya açıklama.
     */
    name?: string;
} 