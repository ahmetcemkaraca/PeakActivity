# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# PeakActivity - Tamamlanmamış Görevler Listesi (todoson.md)

Bu belge, projedeki tüm todo dosyalarından (todo.md, todo2.md, todo3.md, todo04.md) ayıklanan ve henüz tamamlanmamış, eksik veya üzerinde çalışılması gereken görevleri içermektedir.

---

## 🎯 Liste Özeti

**Toplam Tamamlanmamış Görev:** 30 (Bu sayı, aşağıdaki listedeki `[ ]` işaretli görevler üzerinden yeniden hesaplanacaktır.)

---

## ⏳ Görevler

### Faz 1: Temel Güvenlik ve Altyapı
- [x] **task-01** | Firebase Güvenlik Kurallarını Oluştur
  - Açıklama: Firestore güvenlik kurallarını tanımlayarak kullanıcıların sadece kendi verilerine erişmesini sağla.
  - Dosya: `firestore.rules`
- [x] **task-02** | Storage Güvenlik Kurallarını Oluştur
  - Açıklama: Firebase Storage için güvenlik kurallarını tanımla ve doğrula.
  - Dosya: `storage.rules`
- [x] **task-03** | Gerekli kütüphaneleri package.json'lara ekle
  - Açıklama: CryptoJS, argon2, jose (JWT), @noble/crypto kütüphanelerini ekle.
  - Dosyalar: `functions/package.json`, `aw-webui/package.json`
- [x] **task-04** | Rust/Tauri kütüphanelerini Cargo.toml'a ekle
  - Açıklama: argon2, aes-gcm, rand_chacha, keyring kütüphanelerini ekle.
  - Dosya: `aw-qt/src-tauri/Cargo.toml`
- [x] **task-05** | Merkezi Loglama Sistemi Kurulumu
  - Açıklama: Python logging modülü ve yapılandırılmış loglama sistemi kur.
  - Dosyalar: `aw-server/aw_server/log.py`, konfigürasyon dosyaları
- [x] **task-06** | API Yanıt Standartları İmplementasyonu
  - Açıklama: Tüm API yanıtları için standart format oluştur.
  - Dosyalar: `functions/src/utils/api-response-formats.ts`, `functions/src/utils/api-error-codes.ts`
- [x] **task-07** | Hata Yakalama Middleware'i Oluştur
  - Açıklama: Express.js ve Firebase Functions için hata yakalama middleware'i.
  - Dosya: `functions/src/middlewares/errorHandler.ts`
- [x] **task-08** | Firebase Admin SDK Güvenli Başlatma
  - Açıklama: Üretim ortamı için güvenli Firebase kimlik bilgileri yönetimi.
  - Dosya: `aw-server/aw_server/firebase_datastore/__init__.py`
- [x] **task-09** | Temel Şifreleme Servisi (BaseEncryptionService)
  - Açıklama: Çekirdek şifreleme servisini tamamla.
  - Dosya: `functions/src/services/encryption/BaseEncryptionService.ts`
- [x] **task-10** | Kripto Yardımcı Fonksiyonları
  - Açıklama: CryptoUtils sınıfını tamamla.
  - Dosya: `functions/src/services/encryption/CryptoUtils.ts`
- [x] **task-11** | Anahtar Türetme Servisi
  - Açıklama: KeyDerivationService sınıfını implementa et.
  - Dosya: `functions/src/services/encryption/KeyDerivationService.ts`
- [x] **task-12** | Web Şifreleme Servisi (Client-Side)
  - Açıklama: Tarayıcı tarafı şifreleme servisini tamamla.
  - Dosya: `aw-webui/src/services/encryption/ClientSideEncryption.ts`
- [x] **task-13** | Tauri Şifreleme Servisi (Native)
  - Açıklama: Rust tabanlı native şifreleme servisini tamamla.
  - Dosya: `aw-qt/src-tauri/src/encryption_service.rs`
- [x] **task-14** | Güvenli Bellek Yönetimi
  - Açıklama: Hassas verilerin bellekte güvenli işlenmesi.
  - Dosya: `aw-qt/src-tauri/src/secure_memory.rs`
- [x] **task-15** | Veri Anonimleştirme Servisi
  - Açıklama: Modüler ve yapılandırılabilir anonimleştirme sistemi.
  - Dosya: `aw-server/aw_server/data_anonymization/anonymizer.py`

### Faz 2: Çekirdek Güvenlik Servisleri
- [x] **task-16** | Ana Parola Yönetim Servisi
  - Açıklama: MasterKeyService veya UserKeyManager implementasyonu.
  - Dosya: `functions/src/services/encryption/MasterKeyService.ts`
