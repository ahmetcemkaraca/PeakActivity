# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# PeakActivity - Eksik ve Hatalı Görevler Listesi

Bu belge, PeakActivity Şifreleme ve Güvenlik Implementasyonu Todo Listesi (todo04.md) içerisinde henüz tamamlanmamış, eksik veya üzerinde çalışılması gereken görevleri içermektedir. Her görev, mevcut durumu, beklenen adımları ve olası zorlukları açıklayan detaylı bilgilerle birlikte listelenmiştir.

---

## 🔧 1. Altyapı ve Çekirdek Şifreleme

### ⏳ **setup-02** | Gerekli kütüphaneleri package.json'lara ekle
**Mevcut Durum:** `package.json` dosyalarına gerekli şifreleme kütüphaneleri (CryptoJS, argon2, jose (JWT), @noble/crypto) henüz eklenmedi. Bu kütüphaneler, client-side şifreleme ve genel kriptografik işlemler için temel teşkil etmektedir.
**Beklenen Adımlar:**
- `functions/package.json` ve `aw-webui/package.json` dosyalarına ilgili kütüphanelerin eklenmesi.
- Kütüphanelerin doğru versiyonlarının belirlenmesi ve `npm install` ile yüklenmesi.
- Mevcut bağımlılıklarla çakışma olup olmadığının kontrol edilmesi.
**Olası Zorluklar:** Bağımlılık çakışmaları, kütüphane versiyon uyumsuzlukları.
**Bağımlılık:** `setup-01` (Klasör yapısı oluşturulmuş olmalı).

### ⏳ **setup-03** | Rust/Tauri kütüphanelerini Cargo.toml'a ekle
**Mevcut Durum:** Tauri/Rust projesinin `Cargo.toml` dosyasına gerekli kriptografik kütüphaneler (argon2, aes-gcm, rand_chacha, keyring) henüz eklenmedi. Bu kütüphaneler, native (yerel) şifreleme, anahtar yönetimi ve işletim sistemi anahtarlığı (keyring) entegrasyonu için kritik öneme sahiptir.
**Beklenen Adımlar:**
- `aw-qt/src-tauri/Cargo.toml` dosyasına belirtilen Rust crate'lerinin eklenmesi.
- Crate'lerin uyumlu versiyonlarının seçilmesi.
- `cargo build` veya `cargo check` ile derleme hatalarının kontrol edilmesi.
**Olası Zorluklar:** Rust ekosistemindeki bağımlılık uyumsuzlukları, derleme hataları.
**Bağımlılık:** `setup-01` (Klasör yapısı oluşturulmuş olmalı).

---

## 🔌 7. Dış Servis Şifreleme

### ⏳ **external-enc-07** | Mevcut google-calendar-service.ts'yi güncelle
**Mevcut Durum:** `functions/src/services/google-calendar-service.ts` dosyasındaki Google Calendar token yönetimi, şifrelenmiş kimlik bilgileri (`OAuthTokenManager`) kullanacak şekilde güncellenmedi. Şu anda, token'lar muhtemelen düz metin olarak veya daha az güvenli bir yöntemle ele alınıyor.
**Beklenen Adımlar:**
- `GoogleCalendarTokenEncryption` sınıfının `google-calendar-service.ts`'ye enjekte edilmesi.
- `getGoogleCalendarClient` veya ilgili metodun, token'ları kullanmadan önce `GoogleCalendarTokenEncryption` servisi aracılığıyla çözmesi.
- Token'ların kaydedilmesi veya yenilenmesi gerektiğinde, `GoogleCalendarTokenEncryption` servisinin şifreleme metodunun kullanılması.
- Token'ların güvenli bir şekilde saklanması için `OAuthTokenManager` ile entegrasyonun sağlanması.
**Olası Zorluklar:** Asenkron işlemlerin yönetimi, hata yakalama ve kullanıcının kimlik doğrulama akışıyla entegrasyon.
**Bağımlılık:** `external-enc-06` (Trello/Jira servisi güncellenmiş olmalı).

### ⏳ **external-enc-08** | External service migration tool'unu yaz
**Mevcut Durum:** Uygulamanın mevcut kullanıcıları için halihazırda depolanmış olan dış hizmet kimlik bilgilerini (Trello, Jira, Google Calendar vb.) yeni şifreleme standartlarına uygun hale getirecek bir geçiş aracı bulunmamaktadır. Bu, eski formatta depolanan verilerin güvensiz kalmasına neden olabilir.
**Beklenen Adımlar:**
- `functions/src/services/encryption/MigrationService.ts` gibi yeni bir geçiş servisi oluşturulması.
- Bu servisin, mevcut tüm kullanıcıların şifrelenmemiş/eski formatta şifrelenmiş kimlik bilgilerini okuması.
- Okunan kimlik bilgilerinin `OAuthTokenManager` veya ilgili `*CredentialsEncryption` sınıfları aracılığıyla yeni güvenli formata şifrelenmesi.
- Şifrelenmiş verilerin güvenli depolama alanına (`Firestore` gibi) geri yazılması.
- Geçişin idempotence (tekrarlı çalıştırılabilir) olmasını sağlayacak mekanizmaların eklenmesi.
**Olası Zorluklar:** Büyük veri kümeleriyle başa çıkma, geçiş sırasında olası veri kaybını önleme, geri alma mekanizmaları.
**Bağımlılık:** `external-enc-07` (Tüm dış servis şifrelemeleri tamamlanmış olmalı).

---

## 🎨 8. Kullanıcı Arayüzü ve Ayarlar

