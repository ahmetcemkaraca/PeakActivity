# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# Proje İyileştirme Eylem Planı

Bu belge, `problems*.md` ve `PROJECT_ANALYSIS_REPORT.md` dosyalarında belirtilen sorunları çözmek için merkezi bir eylem planı sunmaktadır. Amaç, projeyi daha istikrarlı, performanslı, sürdürülebilir ve kullanıcı dostu hale getirmektir.

## Öncelik Sırası

1.  **Çekirdek Performans ve Kararlılık (`aw-server`)**
2.  **Veri Yönetimi ve Optimizasyon**
3.  **Kullanıcı Arayüzü (UI/UX) ve Ön Yüz (Frontend) İyileştirmeleri**
4.  **Kod Kalitesi ve Bakım Kolaylığı**
5.  **Test ve CI/CD Süreçleri**
6.  **Dokümantasyon ve Kurulum**

---

### 1. Çekirdek Performans ve Kararlılık (`aw-server`)

**Hedef:** `aw-server`'daki yüksek bellek tüketimini ve performans sorunlarını gidererek sistemin genel kararlılığını ve yanıt verme hızını artırmak.

**Adımlar:**

-   [ ] **Profil Çıkarma (Profiling):** `py-spy` veya `memory-profiler` gibi bir profil aracı kullanarak en çok zaman ve bellek harcayan fonksiyonları (özellikle `get_events`, `heartbeat`, `query2`) net bir şekilde tespit etmek.
-   [x] **Veritabanı Sorgularını Sayfalama (Pagination):** `get_events` ve `query2` gibi potansiyel olarak büyük veri setleri döndüren fonksiyonlara varsayılan ve zorunlu sayfalama (pagination) eklemek. Bu, tek seferde belleğe yüklenen veri miktarını sınırlayacaktır.
-   [ ] **Heartbeat Optimizasyonu:** `heartbeat` fonksiyonundaki `last_event` sorgusunu optimize etmek. Yüksek frekanslı istekler için veritabanı yükünü azaltmak amacıyla `cachetools` gibi bir in-memory cache kütüphanesi ile bir önbellekleme katmanı eklemek.
-   [ ] **Asenkron Görevleri İyileştirme:** Firebase senkronizasyonu (`full_sync`) gibi uzun süren I/O-bound işlemleri, Flask'ın ana thread'ini bloklamayacak şekilde arka plan görevleri olarak çalıştırmak için `Celery` veya `Flask-APScheduler` entegrasyonunu araştırmak.
-   [ ] **Veritabanı Sorgu Optimizasyonu (Derinlemesine):** `EXPLAIN ANALYZE` gibi araçlar kullanarak yavaş çalışan sorguları analiz etmek ve gerekli indeksleri eklemek.
-   [ ] **Veri Kümeleme (Data Batching):** Veritabanına yapılan yazma işlemlerini (özellikle `create_events`) toplu hale getirerek I/O yükünü azaltmak.

### 2. Veri Yönetimi ve Optimizasyon

**Hedef:** Veri bütünlüğünü sağlamak, depolama verimliliğini artırmak ve eski verileri etkili bir şekilde yönetmek.

**Adımlar:**

-   [ ] **Veri Saklama Politikası (Data Retention):** Eski ve gereksiz verilerin otomatik olarak arşivlenmesi veya silinmesi için bir politika belirlemek ve uygulamak.
-   [ ] **Veritabanı Şema İyileştirmesi:** Veri tekrarını önlemek ve sorgu performansını artırmak için veritabanı şemasını gözden geçirmek ve normalleştirmek.
-   [ ] **Veri Taşıma (Migration) Aracı:** Gelecekteki şema değişiklikleri için `alembic` gibi bir veritabanı taşıma aracı entegre etmek.

### 3. Kullanıcı Arayüzü (UI/UX) ve Ön Yüz (Frontend) İyileştirmeleri

**Hedef:** Tutarlı, modern ve kullanıcı dostu bir arayüz sağlamak.

**Adımlar:**

-   [ ] **UI Kütüphanesi Standardizasyonu:** Proje genelinde tutarlılığı sağlamak için tek bir UI bileşen kütüphanesi (örn. Material-UI, Bootstrap) seçmek ve uygulamak.
-   [ ] **Durum Yönetimi (State Management):** Frontend uygulamasında karmaşıklığı azaltmak için `Redux` veya `Context API` gibi merkezi bir durum yönetimi çözümü benimsemek.
-   [ ] **API İstek Optimizasyonu:** Gereksiz API çağrılarını azaltmak ve veri yükleme süreçlerini iyileştirmek (örn. lazy loading).
-   [ ] **Kullanıcı Geri Bildirim Mekanizması:** Hata durumları ve başarılı işlemler için kullanıcıya net geri bildirimler sunan bileşenler eklemek.

### 4. Kod Kalitesi ve Bakım Kolaylığı

**Hedef:** Kodun okunabilirliğini, bakımını ve genişletilebilirliğini artırmak.

**Adımlar:**

-   [ ] **Linting ve Formatlama:** Proje genelinde `ruff`, `black` ve `prettier` gibi araçlarla statik kod analizi ve otomatik formatlama kurallarını zorunlu hale getirmek.
-   [ ] **Kod Tekrarını Azaltma (Refactoring):** Tekrar eden kod bloklarını tespit edip yeniden kullanılabilir fonksiyonlar veya sınıflar oluşturarak refactor etmek.
-   [ ] **Modülerleştirme:** `aw-server` ve diğer bileşenlerdeki büyük ve karmaşık modülleri daha küçük, yönetilebilir parçalara ayırmak.
-   [ ] **Bağımlılık Yönetimi:** `poetry` veya `pip-tools` kullanarak Python bağımlılıklarını sabitlemek ve düzenli olarak güncellemek.

### 5. Test ve CI/CD Süreçleri

**Hedef:** Kod kalitesini güvence altına almak ve dağıtım süreçlerini otomatikleştirmek.

**Adımlar:**

-   [ ] **Test Kapsamını (Coverage) Artırma:** Kritik modüller için birim (unit) ve entegrasyon testleri yazarak test kapsamını en az %80'e çıkarmayı hedeflemek.
-   [ ] **CI/CD Pipeline İyileştirmesi:** GitHub Actions iş akışlarını (workflows) gözden geçirerek testlerin, linting'in ve derleme işlemlerinin her commit'te otomatik olarak çalışmasını sağlamak.
-   [ ] **Uçtan Uca (E2E) Testler:** Kullanıcı senaryolarını simüle eden `Playwright` veya `Selenium` gibi araçlarla E2E testleri eklemek.

### 6. Dokümantasyon ve Kurulum

**Hedef:** Geliştiriciler için kurulum sürecini basitleştirmek ve proje mimarisini net bir şekilde belgelemek.

**Adımlar:**

-   [ ] **Kurulum Rehberi:** Projenin kurulumu ve çalıştırılması için `README.md` dosyasını adım adım talimatlarla güncellemek.
-   [ ] **API Dokümantasyonu:** `aw-server` API endpoint'lerini Swagger/OpenAPI kullanarak belgelemek.
-   [ ] **Mimari Dokümantasyonu:** Projenin ana bileşenlerini, modüllerini ve aralarındaki ilişkileri açıklayan bir `ARCHITECTURE.md` dosyası oluşturmak.