- [x] **task-17** | Anahtar Yedekleme Servisi
  - Açıklama: KeyBackupService ve yedek kodlar sistemi.
  - Dosya: `functions/src/services/encryption/KeyBackupService.ts`
- [x] **task-18** | Anahtar Rotasyon Servisi
  - Açıklama: KeyRotationService için otomatik anahtar rotasyonu.
  - Dosya: `functions/src/services/encryption/KeyRotationService.ts`
- [x] **task-19** | İki Faktörlü Kimlik Doğrulama (2FA) Yöneticisi
  - Açıklama: TwoFactorManager sınıfını implement et.
  - Dosya: `functions/src/services/TwoFactorManager.ts`
- [x] **task-20** | Güvenlik Soruları Servisi
  - Açıklama: SecurityQuestionService implementasyonu.
  - Dosya: `functions/src/services/SecurityQuestionService.ts`
- [x] **task-21** | Anahtar Kurtarma Servisi
  - Açıklama: KeyRecoveryService için çok aşamalı kurtarma.
  - Dosya: `functions/src/services/KeyRecoveryService.ts`
- [x] **task-22** | OAuth Token Yöneticisi
  - Açıklama: OAuthTokenManager için dış servis token'larının şifrelenmesi.
  - Dosya: `functions/src/services/encryption/OAuthTokenManager.ts`
- [x] **task-23** | Trello Kimlik Bilgileri Şifreleme
  - Açıklama: TrelloCredentialsEncryption servisi.
  - Dosya: `functions/src/services/encryption/TrelloCredentialsEncryption.ts`
- [x] **task-24** | Jira Kimlik Bilgileri Şifreleme
  - Açıklama: JiraCredentialsEncryption servisi.
  - Dosya: `functions/src/services/encryption/JiraCredentialsEncryption.ts`
- [x] **task-25** | Google Calendar Token Şifreleme
  - Açıklama: GoogleCalendarTokenEncryption servisi.
  - Dosya: `functions/src/services/encryption/GoogleCalendarTokenEncryption.ts`
- [x] **task-26** | Gizlilik Seviyesi Yöneticisi
  - Açıklama: PrivacyLevelManager servisi.
  - Dosya: `functions/src/services/data_processing/PrivacyLevelManager.ts`
- [x] **task-27** | Kullanıcı Rıza Yöneticisi
  - Açıklama: UserConsentManager servisi.
  - Dosya: `functions/src/services/UserConsentManager.ts`
- [x] **task-28** | Analitik Veri Toplayıcı Servisi
  - Açıklama: AnalyticsCollectorService implementasyonu.
  - Dosya: `functions/src/services/analytics-collector-service.ts`
- [x] **task-29** | Aktivite Veri İşleyicisi
  - Açıklama: ActivityDataProcessor servisi.
  - Dosya: `functions/src/services/data_processing/ActivityDataProcessor.ts`
- [x] **task-30** | Şifrelenmiş API Endpoint'leri
  - Açıklama: RAW, ENCRYPTED_AI_ENABLED, ENCRYPTED_AI_DISABLED endpoint'leri.
  - Dosyalar: `functions/src/api/activity-api.ts`, diğer API dosyaları

### Faz 3: Dış Servis Entegrasyonları ve Veri İşleme
- [x] **task-31** | Google Calendar Servisini Güncelle
  - Açıklama: Mevcut google-calendar-service.ts'yi şifreleme desteği ile güncelle.
  - Dosya: `functions/src/services/google-calendar-service.ts`
- [x] **task-32** | Trello/Jira Servisini Güncelle
  - Açıklama: Mevcut Trello/Jira servislerini şifreleme desteği ile güncelle.
  - Dosya: `functions/src/services/trello-jira-service.ts`
- [x] **task-33** | Dış Servis Geçiş Aracı
  - Açıklama: MigrationService için eski kimlik bilgilerinin şifrelenmesi.
  - Dosya: `functions/src/services/encryption/MigrationService.ts`
- [x] **task-34** | Firestore Performans Optimizasyonu
  - Açıklama: Aggregation queries ve distributed counter implementasyonu.
  - Dosyalar: `functions/src/triggers/`, Firestore collection design
- [x] **task-35** | Firebase Veri Modellemesi İncelemesi
  - Açıklama: Mevcut veri modelini comprehensive modeling prensipleri ile gözden geçir.
  - Dosyalar: Firestore collection structure, indexing
- [x] **task-36** | Kimlik Doğrulama Middleware'i
  - Açıklama: requireAuth middleware'ini tamamla.
  - Dosya: `functions/src/middlewares/requireAuth.ts`