### ⏳ **ui-settings-01** | PrivacySettings Vue component'ini oluştur
**Mevcut Durum:** Kullanıcı gizlilik ayarlarını yönetmek için özel bir Vue bileşeni henüz oluşturulmadı. Bu, kullanıcıların veri toplama seviyelerini, anonimleştirme tercihlerini ve veri paylaşım izinlerini yönetmelerini engellemektedir.
**Beklenen Adımlar:**
- `aw-webui/src/views/settings/PrivacySettings.vue` adında yeni bir Vue bileşeni oluşturulması.
- `PrivacyLevelManager` ve `UserConsentManager` servisleriyle etkileşime geçmek için gerekli UI öğelerinin (anahtarlar, onay kutuları, açılır menüler) eklenmesi.
- Kullanıcının gizlilik tercihlerini depolayan ve güncelleyen Vuex/Pinia mağaza entegrasyonu.
**Olası Zorluklar:** Karmaşık UI/UX akışları, kullanıcı geri bildirimleriyle uyumluluk, erişilebilirlik.
**Bağımlılık:** `data-types-03` (PrivacyLevelManager sınıfı mevcut olmalı).

### ⏳ **ui-settings-02** | EncryptionSettings Vue component'ini oluştur
**Mevcut Durum:** Uygulama genelinde şifreleme ayarlarını yönetmek için özel bir Vue bileşeni mevcut değil. Bu bileşen, kullanıcılara şifreleme seçeneklerini (örneğin, anahtar rotasyon sıklığı, algoritma tercihleri) özelleştirme imkanı sunmalıdır.
**Beklenen Adımlar:**
- `aw-webui/src/views/settings/EncryptionSettings.vue` adında yeni bir Vue bileşeni oluşturulması.
- `KeyRotationService` ve `MasterKeyService` (veya ilgili anahtar yönetimi servisleri) ile etkileşime geçmek için UI kontrollerinin eklenmesi.
- Şifreleme anahtarı durumunu gösteren veya anahtar rotasyonunu tetikleyen fonksiyonellik.
**Olası Zorluklar:** Güvenlik ve kullanılabilirlik arasındaki dengeyi kurma, teknik detayları kullanıcı dostu bir arayüze çevirme.
**Bağımlılık:** `ui-settings-01` (PrivacySettings bileşeni mevcut olmalı).

### ⏳ **ui-settings-03** | DataSharingControls Vue component'ini oluştur
**Mevcut Durum:** Kullanıcıların veri paylaşım izinlerini ayrıntılı olarak kontrol etmelerini sağlayan bir UI bileşeni bulunmamaktadır. Bu bileşen, `AnalyticsCollectorService` ve `UserConsentManager` ile entegre olmalı ve kullanıcıya hangi verilerin hangi seviyede paylaşıldığını net bir şekilde göstermelidir.
**Beklenen Adımlar:**
- `aw-webui/src/views/settings/DataSharingControls.vue` adında yeni bir Vue bileşeni oluşturulması.
- `analytics-03`'te tanımlanan `UserConsentManager` ile entegrasyon.
- Farklı veri toplama seviyeleri (Anonim Sistem Verileri, Anonimleştirilmiş Kullanım Verileri, Hassas Kişisel Veriler) için onay kutuları veya geçiş düğmeleri.
- Onay durumu değişikliklerinin arka uca iletilmesi.
**Olası Zorluklar:** Çok katmanlı veri paylaşım seçeneklerini net bir şekilde sunma, anlık durum güncellemeleri.
**Bağımlılık:** `ui-settings-02`, `analytics-03`.

### ⏳ **ui-settings-04** | SecurityQuestionSetup Vue component'ini oluştur
**Mevcut Durum:** Kullanıcıların güvenlik sorularını ayarlamalarını ve yönetmelerini sağlayan bir arayüz eksik. Bu bileşen, `SecurityQuestionService` ile etkileşim kurarak soruların seçilmesini, yanıtların girilmesini ve güvenli bir şekilde saklanmasını sağlamalıdır.
**Beklenen Adımlar:**
- `aw-webui/src/views/settings/SecurityQuestionSetup.vue` adında yeni bir Vue bileşeni oluşturulması.
- `recovery-02`'de tanımlanan `SecurityQuestionService` ile entegrasyon.
- Güvenlik soruları ekleme, düzenleme ve silme işlevselliği.
- Yanıtların hash'lenerek saklanması için uygun arka uç çağrılarının yapılması.
**Olası Zorluklar:** Güvenli kullanıcı girişi, yanıtların doğrulanması, arka uç ile senkronizasyon.
**Bağımlılık:** `ui-settings-03`, `recovery-02`.

### ⏳ **ui-settings-05** | TwoFactorSetup Vue component'ini oluştur
**Mevcut Durum:** İki Faktörlü Kimlik Doğrulama (2FA) ayarlarını yönetmek için bir UI bileşeni bulunmamaktadır. Bu bileşen, TOTP, SMS ve WebAuthn gibi 2FA yöntemlerini etkinleştirme/devre dışı bırakma ve yapılandırma seçeneklerini sunmalıdır.
**Beklenen Adımlar:**
- `aw-webui/src/views/settings/TwoFactorSetup.vue` adında yeni bir Vue bileşeni oluşturulması.
- `twofa-05`'te tanımlanan `TwoFactorManager` ile entegrasyon.
- Her 2FA yöntemi için ayrı bölümler (TOTP QR kodu gösterme, SMS doğrulama kodu girişi, WebAuthn kaydı).
- Yedek kodları görüntüleme ve oluşturma seçenekleri.
**Olası Zorluklar:** Farklı 2FA yöntemleri için karmaşık etkileşimler, QR kod oluşturma ve doğrulama.
**Bağımlılık:** `ui-settings-04`, `twofa-05`.

