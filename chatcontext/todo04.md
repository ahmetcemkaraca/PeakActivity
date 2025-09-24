# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# PeakActivity Encryption & Security Implementation Todo List v0.4.0

## Genel Bakış
Bu todo listesi, ActivityWatch uygulamasına kapsamlı şifreleme ve güvenlik özellikleri eklemek için oluşturulmuştur. Toplam 110 adım içermektedir.

---

## 🔧 1. Altyapı ve Çekirdek Şifreleme (1-15)

### ✅ **setup-01** | Şifreleme altyapısı için yeni klasör yapısını oluştur
**Detay:** functions/src/services/encryption/, aw-server/aw_server/encryption/, aw-webui/src/services/encryption/ klasörlerini oluştur
**Bağımlılık:** Yok

### ⏳ **setup-02** | Gerekli kütüphaneleri package.json'lara ekle
**Detay:** CryptoJS, argon2, jose (JWT), @noble/crypto kütüphanelerini ekle
**Bağımlılık:** setup-01

### ⏳ **setup-03** | Rust/Tauri kütüphanelerini Cargo.toml'a ekle
**Detay:** argon2, aes-gcm, rand_chacha, keyring kütüphanelerini ekle
**Bağımlılık:** setup-01

### ✅ **core-enc-01** | BaseEncryptionService soyut sınıfını oluştur
**Detay:** Common encryption interface tanımla
**Bağımlılık:** setup-02

### ✅ **core-enc-02** | KeyDerivationService sınıfını yaz
**Detay:** PBKDF2, Argon2, key stretching implementasyonu
**Bağımlılık:** core-enc-01

### ✅ **core-enc-03** | SecureStorageService sınıfını yaz
**Detay:** Browser: IndexedDB, Desktop: OS keychain
**Bağımlılık:** core-enc-02

### ✅ **core-enc-04** | EncryptionTypes enum'unu tanımla
**Detay:** AES256GCM, ChaCha20Poly1305, XSalsa20Poly1305
**Bağımlılık:** core-enc-01

### ✅ **core-enc-05** | CryptoUtils helper fonksiyonlarını yaz
**Detay:** Random bytes, secure compare, key validation
**Bağımlılık:** core-enc-04

---

## 🔑 2. Anahtar Yönetimi (6-10)

### ✅ **key-mgmt-01** | UserKeyManager sınıfını yaz
**Detay:** User-specific key derivation ve management
**Bağımlılık:** core-enc-03

### ✅ **key-mgmt-02** | MasterKeyService sınıfını yaz
**Detay:** Master password handling, key rotation (Fonksiyonelliği KeyRotationService ve UserKeyManager tarafından karşılanmaktadır.)
**Bağımlılık:** key-mgmt-01

### ✅ **key-mgmt-03** | KeyBackupService sınıfını yaz
**Detay:** Key backup/restore mechanism
**Bağımlılık:** key-mgmt-02

### ✅ **key-mgmt-04** | EncryptionMetadata interface'ini tanımla
**Detay:** Algorithm, iv, salt, version info
**Bağımlılık:** core-enc-04

### ✅ **key-mgmt-05** | KeyRotationService sınıfını yaz
**Detay:** Automatic key rotation, migration
**Bağımlılık:** key-mgmt-03

---

## 🌐 3. Web Client-Side Şifreleme (11-20)

### ✅ **web-enc-01** | WebCryptoService sınıfını yaz
**Detay:** Browser Web Crypto API kullanarak
**Bağımlılık:** core-enc-05

### ✅ **web-enc-02** | ClientSideEncryption sınıfını yaz
**Detay:** Activity data encryption in browser
**Bağımlılık:** web-enc-01, key-mgmt-04

### ✅ **web-enc-03** | LocalStorageEncryption sınıfını yaz
**Detay:** Encrypted localStorage wrapper
**Bağımlılık:** web-enc-02

### ✅ **web-enc-04** | IndexedDBEncryption sınıfını yaz
**Detay:** Encrypted IndexedDB for large data
**Bağımlılık:** web-enc-03

### ✅ **web-enc-05** | BrowserKeyManager sınıfını yaz
**Detay:** Browser-specific key management
**Bağımlılık:** web-enc-04, key-mgmt-01

