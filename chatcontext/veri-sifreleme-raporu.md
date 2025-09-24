# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# PeakActivity Veri Şifreleme ve Gizlilik Analizi

## 1. Verinin Toplanması ve Yerel Şifreleme

### Masaüstü (Tauri/Rust)
- **Yerel veritabanı (SQLite/SQLCipher) şifrelemesi:**  
  `aw-qt/src-tauri/src/commands.rs` dosyasında, veritabanı açılırken `PRAGMA key = 'your-strong-encryption-key'` ile bir anahtar kullanılıyor.  
  **Eksik:** Anahtar sabit kodlanmış (`your-strong-encryption-key`). Güvenli bir anahtar yönetimi veya kullanıcıya özel anahtar üretimi yok. Anahtar kurtarma veya yedekleme mekanizması bulunmuyor.
- **AES-256-GCM ile veri şifreleme:**  
  Aynı dosyada, `encrypt_local_data` ve `decrypt_local_data` fonksiyonları ile 32 baytlık bir anahtar kullanılarak AES-256-GCM ile veri şifrelenip çözülebiliyor.  
  **Eksik:** Anahtarın nasıl üretildiği, saklandığı veya kurtarıldığına dair bir mekanizma yok. Anahtar yönetimi tamamen uygulama dışı bırakılmış.

### Web (Client-Side)
- **Client-side encryption (AES):**  
  `.github/instructions/security-auth.instructions.md`'de örnek olarak `ClientEncryption` sınıfı ile CryptoJS ve PBKDF2 kullanılarak kullanıcıdan alınan bir anahtar ile AES şifreleme yapılabileceği belirtilmiş.  
  **Eksik:** Bu kodun gerçek projede varlığı doğrulanamadı (dosya bulunamadı). Ayrıca, anahtar yönetimi ve kurtarma mekanizması yok.

---

## 2. Verinin Buluta Gönderilmesi ve Şifreleme

### Firestore ve Cloud Functions
- **Veri gönderimi:**  
  Hem masaüstü hem de web istemcisi, aktiviteleri ve hedefleri doğrudan Firestore'a veya Cloud Functions'a gönderiyor.
- **Sunucu tarafı şifreleme:**  
  Firestore'a gönderilen verilerde şifreleme yok. Sadece opsiyonel olarak anonimleştirme (hash/mask) yapılabiliyor (`aw-server/aw_server/firebase_datastore/firestore.py` ve `anonymizer.py`).  
  **Anonimleştirme:** Sadece belirli alanlar (örn. başlık, uygulama adı) hashleniyor veya maskeleniyor. Tam şifreleme yok.
- **Dış servis entegrasyonları:**  
  Trello/Jira gibi servislerin kimlik bilgileri Firestore'da düz metin olarak saklanıyor. Şifreleme veya güvenli saklama yok.

---

## 3. Verinin Çözülmesi

- **Yerel çözme:**  
  Şifreli veriler, doğru anahtar sağlandığında masaüstü uygulamasında veya client-side fonksiyonlarda çözülebiliyor.
- **Bulut çözme:**  
  Firestore'da şifreli veri saklanmadığı için çözme işlemi gerekmiyor. Anonimleştirilmiş veriler ise geri döndürülemez (hash tek yönlüdür).

---

## 4. Anahtar Yönetimi ve Kurtarma

- **Yerel anahtar:**  
  Anahtar sabit kodlanmış veya dışarıdan alınması bekleniyor. Kullanıcıya özel anahtar üretimi, anahtar yedekleme veya kurtarma mekanizması yok.
- **Bulut anahtarı:**  
  Firestore veya Cloud Functions tarafında kullanıcıya özel şifreleme anahtarı yönetimi yok. Sadece Google Secret Manager ile servis hesabı anahtarları güvenli şekilde saklanıyor (Firebase Admin SDK için).
- **Anahtar kurtarma:**  
  Kullanıcı şifreleme anahtarını kaybederse, şifreli veriye erişim imkansız. Kurtarma veya sıfırlama mekanizması yok.

---

## 5. Eksikler, Hatalar ve Geliştirme Önerileri

### Eksikler ve Hatalar
- **Anahtar yönetimi yok:**  
  Kullanıcıya özel anahtar üretimi, saklama, yedekleme ve kurtarma mekanizması eksik.
- **Sabit anahtar kullanımı:**  
  Yerel veritabanı şifrelemesinde sabit anahtar kullanılıyor, bu ciddi bir güvenlik açığıdır.
- **Bulut tarafında şifreleme yok:**  
  Firestore'a gönderilen veriler şifrelenmeden veya sadece anonimleştirilerek gönderiliyor. Hassas veriler (örn. Trello/Jira kimlik bilgileri) düz metin olarak saklanıyor.
- **Anahtar kurtarma yok:**  
  Kullanıcı anahtarını kaybederse, veriye erişim imkansız. Kurtarma veya sıfırlama mekanizması yok.
- **Şifreleme kodu ile ilgili dokümantasyon eksik:**  
  Şifreleme ve anahtar yönetimiyle ilgili uygulama içi veya kullanıcıya yönelik dokümantasyon yok.

### Geliştirme Önerileri
1. **Kullanıcıya özel anahtar yönetimi eklenmeli:**  
   - Anahtarlar kullanıcıdan parola ile türetilmeli (örn. PBKDF2, Argon2).
   - Anahtarlar güvenli şekilde saklanmalı (örn. OS keychain, donanım güvenlik modülü).
   - Anahtar yedekleme ve kurtarma (örn. kurtarma kodları, e-posta ile sıfırlama) eklenmeli.
2. **Bulut tarafında uçtan uca şifreleme uygulanmalı:**  
   - Hassas veriler istemcide şifrelenip buluta öyle gönderilmeli.
   - Sunucu tarafında şifre çözme işlemi yapılmamalı, sadece istemci çözebilmeli.
3. **Dış servis kimlik bilgileri şifrelenmeli:**  
   - Trello/Jira gibi servislerin anahtarları Firestore'da şifreli saklanmalı.
4. **Şifreleme ve gizlilikle ilgili kullanıcıya açık dokümantasyon hazırlanmalı.**
5. **Anonimleştirme ve şifreleme seçenekleri kullanıcı ayarlarından yönetilebilir olmalı.**
6. **Anahtar kaybı durumunda veri kurtarma veya sıfırlama prosedürü eklenmeli.**
7. **Şifreleme kodu ve süreçleri için otomatik testler ve güvenlik denetimleri eklenmeli.**

---

## Sonuç

Mevcut durumda uygulama, yerel veritabanı için temel bir şifreleme ve bulut tarafında opsiyonel anonimleştirme sunuyor. Ancak, anahtar yönetimi, bulut tarafında uçtan uca şifreleme ve anahtar kurtarma gibi modern güvenlik gereksinimleri eksik. Özellikle hassas verilerin (kimlik bilgileri, aktiviteler) korunması için yukarıdaki geliştirme önerileri acilen uygulanmalıdır. 