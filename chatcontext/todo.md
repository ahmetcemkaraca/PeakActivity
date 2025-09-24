# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
### 1. Firebase Güvenlik Kuralları Tanımlaması ve Yönetimi
    *   **Mevcut Durum:** Python kodları Firestore ile etkileşim kurarken, güvenlik kurallarının kod tabanında açıkça tanımlanmadığı ve yönetilmediği gözlemlenmiştir. Bu kurallar, istemci tarafındaki yetkilendirmeyi ve veri bütünlüğünü sağlamak için kritik öneme sahiptir.
    *   **Yapılacaklar:**
        *   `firestore.rules` dosyası oluşturularak kullanıcıların kendi verilerine (`users/{user_id}/buckets/{bucket_id}/events/{event_id}` gibi) erişimini kontrol eden güvenlik kuralları açıkça tanımlanacak.
        *   `request.auth.uid` kullanılarak kimlik doğrulanmış kullanıcının yalnızca kendi verilerine erişmesi sağlanacak, diğer kullanıcıların verilerine erişmesi engellenecek.
        *   Kuralların veri hassasiyetine göre okuma/yazma izinleri kısıtlanacak (örneğin, anonimleştirilmiş verilerin herkes tarafından okunabilir olması, hassas verilerin belirli rollerdeki kullanıcılar tarafından okunması).
        *   Güvenlik kurallarının uygulama geliştirilirken "şema gibi" düşünülerek yazılması ve bir CI/CD hattında birim testlerinin yapılması sağlanacak.

### 2. Üretim Ortamında Firebase Kimlik Bilgileri Yönetimi
    *   **Mevcut Durum:** `PeakActivityMain/aw-server/aw_server/firebase_datastore/__init__.py` dosyasındaki `initialize_firebase` fonksiyonu, `credentials.ApplicationDefault()` kullanarak Firebase Admin SDK'yı başlatmaktadır ve üretim ortamı için daha güvenli bir yöntem kullanılması gerektiği ile ilgili bir `TODO` notu içermektedir.
    *   **Yapılacaklar:**
        *   Üretim ortamında `serviceAccountKey.json` dosyasını doğrudan kodun içine yerleştirmek yerine, Google Cloud IAM hizmet hesapları veya Güvenlik Yöneticisi (Secret Manager) gibi daha güvenli yöntemlerle kimlik bilgilerinin yüklenmesi sağlanacak.

### 3. Veri Anonimleştirme Mekanizmasının Geliştirilmesi
    *   **Mevcut Durum:** `PeakActivityMain/aw-server/aw_server/firebase_datastore/firestore.py` dosyasındaki `insert` ve `replace_last` metotlarında basit bir veri anonimleştirme (`[Anonimleştirilmiş Başlık]`, `[Anonimleştirilmiş Uygulama]`) bulunmaktadır. Yorum satırında `hashlib.sha256` ile hashleme önerisi mevcuttur.
    *   **Yapılacaklar:**
        *   Anonimleştirme mantığı daha modüler hale getirilecek ve yapılandırılabilir bir hizmet olarak tasarlanacak.
        *   Gerçekçi senaryolarda `hashlib` gibi kütüphaneler kullanılarak daha güçlü ve geri döndürülemez anonimleştirme yöntemleri uygulanacak.
        *   Kullanıcının gizlilik tercihleri doğrultusunda hangi alanların anonimleştirileceği dinamik olarak belirlenebilmelidir.