### ✅ **web-enc-06** | OfflineEncryptionCache sınıfını yaz
**Detay:** Offline data encryption cache
**Bağımlılık:** web-enc-05

### ✅ **web-enc-07** | WebEncryptionWorker sınıfını yaz
**Detay:** Web Worker for heavy encryption tasks
**Bağımlılık:** web-enc-06

### ✅ **web-enc-08** | CryptoJS fallback implementasyonunu yaz
**Detay:** Eski browser desteği için
**Bağımlılık:** web-enc-01

### ✅ **web-enc-09** | Web encryption unit testlerini yaz
**Detay:** Comprehensive test coverage
**Bağımlılık:** web-enc-08

### ✅ **web-enc-10** | Browser compatibility testlerini yaz
**Detay:** Cross-browser encryption testing
**Bağımlılık:** web-enc-09

---

## 🦀 4. Tauri/Rust Şifreleme Geliştirmeleri (21-30)

### ✅ **tauri-enc-01** | RustEncryptionService struct'ını yaz
**Detay:** Native encryption service
**Bağımlılık:** setup-03

### ✅ **tauri-enc-02** | SystemKeychain integration'ını yaz
**Detay:** Windows Credential Store, macOS Keychain, Linux Secret Service
**Bağımlılık:** tauri-enc-01

### ✅ **tauri-enc-03** | Mevcut sabit anahtar sistemini değiştir
**Detay:** Dinamik anahtar yönetimi ile değiştir
**Bağımlılık:** tauri-enc-02

### ✅ **tauri-enc-04** | UserKeyDerivation fonksiyonlarını yaz
**Detay:** Argon2 based implementation
**Bağımlılık:** tauri-enc-03

### ✅ **tauri-enc-05** | SecureMemory handling'i yaz
**Detay:** Memory protection, zeroization
**Bağımlılık:** tauri-enc-04

### ✅ **tauri-enc-06** | SQLCipher integration'ını iyileştir
**Detay:** User-specific keys kullanımı
**Bağımlılık:** tauri-enc-05

### ✅ **tauri-enc-07** | File encryption fonksiyonlarını yaz
**Detay:** Settings, logs, exports şifreleme
**Bağımlılık:** tauri-enc-06

### ✅ **tauri-enc-08** | Hardware security module desteği ekle
**Detay:** Opsiyonel HSM desteği
**Bağımlılık:** tauri-enc-07

### ✅ **tauri-enc-09** | Tauri command'larını güncelle
**Detay:** encrypt_data, decrypt_data, manage_keys
**Bağımlılık:** tauri-enc-08

### ✅ **tauri-enc-10** | Rust encryption unit testlerini yaz
**Detay:** Comprehensive test coverage
**Bağımlılık:** tauri-enc-09

---

## 📡 5. Veri Gönderim Türleri (31-45)

### ✅ **data-types-01** | DataTransmissionType enum'unu tanımla
**Detay:** RAW, ENCRYPTED_AI_ENABLED, ENCRYPTED_AI_DISABLED
**Bağımlılık:** core-enc-04

### ✅ **data-types-02** | ActivityDataProcessor sınıfını yaz
**Detay:** Data classification and processing
**Bağımlılık:** data-types-01

### ✅ **data-types-03** | PrivacyLevelManager sınıfını yaz
**Detay:** Kullanıcı privacy seviyesi yönetimi
**Bağımlılık:** data-types-02

### ✅ **data-types-04** | DataAnonymizer sınıfını iyileştir
**Detay:** Selective anonymization
**Bağımlılık:** data-types-03

### ✅ **api-raw-01** | Ham veri API endpoint'lerini yaz
**Detay:** /api/v1/activities/raw
**Bağımlılık:** data-types-04

### ✅ **api-raw-02** | Raw data validation ve sanitization'ı ekle
**Detay:** Input validation ve security
**Bağımlılık:** api-raw-01

### ✅ **api-enc-ai-01** | Şifrelenmiş+AI destekli API endpoint'lerini yaz
**Detay:** /api/v1/activities/encrypted-ai
**Bağımlılık:** data-types-04, web-enc-02

### ✅ **api-enc-ai-02** | Client-side AI processing coordinator'ını yaz
**Detay:** AI işlemleri için koordinatör
**Bağımlılık:** api-enc-ai-01

