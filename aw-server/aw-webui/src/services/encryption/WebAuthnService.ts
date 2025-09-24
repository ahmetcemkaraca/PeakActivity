import {
  WebAuthnRegistrationRequest,
  WebAuthnRegistrationResponse,
  WebAuthnAuthenticationRequest,
  WebAuthnAuthenticationResponse,
  WebAuthnCredential,
} from '../../types/webauthn.d';

export class WebAuthnService {
  /**
   * WebAuthn kayıt işlemini başlatır.
   * Sunucudan gelen meydan okuma (challenge) ve seçenekleri kullanarak kimlik doğrulayıcıyı kaydeder.
   * @param request WebAuthnRegistrationRequest nesnesi.
   * @returns WebAuthnRegistrationResponse nesnesi veya hata durumunda null.
   */
  public async register(
    request: WebAuthnRegistrationRequest
  ): Promise<WebAuthnRegistrationResponse | null> {
    console.log('WebAuthn kayıt işlemi başlatılıyor:', request);
    try {
      const credential = await navigator.credentials.create({
        publicKey: request.publicKeyCredentialCreationOptions,
      });

      if (!credential) {
        console.error('WebAuthn kimlik bilgisi oluşturulamadı.');
        return null;
      }

      // Yanıtı sunucuya göndermek için formatla
      const response: WebAuthnRegistrationResponse = {
        attestationObject: this.arrayBufferToBase64Url(
          credential.response.attestationObject as ArrayBuffer
        ),
        clientDataJSON: this.arrayBufferToBase64Url(
          credential.response.clientDataJSON as ArrayBuffer
        ),
      };
      console.log('WebAuthn kayıt yanıtı oluşturuldu.', response);
      return response;
    } catch (error) {
      console.error('WebAuthn kayıt işlemi başarısız oldu:', error);
      return null;
    }
  }

  /**
   * WebAuthn kimlik doğrulama işlemini başlatır.
   * Sunucudan gelen meydan okuma (challenge) ve seçenekleri kullanarak kullanıcıyı doğrular.
   * @param request WebAuthnAuthenticationRequest nesnesi.
   * @returns WebAuthnAuthenticationResponse nesnesi veya hata durumunda null.
   */
  public async authenticate(
    request: WebAuthnAuthenticationRequest
  ): Promise<WebAuthnAuthenticationResponse | null> {
    console.log('WebAuthn kimlik doğrulama işlemi başlatılıyor:', request);
    try {
      const assertion = await navigator.credentials.get({
        publicKey: request.publicKeyCredentialRequestOptions,
      });

      if (!assertion) {
        console.error('WebAuthn kimlik doğrulama yanıtı alınamadı.');
        return null;
      }

      // Yanıtı sunucuya göndermek için formatla
      const response: WebAuthnAuthenticationResponse = {
        authenticatorData: this.arrayBufferToBase64Url(
          assertion.response.authenticatorData as ArrayBuffer
        ),
        clientDataJSON: this.arrayBufferToBase64Url(
          assertion.response.clientDataJSON as ArrayBuffer
        ),
        signature: this.arrayBufferToBase64Url(assertion.response.signature as ArrayBuffer),
        userHandle: assertion.response.userHandle
          ? this.arrayBufferToBase64Url(assertion.response.userHandle as ArrayBuffer)
          : '',
      };
      console.log('WebAuthn kimlik doğrulama yanıtı oluşturuldu.', response);
      return response;
    } catch (error) {
      console.error('WebAuthn kimlik doğrulama işlemi başarısız oldu:', error);
      return null;
    }
  }

  /**
   * Bir kullanıcının kayıtlı WebAuthn kimlik bilgilerini sunucudan alır.
   * @param userId Kullanıcının kimliği.
   * @returns WebAuthnCredential listesi veya null.
   */
  public async getRegisteredCredentials(userId: string): Promise<WebAuthnCredential[] | null> {
    console.log(`Kullanıcı ${userId} için kayıtlı WebAuthn kimlik bilgileri alınıyor.`);
    // TODO: Sunucudan kayıtlı kimlik bilgilerini çek (örneğin, API çağrısı).
    return []; // Şimdilik boş liste döndürüyoruz
  }

  /**
   * Bir WebAuthn kimlik bilgisini sunucuda kaydeder.
   * @param userId Kullanıcının kimliği.
   * @param credential WebAuthnCredential nesnesi.
   * @returns Kaydetme başarılı olursa true, aksi takdirde false.
   */
  public async saveCredential(userId: string, credential: WebAuthnCredential): Promise<boolean> {
    console.log(`Kullanıcı ${userId} için WebAuthn kimlik bilgisi kaydediliyor:`, credential.id);
    // TODO: Kimlik bilgisini güvenli bir şekilde sunucuda depola.
    return true; // Şimdilik başarılı olduğunu varsayalım
  }

  /**
   * Bir WebAuthn kimlik bilgisini sunucuda siler.
   * @param userId Kullanıcının kimliği.
   * @param credentialId Silinecek kimlik bilgisinin ID'si.
   * @returns Silme başarılı olursa true, aksi takdirde false.
   */
  public async deleteCredential(userId: string, credentialId: string): Promise<boolean> {
    console.log(`Kullanıcı ${userId} için WebAuthn kimlik bilgisi ${credentialId} siliniyor.`);
    // TODO: Kimlik bilgisini sunucudan sil.
    return true; // Şimdilik başarılı olduğunu varsayalım
  }

  /**
   * ArrayBuffer'ı Base64Url formatına dönüştürür.
   * @param buffer Dönüştürülecek ArrayBuffer.
   * @returns Base64Url stringi.
   */
  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}