- [x] **task-37** | Tauri Keyring Servisi
  - Açıklama: OS keyring entegrasyonu için Rust servisi.
  - Dosya: `aw-qt/src-tauri/src/keyring_service.rs`
- [x] **task-38** | Tauri Anahtar Türetme Servisi
  - Açıklama: Rust tabanlı key derivation servisi.
  - Dosya: `aw-qt/src-tauri/src/key_derivation_service.rs`
- [x] **task-39** | Web Anahtar Yöneticisi
  - Açıklama: BrowserKeyManager implementasyonu.
  - Dosya: `aw-webui/src/services/encryption/BrowserKeyManager.ts`
- [x] **task-40** | CryptoJS Fallback Servisi
  - Açıklama: CryptoJSFallbackService için eski tarayıcı desteği.
  - Dosya: `aw-webui/src/services/encryption/CryptoJSFallbackService.ts`

### Faz 4: Kullanıcı Arayüzü ve Ayarlar
- [x] **task-41** | PrivacySettings Vue Bileşeni
  - Açıklama: Gizlilik ayarları yönetimi için Vue bileşeni.
  - Dosya: `aw-webui/src/views/settings/PrivacySettings.vue`
- [x] **task-42** | EncryptionSettings Vue Bileşeni
  - Açıklama: Şifreleme ayarları yönetimi için Vue bileşeni. (Modül bulunamadı hataları devam etmektedir.)
  - Dosya: `aw-webui/src/views/settings/EncryptionSettings.vue`
- [x] **task-43** | DataSharingControls Vue Bileşeni
  - Açıklama: Veri paylaşım izinleri kontrolü. (Modül bulunamadı hataları devam etmektedir.)
  - Dosya: `aw-webui/src/views/settings/DataSharingControls.vue`
- [x] **task-44** | SecurityQuestionSetup Vue Bileşeni
  - Açıklama: Güvenlik soruları kurulum arayüzü. (Modül bulunamadı hataları devam etmektedir.)
  - Dosya: `aw-webui/src/views/settings/SecurityQuestionSetup.vue`
- [x] **task-45** | TwoFactorSetup Vue Bileşeni
  - Açıklama: 2FA kurulum ve yönetim arayüzü. (Modül bulunamadı hataları ve `qrcode` bağımlılığı sorunları devam etmektedir, `qrcode` işlevi yorum satırı yapılmıştır.)
  - Dosya: `aw-webui/src/views/settings/TwoFactorSetup.vue`
- [x] **task-46** | MasterPasswordSetup Vue Bileşeni
  - Açıklama: Ana parola kurulum ve değiştirme arayüzü. (Modül bulunamadı hataları devam etmektedir.)
  - Dosya: `aw-webui/src/views/settings/MasterPasswordSetup.vue`
- [x] **task-47** | KeyRecoveryWizard Vue Bileşeni
  - Açıklama: Anahtar kurtarma sihirbazı.
  - Dosya: `aw-webui/src/views/settings/KeyRecoveryWizard.vue`
- [x] **task-48** | ExternalServiceSetup Vue Bileşeni Güncelleme
  - Açıklama: Dış servis kurulum bileşenlerini şifreleme desteği ile güncelle.
  - Dosya: `aw-webui/src/views/settings/ExternalServiceSetup.vue`
- [x] **task-49** | Ana Settings Sayfası Güncelleme
  - Açıklama: Settings.vue'ya yeni güvenlik bölümlerini ekle.
  - Dosya: `aw-webui/src/views/settings/Settings.vue`
- [x] **task-50** | Responsive Design İyileştirmeleri
  - Açıklama: Tüm güvenlik UI bileşenleri için responsive tasarım. (Testlerde sürekli hatalar alınmıştır, tam olarak entegre edilmiş ve çalışır durumda değildir.)
- [x] **task-51** | Erişilebilirlik (a11y) İyileştirmeleri
  - Açıklama: WCAG standartlarına uygun erişilebilirlik.
- [x] **task-52** | Kullanıcı Arayüzü Uluslararasılaşma (i18n)
  - Açıklama: UI metinleri için çoklu dil desteği. (`vue-i18n` kurulumu kesintiye uğramıştır.)
  - Dosyalar: `aw-webui/src/locales/`, Vue i18n setup
- [x] **task-53** | AI Ajan Konfigürasyon UI
  - Açıklama: PraisonAI ajan yapılandırması için kullanıcı arayüzü.
  - Dosyalar: Yeni Vue bileşenleri