### ✅ **api-enc-ai-03** | Edge AI integration'ını yaz
**Detay:** TensorFlow.js, ONNX.js entegrasyonu
**Bağımlılık:** api-enc-ai-02

### ✅ **api-enc-ai-04** | Malicious code detection'ını yaz
**Detay:** AI data validation
**Bağımlılık:** api-enc-ai-03

### ✅ **api-enc-ai-05** | API rate limiting ve abuse protection'ı yaz
**Detay:** Security measures
**Bağımlılık:** api-enc-ai-04

### ✅ **api-enc-noai-01** | Şifrelenmiş AI desteksiz API endpoint'lerini yaz
**Detay:** /api/v1/activities/encrypted-storage
**Bağımlılık:** data-types-04, web-enc-02

### ✅ **api-enc-noai-02** | Pure storage service'ini yaz
**Detay:** No AI processing service
**Bağımlılık:** api-enc-noai-01

### ✅ **analytics-01** | Usage analytics data model'ini tanımla
**Detay:** Anonymous kullanıcı istatistikleri
**Bağımlılık:** api-enc-ai-05, api-enc-noai-02

### ✅ **analytics-02** | Privacy-compliant analytics collector'ını yaz
**Detay:** GDPR compliant data collection
**Bağımlılık:** analytics-01

### ✅ **analytics-03** | User consent manager'ını yaz
**Detay:** Analytics data sharing consent
**Bağımlılık:** analytics-02

---

## 🔐 6. Anahtar Kurtarma Sistemi (46-55)

### ✅ **recovery-01** | SecurityQuestions data model'ini oluştur
**Detay:** Güvenlik soruları veri modeli
**Bağımlılık:** key-mgmt-03

### ✅ **recovery-02** | SecurityQuestionService sınıfını yaz
**Detay:** Question management, hashing
**Bağımlılık:** recovery-01

### ✅ **recovery-03** | RecoveryCodeService sınıfını yaz
**Detay:** Backup codes generation/validation
**Bağımlılık:** recovery-02

### ⏳ **recovery-04** | KeyRecoveryService sınıfını yaz
**Detay:** Master recovery orchestration
**Bağımlılık:** recovery-03

### ✅ **recovery-05** | EmailRecoveryService sınıfını yaz
**Detay:** Email-based key recovery
**Bağımlılık:** recovery-04

### ✅ **twofa-01** | TwoFactorAuth data model'ini oluştur
**Detay:** TOTP, SMS, backup codes
**Bağımlılık:** recovery-05

### ✅ **twofa-02** | TOTPService sınıfını yaz
**Detay:** Google Authenticator, Authy desteği
**Bağımlılık:** twofa-01

### ✅ **twofa-03** | SMSService sınıfını yaz
**Detay:** SMS-based 2FA
**Bağımlılık:** twofa-02

### ✅ **twofa-04** | BackupCodesService sınıfını yaz
**Detay:** 2FA backup codes
**Bağımlılık:** twofa-03

### ✅ **twofa-05** | TwoFactorManager sınıfını yaz
**Detay:** 2FA orchestration
**Bağımlılık:** twofa-04

### ✅ **twofa-06** | WebAuthn desteği ekle
**Detay:** FIDO2, biometric authentication
**Bağımlılık:** twofa-05

---

## 🔌 7. Dış Servis Şifreleme (56-65)

### ✅ **external-enc-01** | ExternalServiceCredentials data model'ini güncelle
**Detay:** Encryption metadata eklenmesi
**Bağımlılık:** core-enc-04

### ✅ **external-enc-02** | TrelloCredentialsEncryption sınıfını yaz
**Detay:** Trello kimlik bilgileri şifreleme
**Bağımlılık:** external-enc-01, key-mgmt-01

### ✅ **external-enc-03** | JiraCredentialsEncryption sınıfını yaz
**Detay:** Jira kimlik bilgileri şifreleme
**Bağımlılık:** external-enc-02

### ⏳ **external-enc-04** | GoogleCalendarTokenEncryption sınıfını yaz
**Detay:** Google Calendar token'ları şifreleme
**Bağımlılık:** external-enc-03

### ✅ **external-enc-05** | OAuthTokenManager sınıfını yaz
**Detay:** Encrypted token storage/refresh
**Bağımlılık:** external-enc-04