### ⏳ **ui-settings-06** | MasterPasswordSetup Vue component'ini oluştur
**Mevcut Durum:** Kullanıcıların ana parolalarını ayarlamalarını, değiştirmelerini ve yönetmelerini sağlayan bir UI bileşeni eksik. Bu, uygulamanın şifreleme anahtarlarının korunması için temel bir adımdır.
**Beklenen Adımlar:**
- `aw-webui/src/views/settings/MasterPasswordSetup.vue` adında yeni bir Vue bileşeni oluşturulması.
- `key-mgmt-02`'de belirtilen `MasterKeyService` (veya `UserKeyManager`) ile entegrasyon.
- Ana parola belirleme, mevcut parolayı doğrulayarak değiştirme işlevselliği.
- Güvenli parola giriş alanları ve parola gücü göstergeleri.
**Olası Zorluklar:** Parola karmaşıklık politikaları, güvenli şifreleme anahtarı türetme işlemlerinin UI'a yansıtılması.
**Bağımlılık:** `ui-settings-05`, `key-mgmt-02`.

### ⏳ **ui-settings-07** | KeyRecoveryWizard Vue component'ini oluştur
**Mevcut Durum:** Anahtar kurtarma sürecini adım adım yönlendiren bir sihirbaz (wizard) tarzı UI bileşeni bulunmamaktadır. Bu sihirbaz, güvenlik soruları, yedek kodlar veya e-posta tabanlı kurtarma gibi farklı yöntemleri entegre etmelidir.
**Beklenen Adımlar:**
- `aw-webui/src/views/settings/KeyRecoveryWizard.vue` adında yeni bir Vue bileşeni oluşturulması.
- `recovery-04`'te tanımlanan `KeyRecoveryService` ile entegrasyon.
- Farklı kurtarma adımları arasında geçiş sağlayan çok adımlı bir form yapısı.
- Her adımda kullanıcının girdiği bilgileri doğrulayan ve ilgili arka uç servislerini çağıran mantık.
**Olası Zorluklar:** Karmaşık akış yönetimi, kullanıcıya net geri bildirim sağlama, hata işleme.
**Bağımlılık:** `ui-settings-06`, `recovery-04`.

### ⏳ **ui-settings-08** | ExternalServiceSetup Vue component'ini güncelle
**Mevcut Durum:** Mevcut dış hizmet entegrasyon kurulum bileşenleri (Trello, Jira, Google Calendar) şifreleme desteği için güncellenmedi. Kullanıcıların girdiği kimlik bilgilerinin şifrelenerek saklanması için `OAuthTokenManager` ile entegrasyon gerekmektedir.
**Beklenen Adımlar:**
- `aw-webui/src/views/settings/ExternalServiceSetup.vue` veya ilgili dosyaların güncellenmesi.
- Kullanıcının girdiği Trello/Jira API anahtarları veya OAuth token'larının `TrelloCredentialsEncryption`, `JiraCredentialsEncryption`, `GoogleCalendarTokenEncryption` servisleri aracılığıyla şifrelenerek arka uca gönderilmesi.
- Var olan kimlik bilgilerini görüntülerken çözme işleminin güvenli bir şekilde yapılması.
**Olası Zorluklar:** Kimlik bilgilerinin UI'da geçici olarak düz metin olarak görünmesini engelleme, şifreleme/çözme performansının kullanıcı deneyimine etkisi.
**Bağımlılık:** `ui-settings-07`, `external-enc-05`.

### ⏳ **ui-settings-09** | Settings sayfasına yeni security bölümünü ekle
**Mevcut Durum:** Uygulamanın ayarlar sayfasına (genellikle `Settings.vue` veya benzeri bir ana bileşen) yeni oluşturulan tüm güvenlik ve şifreleme ayarları bileşenleri henüz entegre edilmedi. Bu, kullanıcıların bu ayarlara kolayca erişmesini engellemektedir.
**Beklenen Adımlar:**
- `aw-webui/src/views/settings/Settings.vue` veya benzeri ana ayarlar bileşeninin güncellenmesi.
- Yeni `PrivacySettings`, `EncryptionSettings`, `DataSharingControls`, `SecurityQuestionSetup`, `TwoFactorSetup`, `MasterPasswordSetup`, `KeyRecoveryWizard` ve `ExternalServiceSetup` bileşenlerinin ayrı sekmeler veya bölümler halinde eklenmesi.
- Kullanıcı dostu navigasyon ve genel bir güvenlik genel bakış sayfası.
**Olası Zorluklar:** Ayarlar sayfasının karmaşıklığını yönetme, kullanıcı navigasyonunu basitleştirme.
**Bağımlılık:** `ui-settings-08`.

### ⏳ **ui-settings-10** | Responsive design ve accessibility iyileştirmeleri
**Mevcut Durum:** Yeni eklenen güvenlik ve şifreleme ayarları UI bileşenleri için kapsamlı responsive tasarım ve erişilebilirlik (a11y) iyileştirmeleri henüz yapılmadı. Bu, farklı cihazlarda ve yardımcı teknolojilerle kullanılabilirlik sorunlarına yol açabilir.
**Beklenen Adımlar:**
- Tüm yeni UI bileşenlerinin farklı ekran boyutlarına uyumlu hale getirilmesi (`@media` sorguları, esnek düzenler).
- WCAG (Web İçeriği Erişilebilirlik Yönergeleri) standartlarına uygunluk için erişilebilirlik denetimlerinin yapılması.
- Klavye navigasyonu, ekran okuyucu desteği ve renk kontrastı gibi a11y konularının ele alınması.
**Olası Zorluklar:** Farklı cihazlarda ve tarayıcılarda tutarlı görünüm ve davranış sağlama, tüm erişilebilirlik standartlarına uyum.
**Bağımlılık:** `ui-settings-09`.

---

## 🧪 9. Test ve Güvenlik