### 4. Firestore Sorgu Performansı Optimizasyonu
    *   **Mevcut Durum:** `FirestoreEventDB` sınıfındaki `get_eventcount` metodu, `query.get()` kullanarak tüm belgeleri çekip Python tarafında sayım yapmaktadır. Firestore dokümantasyonunda [Understand Cloud Firestore billing](https://firebase.google.com/docs/firestore/pricing) belirtildiği gibi bu, büyük koleksiyonlar için pahalı bir işlem olabilir ve Cloud Functions ile toplu sayım (aggregation queries) önerilir.
    *   **Yapılacaklar:**
        *   Büyük koleksiyonlar için etkinlik sayısını daha verimli bir şekilde almak amacıyla Firebase Cloud Functions'da bir toplu sayım (aggregation query) veya dağıtılmış sayaç (distributed counter) mekanizması uygulanacak.

### 5. Hata Yönetimi ve Loglama
    *   **Mevcut Durum:** `PeakActivityMain/aw-server/aw_server/firebase_datastore/__init__.py` dosyasındaki Firebase başlatma hatası basitçe `print` ile loglanmaktadır.
    *   **Yapılacaklar:**
        *   Hata yönetimi ve loglama mekanizması geliştirilecek.
        *   Python'ın standart `logging` modülü kullanılarak daha yapılandırılmış ve seviyelendirilmiş loglama yapılacak.
        *   Hatalar izleme sistemlerine (örneğin, Google Cloud Logging, Firebase Crashlytics) gönderilecek.
        *   `Project-Standards-and-Guidelines.mdc` belgesinde belirtildiği gibi, tüm hatalar tam bağlam, kullanıcı etkisi ve yığın izi ile günlüğe kaydedilecek ve merkezi günlük kaydı hem arka uç hem de ön uç için kullanılacak.
        *   Hata mesajlarına ilgili bağlam (kullanıcı kimliği, istek kimliği, giriş verileri) eklenecek ve tüm istisnalar için yığın izleri yakalanacak.
        *   Hassas bilgileri günlüklere kaydetmekten kaçınılacak ve üretim günlükleri için yapılandırılmış günlük kaydı (örn. JSON) kullanılacak.

### 6. Belgeleme ve Kod Yorumları
    *   **Mevcut Durum:** Mevcut kodda bazı yorumlar ve Türkçe metinler bulunmaktadır.
    *   **Yapılacaklar:**
        *   Kodun okunabilirliğini ve bakımını artırmak için tüm değişken, fonksiyon ve sınıf adları İngilizce olacak ve belge içinde tutarlılık sağlanacak.
        *   Karmaşık mantık içeren kısımlara daha açıklayıcı yorumlar eklenecek.
        *   Özellikle API'lerle ilgili kısımlarda, hangi verilerin neden nasıl işlendiği daha detaylı açıklanacak.
        *   `Project-Standards-and-Guidelines.mdc` belgesinde belirtildiği gibi, tüm genel API'ler, modüller ve karmaşık mantık, kullanım örnekleriyle İngilizce olarak belgelenecek.

### 7. Kullanıcı Arayüzü Entegrasyonu (Gelecek Adımlar)
    *   **Mevcut Durum:** Kullanıcı arayüzü (Vue.js tabanlı) ajanları yapılandırmak, tetiklemek ve çıktılarını görüntülemek için yeni bileşenler içermemektedir.
    *   **Yapılacaklar:**
        *   Ajan yapılandırmalarını (YAML/JSON) girmek için bir form eklenecek.
        *   Bir ajanı belirli bir konuyla tetiklemek için bir düğme eklenecek.
        *   Ajanın ilerlemesini ve çıktılarını görüntülemek için bir günlük veya gösterge tablosu eklenecek.
        *   Ücretli abonelik seviyelerine göre ajan tetikleme sıklığını yapılandırma seçenekleri eklenecek.
        *   `Project-Standards-and-Guidelines.mdc` belgesinde belirtildiği gibi, tüm kullanıcı arayüzleri uluslararasılaşma (i18n) ve erişilebilirlik (a11y) standartlarını destekleyecek.
        *   Tüm kullanıcı arayüzü metinleri harici kaynak dosyalarında (örn. JSON, PO) tutulacak ve metinlerin çeviri için uygun olduğundan emin olunacak (kodu sabit dizeler içermeyin).
        *   Sağdan sola (RTL) diller için düzen desteği sağlanacak.
        *   Tarih, saat ve sayı formatları yerel ayarlara göre biçimlendirilecek.
        *   Renk kontrastı, klavye gezintisi ve ekran okuyucu uyumluluğu için WCAG yönergeleri takip edilecek.
        *   Tüm görüntüler ve medya için alternatif metinler sağlanacak ve Erişilebilirlik denetimleri (örn. Lighthouse) düzenli olarak çalıştırılacak.
        *   Kullanıcıların tercih ettiği dili ve bölgesel ayarları seçmelerine izin verilecek.

### 8. Genel Kod İyileştirmeleri ve Best Practices
    *   **Yapılacaklar:**
        *   Kod tabanında tutarlılık sağlamak adına linting ve kod formatlama araçları (örneğin, Black, ESLint, Prettier) entegre edilecek ve CI/CD süreçlerine dahil edilecek.
        *   Bağımlılık yönetimi gözden geçirilecek ve `requirements.txt` ile `poetry.lock` dosyalarının güncel ve uyumlu olduğu doğrulanacak.
        *   Modül ve dosya adlandırma kuralları (Python için PEP 8, TypeScript için stil rehberleri) kontrol edilecek ve tutarlılık sağlanacak.
        *   Kapsamlı birim ve entegrasyon testleri yazılacak. Özellikle yeni eklenen PraisonAI entegrasyonu ve Firebase etkileşimleri için testler oluşturulacak.
        *   `Project-Standards-and-Guidelines.mdc` belgesinde belirtildiği gibi, tüm kodlar birleştirilmeden önce akran değerlendirmesinden geçmelidir.
        *   OWASP Top 10 ve Google Cloud güvenlik yönergelerine uyulacak.
        *   Tüm kullanıcı girişleri doğrulayın ve temizlenmeli, tüm ağ iletişimi için HTTPS kullanılmalı.
        *   Gizli bilgiler ve kimlik bilgileri kodda asla değil, ortam değişkenlerinde saklanmalı.
        *   Tüm hizmetler ve kullanıcılar için en az ayrıcalık ilkesi uygulanmalı.
        *   Tüm yönetici hesapları için 2FA etkinleştirilmeli.
        *   Güvenlik açıkları için kodu ve bağımlılıkları düzenli olarak denetleyin.
        *   SQL enjeksiyonunu önlemek için parametreli sorgular kullanılmalı, XSS'yi önlemek için çıktı kaçırılmalı.
        *   Hız sınırlaması ve kaba kuvvet koruması uygulanmalı.
        *   Güvenlikle ilgili tüm olaylar günlüğe kaydedilmeli ve anormallikleri izlenmeli.
        *   Hassas veriler beklemede ve aktarım sırasında şifrelenmeli.
        *   Bulut IAM izinleri düzenli olarak gözden geçirilmeli ve kısıtlanmalı.

### 9. Firebase Veri Modellemesi İncelemesi
    *   **Yapılacaklar:**
        *   `firestore-data-modeling-comprehensive.md` ve `core-firebase-data-modeling.md` dosyalarındaki prensiplere göre mevcut Firestore veri modeli detaylı olarak incelenecek.
        *   Erişim modelleri, sorgu performansları ve ölçeklenebilirlik açısından potansiyel darboğazlar belirlenip iyileştirmeler yapılacak.
        *   Koleksiyon grupları, alt koleksiyonlar ve belge referansları gibi Firebase özelliklerinin doğru kullanımı sağlanacak.
        *   `firebase-integration-documentation.md` belgesindeki çoklu cihaz yetkilendirme ve kullanıcı başlatma detayları veri modeline entegre edilecek.

### 10. API Yanıt Standartları
    *   **Yapılacaklar:**
        *   `api-response-standards.md` dosyasındaki yönergelere göre tüm API yanıtları (hem Python backend hem de Firebase Functions) standartlaştırılacak.
        *   Başarı ve hata yanıtları tutarlı bir formatta olacak, uygun HTTP durum kodları kullanılacak.
        *   Özel hata sınıfları (`CustomError`, `InvalidArgumentError`, `NotFoundError`, vb.) uygulanacak ve hata yanıtları bu sınıflar kullanılarak oluşturulacak.
        *   `API_ERROR_CODES` ve `HTTP_STATUS_CODE_MAP` tanımlamaları kullanılacak ve yeni hata senaryoları için güncellenecek.
        *   Dış kütüphanelerden veya Firebase SDK'larından kaynaklanan hatalar yakalanacak ve standart `CustomError` sınıflarına dönüştürülecek.

### 11. Yeni Özelliklerin Dokümantasyonu
    *   **Yapılacaklar:**
        *   Yeni eklenen AI ajan entegrasyonu ve diğer özellikler için teknik dokümantasyon (hem kod içi yorumlar hem de harici belgeler) oluşturulacak veya güncellenecek.
        *   Kullanıcı dokümantasyonu, yeni özelliklerin nasıl kullanılacağını açıklayacak şekilde hazırlanacak.
        *   `Project-Standards-and-Guidelines.mdc` belgesinde belirtildiği gibi Mimari Karar Kayıtları (ADR) oluşturulacak ve önemli mimari kararlar belgelenecek.

### 12. Güvenlik Denetimi
    *   **Yapılacaklar:**
        *   Tüm uygulama genelinde güvenlik denetimi yapılacak. Özellikle kimlik doğrulama, yetkilendirme, veri hassasiyeti ve olası güvenlik açıkları açısından incelenecek.
        *   Firebase güvenlik kuralları ve fonksiyonları, olası zafiyetlere karşı titizlikle test edilecek.
        *   `Project-Standards-and-Guidelines.mdc` belgesinde belirtildiği gibi güvenlik açıkları için kodu ve bağımlılıkları düzenli olarak denetlenecek.
        *   Olay müdahale prosedürleri belgelenecek ve test edilecek.

### 13. Performans Testleri
    *   **Yapılacaklar:**
        *   Uygulamanın performansını değerlendirmek için yük ve stres testleri yapılacak.
        *   Özellikle Firestore sorguları, API yanıt süreleri ve AI ajanlarının tetiklenme/yanıtlama süreleri gözlemlenecek ve optimize edilecek.
        *   `Project-Standards-and-Guidelines.mdc` belgesinde belirtildiği gibi ana özellikler, performans kıyaslamaları ve gerileme testleri içermeli, performans hedefleri tanımlanmalı ve otomatik araçlar kullanılmalı.
        *   Yavaş kod yolları profillenecek ve optimize edilecek.

### 14. Kullanıcı Geri Bildirimi Entegrasyonu
    *   **Yapılacaklar:**
        *   `Project-Standards-and-Guidelines.mdc` belgesinde belirtildiği gibi, kullanıcı geri bildirimleri tüm ana sürümler için toplanacak, kategorize edilecek ve izlenecek.
        *   Hem web hem de masaüstü uygulamalarında geri bildirim toplamayı entegre edilecek (örneğin, geri bildirim formları, anketler, hata raporları).
        *   Geri bildirimleri kategorilere ayrılacak: hata, özellik isteği, kullanılabilirlik, performans, diğer.
        *   Tüm geri bildirimler merkezi bir sistemde (örneğin, GitHub Issues, Jira veya özel bir gösterge panosu) izlenecek.

### 15. İzleme ve Gözlemlenebilirlik
    *   **Yapılacaklar:**
        *   `Project-Standards-and-Guidelines.mdc` belgesinde belirtildiği gibi, tüm sistemler sağlık, performans ve hatalar açısından eyleme geçirilebilir uyarılarla izlenecek.
        *   Merkezi izleme araçları kullanılacak (örneğin, Prometheus, Grafana, Google Cloud Monitoring).
        *   Ana metrikler izlenecek: çalışma süresi, gecikme, hata oranları, kaynak kullanımı.
        *   Kritik eşikler ve hatalar için eyleme geçirilebilir uyarılar ayarlanacak.

### 16. Özellik Bayrağı Kullanımı
    *   **Yapılacaklar:**
        *   `Project-Standards-and-Guidelines.mdc` belgesinde belirtildiği gibi, tüm deneysel veya riskli özellikler özellik bayraklarının arkasında olacak.
        *   Özellik bayrakları çalışma zamanında (yapılandırma, ortam veya uzak hizmet aracılığıyla) yapılandırılabilir olacak.
        *   Tüm özellik bayrakları ve amaçlanan kullanımları bir `FEATURE_FLAGS.md` dosyasında belgelenecek. 