### ✅ **external-enc-06** | Mevcut trello-jira-service.ts'yi güncelle
**Detay:** Encrypted credentials kullanımı
**Bağımlılık:** external-enc-05

### ⏳ **external-enc-07** | Mevcut google-calendar-service.ts'yi güncelle
**Detay:** Encrypted token kullanımı
**Bağımlılık:** external-enc-06

### ⏳ **external-enc-08** | External service migration tool'unu yaz
**Detay:** Existing credentials encryption
**Bağımlılık:** external-enc-07

---

## 🎨 8. Kullanıcı Arayüzü ve Ayarlar (66-75)

### ⏳ **ui-settings-01** | PrivacySettings Vue component'ini oluştur
**Detay:** Privacy ayarları UI
**Bağımlılık:** data-types-03

### ⏳ **ui-settings-02** | EncryptionSettings Vue component'ini oluştur
**Detay:** Şifreleme ayarları UI
**Bağımlılık:** ui-settings-01

### ⏳ **ui-settings-03** | DataSharingControls Vue component'ini oluştur
**Detay:** Veri paylaşım kontrolleri
**Bağımlılık:** ui-settings-02, analytics-03

### ⏳ **ui-settings-04** | SecurityQuestionSetup Vue component'ini oluştur
**Detay:** Güvenlik soruları kurulum UI
**Bağımlılık:** ui-settings-03, recovery-02

### ⏳ **ui-settings-05** | TwoFactorSetup Vue component'ini oluştur
**Detay:** 2FA kurulum UI
**Bağımlılık:** ui-settings-04, twofa-05

### ⏳ **ui-settings-06** | MasterPasswordSetup Vue component'ini oluştur
**Detay:** Master password kurulum UI
**Bağımlılık:** ui-settings-05, key-mgmt-02

### ⏳ **ui-settings-07** | KeyRecoveryWizard Vue component'ini oluştur
**Detay:** Anahtar kurtarma sihirbazı
**Bağımlılık:** ui-settings-06, recovery-04

### ⏳ **ui-settings-08** | ExternalServiceSetup Vue component'ini güncelle
**Detay:** Encryption support eklenmesi
**Bağımlılık:** ui-settings-07, external-enc-05

### ⏳ **ui-settings-09** | Settings sayfasına yeni security bölümünü ekle
**Detay:** Security settings integration
**Bağımlılık:** ui-settings-08

### ⏳ **ui-settings-10** | Responsive design ve accessibility iyileştirmeleri
**Detay:** UI/UX iyileştirmeleri
**Bağımlılık:** ui-settings-09

---

## 🧪 9. Test ve Güvenlik (76-85)

### ⏳ **test-unit-01** | Encryption services unit testleri yaz
**Detay:** Coverage >95% hedefi
**Bağımlılık:** core-enc-05, web-enc-09, tauri-enc-10

### ⏳ **test-unit-02** | Key management unit testleri yaz
**Detay:** Anahtar yönetimi testleri
**Bağımlılık:** key-mgmt-05, test-unit-01

### ⏳ **test-unit-03** | API endpoint unit testleri yaz
**Detay:** API endpoint testleri
**Bağımlılık:** api-enc-noai-02, test-unit-02

### ⏳ **test-integration-01** | End-to-end encryption integration testleri yaz
**Detay:** E2E encryption testleri
**Bağımlılık:** test-unit-03

### ⏳ **test-integration-02** | Cross-platform compatibility testleri yaz
**Detay:** Platform uyumluluk testleri
**Bağımlılık:** test-integration-01

### ⏳ **test-security-01** | Security audit testleri yaz
**Detay:** Penetration testing
**Bağımlılık:** test-integration-02

### ⏳ **test-security-02** | Vulnerability scanning automation'ı ekle
**Detay:** Güvenlik açığı taraması
**Bağımlılık:** test-security-01

### ⏳ **test-performance-01** | Encryption performance benchmarking yaz
**Detay:** Performans ölçümü
**Bağımlılık:** test-security-02

### ⏳ **test-performance-02** | Memory usage ve CPU impact testleri yaz
**Detay:** Kaynak kullanım testleri
**Bağımlılık:** test-performance-01

---

## 📚 10. Dokümantasyon (86-95)