### ⏳ **test-unit-01** | Encryption services unit testleri yaz
**Mevcut Durum:** Çekirdek şifreleme servisleri için (örn. `BaseEncryptionService`, `KeyDerivationService`, `CryptoUtils`) kapsamlı birim testleri henüz yazılmadı. Hedef, %95'in üzerinde kod kapsamı sağlamaktır.
**Beklenen Adımlar:**
- Her bir şifreleme servisindeki her bir metod için ayrı test senaryoları oluşturulması.
- Kenar durumlarının, hata senaryolarının ve farklı girdi kombinasyonlarının test edilmesi.
- Sahte (mock) bağımlılıklar kullanarak servislerin izole bir şekilde test edilmesi.
**Olası Zorluklar:** Kriptografik işlemlerin test edilmesi için doğru test verilerini oluşturma, zamanlama saldırılarına dayanıklılık gibi konuları test etme.
**Bağımlılık:** `core-enc-05`, `web-enc-09` (Web şifreleme testleri), `tauri-enc-10` (Rust şifreleme testleri).

### ⏳ **test-unit-02** | Key management unit testleri yaz
**Mevcut Durum:** Anahtar yönetimi servisleri (örn. `UserKeyManager`, `KeyBackupService`, `KeyRotationService`) için birim testleri eksik. Bu testler, anahtar oluşturma, depolama, geri alma, yedekleme ve rotasyon işlemlerinin güvenli ve doğru bir şekilde çalıştığını doğrulamalıdır.
**Beklenen Adımlar:**
- Her bir anahtar yönetimi metodunun işlevselliğinin test edilmesi.
- Parola yanlış girildiğinde, anahtar bulunamadığında gibi hata durumlarının ele alınması.
- Güvenli depolama entegrasyonlarının (sahte servisler kullanarak) test edilmesi.
**Olası Zorluklar:** Entegre sistemlerin karmaşıklığı, güvenli anahtar materyallerini test ortamında yönetme.
**Bağımlılık:** `key-mgmt-05`, `test-unit-01`.

### ⏳ **test-unit-03** | API endpoint unit testleri yaz
**Mevcut Durum:** Şifrelenmiş veri gönderim türleri için oluşturulan API uç noktalarına (RAW, ENCRYPTED_AI_ENABLED, ENCRYPTED_AI_DISABLED) yönelik birim testleri henüz yazılmadı. Bu testler, API'lerin beklendiği gibi çalıştığını ve güvenlik kurallarına uyduğunu doğrulamalıdır.
**Beklenen Adımlar:**
- Her API uç noktası için geçerli ve geçersiz isteklerle test senaryoları oluşturulması.
- Kimlik doğrulama, yetkilendirme ve veri doğrulama mekanizmalarının test edilmesi.
- Farklı veri şifreleme türleriyle (RAW, ENCRYPTED_AI_ENABLED, ENCRYPTED_AI_DISABLED) API davranışlarının test edilmesi.
**Olası Zorluklar:** Arka uç servis bağımlılıklarının (veritabanı, şifreleme servisleri) sahtelenmesi, entegrasyon testlerinden ayrımının yapılması.
**Bağımlılık:** `api-enc-noai-02`, `test-unit-02`.

### ⏳ **test-integration-01** | End-to-end encryption integration testleri yaz
**Mevcut Durum:** Uygulama genelinde uçtan uca şifreleme entegrasyon testleri (E2E) eksik. Bu testler, verinin istemci tarafından şifrelenip sunucuya gönderilmesi, sunucuda işlenmesi ve tekrar istemcide çözülerek doğru şekilde görüntülenmesi gibi tüm akışı kapsamalıdır.
**Beklenen Adımlar:**
- Gerçek bir istemci (web UI veya Tauri uygulaması) ile arka uç arasında tam bir şifreleme/çözme döngüsünün simüle edilmesi.
- Farklı veri türleri ve boyutlarıyla E2E akışlarının test edilmesi.
- Hatalı anahtar veya metadata ile şifre çözme denemeleri gibi negatif senaryoların test edilmesi.
**Olası Zorluklar:** Gerçek ortam benzeri bir test ortamı kurma, hata izleme ve hata ayıklama.
**Bağımlılık:** `test-unit-03`.

### ⏳ **test-integration-02** | Cross-platform compatibility testleri yaz
**Mevcut Durum:** Uygulamanın farklı işletim sistemleri (Windows, macOS, Linux) ve tarayıcılar (Chrome, Firefox, Edge) arasında şifreleme ve güvenlik özelliklerinin uyumluluk testleri yapılmadı. Bu testler, platforma özgü anahtar yönetimi ve şifreleme API'lerinin doğru çalıştığını doğrulamalıdır.
**Beklenen Adımlar:**
- Her desteklenen platformda ve tarayıcıda şifreleme/çözme, anahtar yönetimi ve dış servis entegrasyonlarının test edilmesi.
- Platforma özgü farklı durumların (örneğin, macOS Keychain erişim izinleri) test edilmesi.
- Otomatikleştirilmiş cross-platform test çerçevelerinin kullanılması (örneğin, Playwright, Cypress).
**Olası Zorluklar:** Farklı platformlarda test ortamlarının kurulması ve sürdürülmesi, platforma özgü hataların giderilmesi.
**Bağımlılık:** `test-integration-01`.

### ⏳ **test-security-01** | Security audit testleri yaz
**Mevcut Durum:** Uygulama üzerinde kapsamlı bir güvenlik denetimi (security audit) ve sızma testleri (penetration testing) henüz yapılmadı. Bu testler, potansiyel güvenlik açıklarını, zafiyetleri ve kötüye kullanım senaryolarını tespit etmek için hayati öneme sahiptir.
**Beklenen Adımlar:**
- Yetkili bir üçüncü taraf güvenlik firması ile sızma testi anlaşması yapılması (eğer mümkünse).
- OWASP Top 10 ve diğer güvenlik standartlarına göre manuel ve otomatik güvenlik testlerinin yapılması.
- Zafiyet tarayıcıları ve güvenlik araçlarının kullanılması.
- Tespit edilen tüm zafiyetlerin dokümante edilmesi ve önceliklendirilmesi.
**Olası Zorluklar:** Uzman güvenlik test uzmanlarına erişim, kompleks sistemlerde derinlemesine güvenlik açıklarını bulma.
**Bağımlılık:** `test-integration-02`.