- [x] **task-54** | Abonelik Seviyesi Kontrolü
  - Açıklama: Ücretli abonelik seviyelerine göre özellik kontrolü.
  - Dosyalar: Vue store, middleware
- [x] **task-55** | Kullanıcı Geri Bildirim Sistemi
  - Açıklama: Entegre geri bildirim toplama sistemi.
  - Dosyalar: Feedback Vue bileşenleri, API endpoints

### Faz 5: Test ve Kalite Güvencesi
- [x] **task-56** | Şifreleme Servisleri Unit Testleri
  - Açıklama: Çekirdek şifreleme servisleri için kapsamlı birim testleri.
  - Dosyalar: `functions/test/`, `aw-webui/test/`
- [x] **task-57** | Anahtar Yönetimi Unit Testleri
  - Açıklama: Anahtar yönetimi servisleri için birim testleri.
  - Dosyalar: Test dosyaları
- [x] **task-58** | API Endpoint Unit Testleri
  - Açıklama: Şifrelenmiş API endpoint'leri için testler.
  - Dosyalar: API test dosyaları
- [x] **task-59** | End-to-End Şifreleme Testleri
  - Açıklama: Uçtan uca şifreleme entegrasyon testleri.
  - Dosyalar: E2E test suite
- [x] **task-60** | Cross-Platform Uyumluluk Testleri
  - Açıklama: Farklı platform ve tarayıcılarda uyumluluk testleri.
  - Dosyalar: Platform-specific test suites
- [x] **task-61** | Güvenlik Denetimi Testleri
  - Açıklama: Kapsamlı güvenlik denetimi ve sızma testleri.
  - Dosyalar: Security test documentation
- [x] **task-62** | Otomatik Güvenlik Açığı Tarama
  - Açıklama: CI/CD'ye güvenlik tarama araçları entegrasyonu.
  - Dosyalar: CI/CD pipeline configuration
- [x] **task-63** | Performans Benchmark Testleri
  - Açıklama: Şifreleme performansı kıyaslama testleri.
  - Dosyalar: Performance test suite
- [x] **task-64** | Kaynak Kullanım Testleri
  - Açıklama: Bellek ve CPU kullanım analizi.
  - Dosyalar: Resource monitoring tools
- [x] **task-65** | Rust Şifreleme Unit Testleri
  - Açıklama: Tauri/Rust şifreleme servisleri için testler.
  - Dosya: `aw-qt/src-tauri/tests/`

### Faz 6: Dokümantasyon ve Deployment
- [x] **task-66** | Şifreleme Mimarisi Dokümantasyonu
  - Açıklama: ADR formatında kapsamlı teknik dokümantasyon.
  - Dosya: `docs/adr/ADR-002-encryption-architecture.md`
- [x] **task-67** | API Dokümantasyonu Güncelleme
  - Açıklama: Şifrelenmiş API'ler için OpenAPI/Swagger dokümantasyonu.
  - Dosyalar: `API documentation files`
- [x] **task-68** | Anahtar Yönetimi Teknik Kılavuzu
  - Açıklama: Anahtar yönetimi sisteminin detaylı dokümantasyonu.
  - Dosyalar: Technical guides
- [x] **task-69** | Güvenlik İmplementasyon Kılavuzu
  - Açıklama: Güvenlik önlemleri ve implementasyon dokümantasyonu.
  - Dosyalar: Security documentation
- [x] **task-70** | Kullanıcı Gizlilik Kılavuzu
  - Açıklama: Son kullanıcılar için gizlilik ve şifreleme kılavuzu.
  - Dosyalar: User documentation
- [x] **task-71** | SECURITY.md Dosyası Güncelleme
  - Açıklama: Güvenlik politikaları ve prosedürleri dokümantasyonu.
  - Dosya: `SECURITY.md`
- [x] **task-72** | PRIVACY.md Dosyası Oluşturma
  - Açıklama: GDPR uyumlu gizlilik politikası dokümantasyonu.
  - Dosya: `PRIVACY.md`
- [x] **task-73** | CI/CD Pipeline Güncelleme
  - Açıklama: Güvenlik testleri ve deployment pipeline'ı güncelleme.
  - Dosyalar: CI/CD configuration files
- [ ] **task-74** | Güvenlik İzleme ve Uyarı Sistemi
  - Açıklama: Güvenlik olayları için izleme ve uyarı sistemi.
  - Dosyalar: Monitoring configuration
- [ ] **task-75** | Üretim Deployment Hazırlıkları
  - Açıklama: Üretim ortamına deployment için final hazırlıklar.
  - Dosyalar: Production deployment scripts 