### ⏳ **docs-tech-01** | Encryption architecture dökümanını yaz
**Detay:** ADR format'ında mimari belgeleri
**Bağımlılık:** Yok

### ⏳ **docs-tech-02** | API documentation'ını güncelle
**Detay:** OpenAPI/Swagger güncelleme
**Bağımlılık:** docs-tech-01, api-enc-noai-02

### ⏳ **docs-tech-03** | Key management technical guide'ını yaz
**Detay:** Teknik anahtar yönetimi kılavuzu
**Bağımlılık:** docs-tech-02, key-mgmt-05

### ⏳ **docs-tech-04** | Security implementation guide'ını yaz
**Detay:** Güvenlik implementasyon kılavuzu
**Bağımlılık:** docs-tech-03, test-security-02

### ⏳ **docs-user-01** | Privacy ve encryption kullanıcı kılavuzunu yaz
**Detay:** Son kullanıcı kılavuzu
**Bağımlılık:** ui-settings-10

### ⏳ **docs-user-02** | Setup wizard dökümanlarını yaz
**Detay:** Kurulum sihirbazı kılavuzu
**Bağımlılık:** docs-user-01

### ⏳ **docs-user-03** | Troubleshooting guide'ını yaz
**Detay:** Sorun giderme kılavuzu
**Bağımlılık:** docs-user-02

### ⏳ **docs-user-04** | FAQ dökümanını güncelle
**Detay:** Sık sorulan sorular güncelleme
**Bağımlılık:** docs-user-03

### ⏳ **docs-security-01** | SECURITY.md dosyasını güncelle
**Detay:** Güvenlik politikası güncelleme
**Bağımlılık:** docs-tech-04

### ⏳ **docs-privacy-01** | PRIVACY.md dosyasını oluştur
**Detay:** Gizlilik politikası oluşturma
**Bağımlılık:** docs-security-01

---

## 🚀 11. Deployment ve Monitoring (96-105)

### ⏳ **deployment-01** | CI/CD pipeline'ını güncelle
**Detay:** Security tests, encryption tests eklenmesi
**Bağımlılık:** test-performance-02

### ⏳ **deployment-02** | Environment variables ve secrets management'ı güncelle
**Detay:** Güvenli değişken yönetimi
**Bağımlılık:** deployment-01

### ⏳ **deployment-03** | Migration scripts'lerini yaz
**Detay:** Existing data encryption için
**Bağımlılık:** deployment-02, external-enc-08

### ⏳ **monitoring-01** | Security monitoring ve alerting ekle
**Detay:** Güvenlik izleme sistemi
**Bağımlılık:** deployment-03

### ⏳ **monitoring-02** | Encryption performance monitoring ekle
**Detay:** Şifreleme performans izleme
**Bağımlılık:** monitoring-01

---

## ✅ 12. Final Integration (106-110)

### ⏳ **final-integration-01** | Tüm component'lerin integration testi
**Detay:** Kapsamlı entegrasyon testi
**Bağımlılık:** monitoring-02, docs-privacy-01

### ⏳ **final-integration-02** | User acceptance testing
**Detay:** Kullanıcı kabul testleri
**Bağımlılık:** final-integration-01

### ⏳ **final-integration-03** | Production deployment preparation
**Detay:** Üretim dağıtım hazırlığı
**Bağımlılık:** final-integration-02

---

## 📊 İlerleme Özeti

- **Toplam Görev:** 110
- **Tamamlanan:** 51
- **Devam Eden:** 0
- **Bekleyen:** 59

## 🔄 Sonraki Adımlar

1. `external-enc-07` görevinden başlayarak Google Calendar servisini güncelle.
2. Her adımı tamamladıktan sonra bağımlı görevlere geç.
3. Test-driven development yaklaşımı kullan.
4. Her milestone'da code review yap.
5. Security audit'leri düzenli olarak gerçekleştir.

## 🎯 Önemli Notlar

- **Güvenlik:** Tüm şifreleme implementasyonları industry-standard olmalı.
- **Performance:** Encryption overhead'i minimize edilmeli.
- **Usability:** Kullanıcı deneyimi karmaşık güvenlik nedeniyle bozulmamalı.
- **Compatibility:** Cross-platform uyumluluk korunmalı.
- **Documentation:** Her feature için kapsamlı dokümantasyon. 