### ⏳ **test-security-02** | Vulnerability scanning automation'ı ekle
**Mevcut Durum:** Sürekli Entegrasyon/Sürekli Dağıtım (CI/CD) hattına otomatik güvenlik açığı tarama araçları entegre edilmedi. Bu, yeni kod değişikliklerinin güvenlik açıklarını otomatik olarak tespit etmeyi engellemektedir.
**Beklenen Adımlar:**
- Statik Uygulama Güvenliği Testi (SAST) araçlarının (örneğin, Bandit, ESLint Security Plugin) CI/CD hattına entegre edilmesi.
- Bağımlılık güvenlik tarayıcılarının (örneğin, Dependabot, Snyk) projenize eklenmesi ve yapılandırılması.
- Dinamik Uygulama Güvenliği Testi (DAST) araçlarının (örneğin, OWASP ZAP, Burp Suite) entegrasyonu (daha sonraki aşamalarda).
- Tarama sonuçlarının raporlanması ve kritik hataların dağıtımı engellemesi için kuralların belirlenmesi.
**Olası Zorluklar:** Yanlış pozitiflerin yönetimi, CI/CD hattına entegrasyon karmaşıklığı.
**Bağımlılık:** `test-security-01`.

### ⏳ **test-performance-01** | Encryption performance benchmarking yaz
**Mevcut Durum:** Şifreleme ve şifre çözme işlemlerinin performans etkisini ölçmek için özel kıyaslama (benchmarking) testleri henüz yazılmadı. Bu testler, uygulamanın farklı veri boyutları ve kullanım senaryolarında kabul edilebilir bir performans sergilediğini doğrulamak için gereklidir.
**Beklenen Adımlar:**
- `functions` ve `aw-webui` projelerinde performans testi çerçevelerinin (örneğin, `benchmark.js` veya özel Node.js/Rust kıyaslama modülleri) kurulması.
- Farklı veri boyutlarında (küçük, orta, büyük) şifreleme ve şifre çözme hızlarının ölçülmesi.
- CPU ve bellek kullanımı gibi kaynak tüketiminin izlenmesi.
- Sonuçların raporlanması ve belirlenen performans hedefleriyle karşılaştırılması.
**Olası Zorluklar:** Tutarlı ve tekrarlanabilir kıyaslama ortamları sağlama, gerçek dünya senaryolarını simüle etme.
**Bağımlılık:** `test-security-02`.

### ⏳ **test-performance-02** | Memory usage ve CPU impact testleri yaz
**Mevcut Durum:** Uygulamanın genel bellek kullanımı ve CPU üzerindeki etkisi (özellikle şifreleme işlemleri sırasında) için detaylı testler yapılmadı. Bu testler, uygulamanın kaynak verimli çalıştığını ve potansiyel performans darboğazlarını belirlemek için önemlidir.
**Beklenen Adımlar:**
- Uygulama çalışırken bellek sızıntılarını ve CPU kullanım ani artışlarını izlemek için araçların (örneğin, Node.js `process` modülü, Rust `perf` araçları, tarayıcı geliştirici araçları) kullanılması.
- Yüksek yük altında veya uzun süreli kullanımlarda kaynak tüketiminin test edilmesi.
- Tespit edilen performans sorunlarının giderilmesi.
**Olası Zorluklar:** Performans metriklerini doğru bir şekilde yorumlama, karmaşık sistemlerde darboğazları izole etme.
**Bağımlılık:** `test-performance-01`.

---

## 📚 10. Dokümantasyon

### ⏳ **docs-tech-01** | Encryption architecture dökümanını yaz
**Mevcut Durum:** Uygulamanın şifreleme mimarisine dair kapsamlı bir teknik dokümantasyon (ADR formatında) henüz oluşturulmadı. Bu belge, şifreleme algoritmaları, anahtar yönetimi süreçleri ve veri akışlarını detaylandırmalıdır.
**Beklenen Adımlar:**
- `docs/adr/ADR-002-Encryption-Architecture.md` gibi bir dosya oluşturulması.
- Seçilen algoritmaların (AES-256-GCM, Argon2id), neden seçildiklerinin ve nasıl uygulandıklarının detaylı açıklaması.
- Anahtar türetme, saklama, rotasyon ve kurtarma süreçlerinin akış diyagramları ve açıklamaları.
- Güvenlik modelinin (tehdit modellemesi) ve alınan önlemlerin belirtilmesi.
**Olası Zorluklar:** Teknik detayları açık ve anlaşılır bir dille ifade etme, tüm mimari kararları kapsama.
**Bağımlılık:** Yok (Bu doküman bağımsız olarak başlatılabilir, ancak implementasyon bilgisine ihtiyaç duyar).

### ⏳ **docs-tech-02** | API documentation'ını güncelle
**Mevcut Durum:** Şifrelenmiş veri ve dış servis entegrasyonları için yeni ve güncellenen API uç noktalarının dokümantasyonu (OpenAPI/Swagger veya benzeri formatta) eksik. Geliştiricilerin bu API'leri doğru şekilde kullanabilmesi için güncel ve detaylı belgelere ihtiyaç vardır.
**Beklenen Adımlar:**
- `functions/src/api/routes.ts` ve ilgili API tanımlamalarının OpenAPI/Swagger formatında güncellenmesi veya yeni bir dokümantasyon dosyası oluşturulması.
- Tüm şifreleme ile ilgili API parametrelerinin (örneğin, `encryptedPayload`, `encryptionMetadata`) ve dönüş değerlerinin açıklanması.
- Kimlik doğrulama, yetkilendirme ve hata kodları hakkında bilgilerin eklenmesi.
**Olası Zorluklar:** Otomatik dokümantasyon araçlarının entegrasyonu, manuel güncellemelerin tutarlılığını sağlama.
**Bağımlılık:** `docs-tech-01`, `api-enc-noai-02`.

