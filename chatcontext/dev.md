# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# Geliştirme Önerileri

### 1. Firebase Güvenlik Kuralları Tanımlaması ve Yönetimi
*   **Mevcut Durum:** Python kodları Firestore ile etkileşim kurarken, güvenlik kurallarının kod tabanında açıkça tanımlanmadığı ve yönetilmediği gözlemlenmiştir. Bu kurallar, istemci tarafındaki yetkilendirmeyi ve veri bütünlüğünü sağlamak için kritik öneme sahiptir.
*   **Öneri:** `firestore.rules` veya benzeri bir dosya oluşturularak, kullanıcıların kendi verilerine (`users/{user_id}/buckets/{bucket_id}/events/{event_id}` gibi) erişimini kontrol eden güvenlik kuralları açıkça tanımlanmalıdır. Bu kurallar, `request.auth.uid` kullanılarak kimlik doğrulanmış kullanıcının yalnızca kendi verilerine erişmesini sağlamalı, diğer kullanıcıların verilerine erişmesini engellemelidir.
*   **İyileştirme:** `integration.md`'de belirtilen "Gizlilik Fonksiyonları" ve "veri anonimleştirme hizmetleri" ile uyumlu olarak, kuralların veri hassasiyetine göre okuma/yazma izinlerini kısıtlaması (örneğin, anonimleştirilmiş verilerin herkes tarafından okunabilir olması, hassas verilerin belirli rollerdeki kullanıcılar tarafından okunması) düşünülmelidir. Ayrıca, güvenlik kurallarının uygulama geliştirilirken "şema gibi" düşünülerek yazılması ve bir CI/CD hattında birim testlerinin yapılması Firebase dokümantasyonunda [Firebase Security Rules](https://firebase.google.com/docs/rules/basics) ve [Fix insecure rules](https://firebase.google.com/docs/firestore/security/insecure-rules) belirtildiği gibi önemlidir.

### 2. Üretim Ortamında Firebase Kimlik Bilgileri Yönetimi
*   **Mevcut Durum:** `PeakActivityMain/aw-server/aw_server/firebase_datastore/__init__.py` dosyasındaki `initialize_firebase` fonksiyonu, `credentials.ApplicationDefault()` kullanarak Firebase Admin SDK'yı başlatmaktadır ve üretim ortamı için daha güvenli bir yöntem kullanılması gerektiği ile ilgili bir `TODO` notu içermektedir.
*   **Öneri:** Üretim ortamında `serviceAccountKey.json` dosyasını doğrudan kodun içine yerleştirmek yerine, Google Cloud IAM hizmet hesapları veya Güvenlik Yöneticisi (Secret Manager) gibi daha güvenli yöntemlerle kimlik bilgilerinin yüklenmesi sağlanmalıdır. Bu, özellikle uygulamanın dağıtıldığı sunucu ortamında güvenlik risklerini azaltacaktır.

### 3. Veri Anonimleştirme Mekanizmasının Geliştirilmesi
*   **Mevcut Durum:** `PeakActivityMain/aw-server/aw_server/firebase_datastore/firestore.py` dosyasındaki `insert` ve `replace_last` metotlarında basit bir veri anonimleştirme (`[Anonimleştirilmiş Başlık]`, `[Anonimleştirilmiş Uygulama]`) bulunmaktadır. Yorum satırında `hashlib.sha256` ile hashleme önerisi mevcuttur.
*   **Öneri:** `integration.md` belgesinde belirtilen "veri anonimleştirme hizmetleri" gelecekteki adımlar arasında olduğundan, anonimleştirme mantığı daha modüler hale getirilebilir ve yapılandırılabilir bir hizmet olarak tasarlanabilir. Gerçekçi senaryolarda `hashlib` gibi kütüphaneler kullanılarak daha güçlü ve geri döndürülemez anonimleştirme yöntemleri uygulanmalıdır. Kullanıcının gizlilik tercihleri doğrultusunda hangi alanların anonimleştirileceği dinamik olarak belirlenebilmelidir.

### 4. Firestore Sorgu Performansı Optimizasyonu
*   **Mevcut Durum:** `FirestoreEventDB` sınıfındaki `get_eventcount` metodu, `query.get()` kullanarak tüm belgeleri çekip Python tarafında sayım yapmaktadır. Firestore dokümantasyonunda [Understand Cloud Firestore billing](https://firebase.google.com/docs/firestore/pricing) belirtildiği gibi bu, büyük koleksiyonlar için pahalı bir işlem olabilir ve Cloud Functions ile toplu sayım (aggregation queries) önerilir.
*   **Öneri:** Büyük koleksiyonlar için etkinlik sayısını daha verimli bir şekilde almak amacıyla Firebase Cloud Functions'da bir toplu sayım (aggregation query) veya dağıtılmış sayaç (distributed counter) mekanizması uygulanabilir. Bu, doğrudan istemci veya arka uçtan yapılan pahalı okuma işlemlerini azaltacaktır.

### 5. Hata Yönetimi ve Loglama
*   **Mevcut Durum:** `PeakActivityMain/aw-server/aw_server/firebase_datastore/__init__.py` dosyasındaki Firebase başlatma hatası basitçe `print` ile loglanmaktadır.
*   **Öneri:** Hata yönetimi ve loglama mekanizması geliştirilmelidir. Python'ın standart `logging` modülü kullanılarak daha yapılandırılmış ve seviyelendirilmiş loglama yapılmalı, hatalar izleme sistemlerine (örneğin, Google Cloud Logging, Firebase Crashlytics) gönderilmelidir. Bu, üretim ortamında sorunların daha hızlı tespit edilmesine ve çözülmesine yardımcı olacaktır.

### 6. Belgeleme ve Kod Yorumları
*   **Mevcut Durum:** Mevcut kodda bazı yorumlar ve Türkçe metinler bulunmaktadır.
*   **Öneri:** Kodun okunabilirliğini ve bakımını artırmak için tüm değişken, fonksiyon ve sınıf adları İngilizce olmalı ve belge içinde tutarlılık sağlanmalıdır. Karmaşık mantık içeren kısımlara daha açıklayıcı yorumlar eklenmelidir. Özellikle API'lerle ilgili kısımlarda, hangi verilerin neden nasıl işlendiği daha detaylı açıklanmalıdır. 