### ⏳ **docs-tech-03** | Key management technical guide'ını yaz
**Mevcut Durum:** Anahtar yönetimi sisteminin teknik detaylarını ve en iyi uygulamalarını açıklayan kapsamlı bir kılavuz eksik. Bu kılavuz, geliştiricilerin anahtar yönetimi ile ilgili doğru kararlar almasına yardımcı olacaktır.
**Beklenen Adımlar:**
- Anahtar türleri (ana parola anahtarı, oturum anahtarları vb.), kullanımları ve yaşam döngüleri hakkında detaylı bilgi.
- Anahtar türetme, saklama (OS keyring entegrasyonları dahil), yedekleme ve kurtarma süreçlerinin teknik açıklamaları.
- Anahtar rotasyon stratejileri ve geçiş mekanizmaları.
- Güvenli anahtar yönetimi için önerilen kodlama pratikleri.
**Olası Zorluklar:** Karmaşık kriptografik kavramları anlaşılır bir şekilde açıklama, platforma özgü detayları kapsama.
**Bağımlılık:** `docs-tech-02`, `key-mgmt-05`.

### ⏳ **docs-tech-04** | Security implementation guide'ını yaz
**Mevcut Durum:** Uygulamanın genel güvenlik implementasyonlarını ve alınan önlemleri detaylandıran bir kılavuz eksik. Bu kılavuz, güvenlik denetimleri ve yeni güvenlik özelliklerinin geliştirilmesi için referans noktası olacaktır.
**Beklenen Adımlar:**
- OWASP Top 10, Google Cloud güvenlik yönergeleri ve diğer endüstri standartlarına nasıl uyulduğunun açıklaması.
- Güvenli kodlama pratikleri, veri doğrulama ve temizleme yöntemleri.
- Hız sınırlama, kötüye kullanım koruması ve diğer güvenlik kontrollerinin implementasyonu.
- Güvenlik olay müdahale prosedürleri ve raporlama mekanizmaları.
**Olası Zorluklar:** Tüm güvenlik önlemlerini kapsamlı bir şekilde belgeleme, sürekli güncel tutma.
**Bağımlılık:** `docs-tech-03`, `test-security-02`.

### ⏳ **docs-user-01** | Privacy ve encryption kullanıcı kılavuzunu yaz
**Mevcut Durum:** Son kullanıcılar için uygulamanın gizlilik ve şifreleme özelliklerini açıklayan kullanıcı dostu bir kılavuz eksik. Bu kılavuz, kullanıcıların verilerinin nasıl korunduğunu ve gizlilik ayarlarını nasıl yöneteceklerini anlamalarına yardımcı olmalıdır.
**Beklenen Adımlar:**
- Basit ve anlaşılır bir dille şifreleme ve veri gizliliği kavramlarının açıklanması.
- Kullanıcıların gizlilik ayarlarını (veri toplama seviyeleri, anonimleştirme, veri paylaşımı) nasıl yapılandıracaklarına dair adım adım talimatlar.
- Ana parola yönetimi, 2FA kurulumu ve anahtar kurtarma süreçlerinin kullanıcı açısından açıklaması.
- Sıkça sorulan sorular (FAQ) ve sorun giderme ipuçları.
**Olası Zorluklar:** Teknik kavramları teknik olmayan bir dille basitleştirme, kullanıcıların güvenlik bilincini artırma.
**Bağımlılık:** `ui-settings-10`.

### ⏳ **docs-user-02** | Setup wizard dökümanlarını yaz
**Mevcut Durum:** Uygulamanın ilk kurulum sihirbazını (setup wizard) açıklayan bir kullanıcı dokümantasyonu eksik. Bu, yeni kullanıcıların uygulamayı ve özellikle güvenlik özelliklerini doğru bir şekilde yapılandırmasına yardımcı olacaktır.
**Beklenen Adımlar:**
- Kurulum adımlarının ekran görüntüleri veya görsellerle desteklenmesi.
- Ana parola belirleme, 2FA etkinleştirme ve temel gizlilik ayarlarının kurulum sihirbazı içerisindeki yerinin açıklanması.
- Her adımın amacının ve kullanıcı kararlarının sonuçlarının netleştirilmesi.
**Olası Zorluklar:** Kurulum sürecindeki değişiklikleri sürekli güncel tutma, görsel materyalleri yönetme.
**Bağımlılık:** `docs-user-01`.

### ⏳ **docs-user-03** | Troubleshooting guide'ını yaz
**Mevcut Durum:** Kullanıcıların karşılaşabileceği şifreleme ve güvenlik ile ilgili sorunları gidermeye yönelik bir kılavuz eksik. Bu, destek taleplerini azaltmaya ve kullanıcıların sorunlarını kendilerinin çözmesine yardımcı olacaktır.
**Beklenen Adımlar:**
- Şifreleme hataları, anahtar kaybı, 2FA sorunları gibi yaygın senaryoların listelenmesi.
- Her sorun için adım adım çözüm önerileri ve olası nedenlerin açıklaması.
- Hata mesajlarının ve logların nasıl yorumlanacağına dair basit ipuçları.
- Ne zaman destekle iletişime geçilmesi gerektiği hakkında rehberlik.
**Olası Zorluklar:** Kapsamlı bir sorun listesi oluşturma, karmaşık teknik sorunları basitleştirme.
**Bağımlılık:** `docs-user-02`.

### ⏳ **docs-user-04** | FAQ dökümanını güncelle
**Mevcut Durum:** Uygulamanın genel Sıkça Sorulan Sorular (FAQ) bölümü, yeni şifreleme ve güvenlik özellikleriyle ilgili soruları içerecek şekilde güncellenmedi. Kullanıcıların sıkça sorabileceği soruları önceden yanıtlamak önemlidir.
**Beklenen Adımlar:**
- Gizlilik, şifreleme, anahtar yönetimi ve 2FA ile ilgili potansiyel soruların belirlenmesi.
- Net ve özlü yanıtlar hazırlanması.
- Mevcut FAQ bölümüne yeni soruların entegrasyonu.
**Olası Zorluklar:** Güncel ve doğru bilgiyi sağlama, kullanıcı perspektifinden soruları tahmin etme.
**Bağımlılık:** `docs-user-03`.

### ⏳ **docs-security-01** | SECURITY.md dosyasını güncelle
**Mevcut Durum:** Projenin ana `SECURITY.md` dosyası, PeakActivity'nin yeni güvenlik implementasyonları ve politikalarıyla güncellenmedi. Bu dosya, güvenlik araştırmacıları ve geliştiriciler için önemli bir referans noktasıdır.
**Beklenen Adımlar:**
- `SECURITY.md` dosyasının açılması ve güncellenmesi.
- Uygulanan şifreleme standartları, anahtar yönetimi politikaları ve veri gizliliği önlemlerinin eklenmesi.
- Güvenlik açığı bildirim süreci, sorumlulukların açıklaması ve iletişim kanalları hakkında bilgilerin güncellenmesi.
**Olası Zorluklar:** Güvenlik politikalarının detaylarını eksiksiz ve hatasız bir şekilde iletme.
**Bağımlılık:** `docs-tech-04`.

### ⏳ **docs-privacy-01** | PRIVACY.md dosyasını oluştur
**Mevcut Durum:** Uygulama için kapsamlı bir `PRIVACY.md` dosyası henüz oluşturulmadı. Bu dosya, GDPR, CCPA gibi veri koruma yasalarına uygun olarak kullanıcı verilerinin nasıl toplandığını, işlendiğini, saklandığını ve paylaşıldığını açıkça belirtmelidir.
**Beklenen Adımlar:**
- Yeni bir `PRIVACY.md` dosyası oluşturulması.
- Veri toplama seviyeleri (Anonim Sistem Verileri, Anonimleştirilmiş Kullanım Verileri, Hassas Kişisel Veriler) ve her seviye için rıza mekanizmalarının açıklaması.
- Veri saklama politikaları, silme hakları (unutulma hakkı) ve veri taşınabilirliği.
- Veri ihlali durumunda bilgilendirme prosedürleri.
**Olası Zorluklar:** Tüm yasal gerekliliklere uyum, karmaşık yasal metinleri kullanıcı dostu hale getirme.
**Bağımlılık:** `docs-security-01`.

---

## 🚀 11. Deployment ve Monitoring

### ⏳ **deployment-01** | CI/CD pipeline'ını güncelle
**Mevcut Durum:** Sürekli Entegrasyon/Sürekli Dağıtım (CI/CD) hattı, yeni güvenlik ve şifreleme testlerini içerecek şekilde güncellenmedi. Bu, kod tabanına entegre edilen yeni güvenlik özelliklerinin otomatik olarak doğrulanmasını engellemektedir.
**Beklenen Adımlar:**
- `test-performance-02`'de tanımlanan şifreleme performans ve kaynak kullanımı testlerinin CI/CD'ye eklenmesi.
- `test-security-02`'de belirtilen güvenlik açığı taramalarının (SAST, DAST, bağımlılık taraması) CI/CD'ye entegre edilmesi.
- Yeni dağıtım adımlarının veya konfigürasyonların (örneğin, secrets yönetimi) CI/CD betiklerine dahil edilmesi.
**Olası Zorluklar:** Kompleks CI/CD yapısını anlama ve değiştirme, yeni araçların entegrasyonu.
**Bağımlılık:** `test-performance-02`.

### ⏳ **deployment-02** | Environment variables ve secrets management'ı güncelle
**Mevcut Durum:** Ortam değişkenleri ve gizli anahtar (secrets) yönetimi stratejileri, yeni şifreleme ve anahtar yönetimi gereksinimlerini karşılayacak şekilde güncellenmedi. Hassas anahtarların ve kimlik bilgilerinin güvenli bir şekilde depolanması ve dağıtılması kritik öneme sahiptir.
**Beklenen Adımlar:**
- Firebase Cloud Functions, Cloud Run veya diğer dağıtım ortamları için ortam değişkenlerinin ve gizli anahtarların (Google Secret Manager gibi) güvenli bir şekilde yapılandırılması.
- `FIREBASE_API_KEY`, `GOOGLE_CLIENT_SECRET`, `TRELLO_API_KEY` gibi hassas bilgilerin koddan çıkarılıp güvenli bir şekilde yönetilmesi.
- Dağıtım süreçlerinde bu değişkenlere erişimin kısıtlanması.
**Olası Zorluklar:** Farklı ortamlar arasında tutarlı gizli anahtar yönetimi, güvenlik politikalarına uyum.
**Bağımlılık:** `deployment-01`.

### ⏳ **deployment-03** | Migration scripts'lerini yaz
**Mevcut Durum:** Mevcut kullanıcı verilerinin (varsa) yeni şifreleme formatına geçişi için gerekli olan veri taşıma (migration) betikleri henüz yazılmadı. Bu betikler, uygulamanın eski versiyonlarından yeni, şifreli formata sorunsuz bir geçiş sağlamalıdır.
**Beklenen Adımlar:**
- Veritabanı şeması değişikliklerini (eğer varsa) ele alan migration betikleri oluşturulması.
- Var olan şifrelenmemiş verileri okuyup, yeni şifreleme servisleri (örn. `OAuthTokenManager`, `TrelloCredentialsEncryption`) kullanarak şifrelemesi.
- Şifrelenmiş verileri geri yazması ve geçişin başarılı olduğunu doğrulayan kontroller içermesi.
- Geri alma (rollback) stratejilerinin planlanması.
**Olası Zorluklar:** Büyük veri kümeleriyle çalışma, geçiş sırasında performans etkisi, veri bütünlüğünü koruma.
**Bağımlılık:** `deployment-02`, `external-enc-08`.

### ⏳ **monitoring-01** | Security monitoring ve alerting ekle
**Mevcut Durum:** Şifreleme ve güvenlik ile ilgili olayları (örneğin, başarısız şifre çözme denemeleri, anahtar erişim hataları) izlemek ve bunlara karşı uyarılar oluşturmak için bir sistem mevcut değil. Bu, güvenlik ihlallerinin veya anormal davranışların erken tespitini engellemektedir.
**Beklenen Adımlar:**
- Kritik güvenlik olayları için loglama mekanizmalarının eklenmesi (örneğin, yanlış anahtar kullanımı, yetkisiz erişim denemeleri).
- Logların merkezi bir izleme sistemine (Google Cloud Monitoring, Prometheus/Grafana gibi) aktarılması.
- Anormal durumlar için uyarı kurallarının belirlenmesi ve yapılandırılması (PagerDuty, Slack entegrasyonları).
**Olası Zorluklar:** Güvenlik olaylarını doğru bir şekilde tanımlama, false-positive uyarıları azaltma.
**Bağımlılık:** `deployment-03`.

### ⏳ **monitoring-02** | Encryption performance monitoring ekle
**Mevcut Durum:** Şifreleme ve şifre çözme işlemlerinin gerçek zamanlı performansını izlemek için bir sistem eksik. Bu, performans darboğazlarını veya aşırı kaynak tüketimini hızlı bir şekilde tespit etmeyi engellemektedir.
**Beklenen Adımlar:**
- Şifreleme/çözme latansı, işlem süresi ve kaynak tüketimi gibi metriklerin toplanması.
- Bu metriklerin bir izleme panosunda (örneğin, Grafana, Google Cloud Monitoring) görselleştirilmesi.
- Performans eşikleri aşıldığında uyarıların tetiklenmesi.
**Olası Zorluklar:** Metrik toplama entegrasyonu, performans verilerinin görselleştirilmesi ve analizi.
**Bağımlılık:** `monitoring-01`.

---

## ✅ 12. Final Integration

### ⏳ **final-integration-01** | Tüm component'lerin integration testi
**Mevcut Durum:** Tüm şifreleme, anahtar yönetimi, dış servis entegrasyonları, UI ayarları ve arka uç servislerinin tam entegrasyon testleri henüz yapılmadı. Bu, sistemin bir bütün olarak beklendiği gibi çalıştığını doğrulamak için kritik öneme sahiptir.
**Beklenen Adımlar:**
- Uygulamanın tüm katmanlarını içeren (ön uç, arka uç, veritabanı, şifreleme servisleri) kapsamlı entegrasyon test senaryolarının yazılması.
- Farklı kullanıcı senaryolarının (kayıt, giriş, ayar değiştirme, veri senkronizasyonu) uçtan uca test edilmesi.
- Performans ve güvenlik testleriyle birlikte çalıştırılması.
**Olası Zorluklar:** Karmaşık entegrasyon test ortamlarının kurulması ve sürdürülmesi, tüm olası etkileşimleri kapsama.
**Bağımlılık:** `monitoring-02`, `docs-privacy-01`.

### ⏳ **final-integration-02** | User acceptance testing
**Mevcut Durum:** Uygulamanın güvenlik ve şifreleme özelliklerinin son kullanıcılar tarafından kabul testleri (UAT) henüz yapılmadı. Bu, kullanıcı deneyiminin bozulmadığını ve güvenlik özelliklerinin kullanıcılar tarafından anlaşılıp kullanılabildiğini doğrulamak için önemlidir.
**Beklenen Adımlar:**
- Hedef kullanıcı kitlesinden bir grup seçilerek beta testleri düzenlenmesi.
- Kullanıcıların yeni güvenlik özelliklerini (ana parola, 2FA, gizlilik ayarları) kullanmalarının izlenmesi ve geri bildirim toplanması.
- Kullanılabilirlik sorunlarının, karışıklıkların veya güvenlik açıklarının kullanıcı perspektifinden tespit edilmesi.
- Toplanan geri bildirimlere göre iyileştirmelerin yapılması.
**Olası Zorluklar:** Kullanıcıların katılımını sağlama, sübjektif geri bildirimleri somut iyileştirmelere çevirme.
**Bağımlılık:** `final-integration-01`.

### ⏳ **final-integration-03** | Production deployment preparation
**Mevcut Durum:** Uygulamanın şifreleme ve güvenlik özellikleriyle üretim ortamına dağıtımı için gerekli tüm hazırlıklar henüz tamamlanmadı. Bu, son kontrolleri, güvenlik denetimlerini ve dağıtım planlamasını içerir.
**Beklenen Adımlar:**
- Tüm güvenlik denetimlerinin ve sızma testlerinin tamamlandığından emin olunması.
- Acil durum ve geri alma (rollback) planlarının gözden geçirilmesi ve test edilmesi.
- Dağıtım öncesi son kontrollerin (checklist) yapılması.
- Monitoring ve alerting sistemlerinin üretim ortamına uygun şekilde yapılandırıldığının doğrulanması.
- Dağıtımın aşamalı olarak yapılması (örneğin, küçük bir kullanıcı grubuna pilot dağıtım).
**Olası Zorluklar:** Üretim ortamının karmaşıklığı, risk yönetimi, kesintisiz dağıtım sağlama.
**Bağımlılık:** `final-integration-02`. 