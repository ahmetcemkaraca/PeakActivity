# PeakActivity Proje Özeti ve Analiz Raporu

**Rapor Tarihi:** 2025-07-09 14:32:07

## 1. Proje Tanımı ve Vizyonu

PeakActivity, ActivityWatch projesini temel alarak geliştirilmiş, kullanıcıların
zamanlarını daha bilinçli yönetmelerini ve üretkenliklerini artırmalarını
hedefleyen yeni nesil bir SaaS ürünüdür. Ham veri toplamak yerine, yapay zeka
kullanarak bu veriyi eyleme geçirilebilir kişiselleştirilmiş içgörülere
dönüştürür. Odaklanma kalitesi ve dijital refahı proaktif olarak artırmaya
odaklanır.

## 2. Teknik Mimari

PeakActivity, yerel veri toplama (ActivityWatch modifiye edilmiş izleyicileri)
ve bulut tabanlı işlemeyi (Google Firebase ekosistemi) bir araya getiren hibrit
bir mimariye sahiptir.

### Teknoloji Yığını

- **Desktop Uygulaması:** Tauri + Vue.js 3 + TypeScript
- **Web Paneli:** Vue.js 3 + Composition API + TypeScript
- **Backend (Bulut Fonksiyonları):** Firebase Cloud Functions (Python)
- **Veritabanı:** Cloud Firestore
- **Kimlik Doğrulama:** Firebase Auth
- **Barındırma:** Firebase Hosting + Google Cloud Platform

## 3. Ana Bileşenler ve İşlevleri

### 3.1. aw-client

`aw-client` kütüphanesi, ActivityWatch sunucusuyla etkileşim için bir REST API
sarmalayıcı sağlar. Temel işlevleri şunlardır:

- **API Etkileşimi:** Sunucuya GET, POST, DELETE istekleri gönderme (`_get`,
  `_post`, `_delete` metotları).
- **Olay Yönetimi:** Olayları alma (`get_event`, `get_events`), ekleme
  (`insert_event`, `insert_events`) ve silme (`delete_event`).
- **Heartbeat Mekanizması:** Etkinlik verilerini sunucuya belirli aralıklarla
  gönderme ve birleştirme (`heartbeat` fonksiyonu). Bağlantı kesilirse istekleri
  sıraya alma (`RequestQueue`).
- **Kova Yönetimi:** Kovaları listeleme (`get_buckets`), oluşturma
  (`create_bucket`) ve silme (`delete_bucket`).
- **Veri Sorgulama:** Sunucu tarafında karmaşık sorgular çalıştırma (`query`).
- **Ayarlar Yönetimi:** Sunucu ayarlarını alma ve ayarlama (`get_setting`,
  `set_setting`).
- **Tekil Örnekleme:** Uygulamanın sadece tek bir örneğinin çalışmasını sağlama
  (`SingleInstance` sınıfı).
- **CLI Araçları:** Komut satırından `heartbeat`, `buckets`, `events`, `query`,
  `report` ve `canonical` gibi fonksiyonları kullanma imkanı.
- **Aktivite Sınıflandırma Kuralları:** Varsayılan aktivite kategorizasyon
  kurallarını tanımlama (`classes.py`).

### 3.2. Diğer aw-\* Dizini Modülleri (Yapısal Analiz)

- **aw-core:** Projenin temel kütüphanesi olup, herhangi bir çalıştırılabilir
  modül içermez. Genellikle ortak modeller, yardımcı fonksiyonlar ve
  konfigürasyon yönetimi gibi temel işlevleri barındırır. (İçeriği boş
  görünüyor, muhtemelen paylaşılan Python kodları buraya taşınacak veya
  `aw-client` gibi alt modüllerin `aw_core` modülünü kullanması bekleniyor.)
- **aw-notify:** Bildirim işlevselliğini sağlar.
- **aw-qt:** Masaüstü uygulamasının (UI) ana yönetim bileşenidir. `aw-server` ve
  diğer `aw-watcher` modüllerini yönetir.
- **aw-server:** ActivityWatch'un ana hizmetidir. REST API, veri depolama ve
  sorgulama motoru sağlar. Web arayüzünü (`aw-webui`) sunar.
- **aw-server-rust:** `aw-server`'ın Rust ile yazılmış bir versiyonu olabilir
  veya Rust tabanlı bazı hizmetleri barındırabilir (örn. `aw-sync`).
- **aw-watcher-afk:** Kullanıcının klavye ve fare etkinliğinden AFK (klavye
  başında değil) durumunu izler.
- **aw-watcher-input:** Kullanıcı girişini (klavye/fare) izler.
- **aw-watcher-window:** Şu anda aktif olan uygulamayı ve pencere başlığını
  izler.

## 4. AI Özellikleri ve İmplementasyon Planı

PeakActivity, yapay zeka destekli üretkenlik ve dijital sağlık koçluğu sunmayı
amaçlamaktadır.

### AI Mimarisi Genel Bakış

- **Edge AI (Yerel İşleme):** Aktivite sınıflandırma, gizlilik odaklı analiz ve
  gerçek zamanlı içgörüler için yerel cihazda işlem.
- **Cloud AI (Gelişmiş Analizler):** Derin kalıp analizi, tahmine dayalı
  modelleme ve davranışsal içgörüler için bulut tabanlı işlem.
- **Hibrit AI:** Akıllı veri filtreleme, bağlam anlama ve kişiselleştirilmiş
  öneriler için her iki yaklaşımın birleşimi.

### Ana AI Özellik Kategorileri

1.  **Akıllı Aktivite Sınıflandırma:**
    - Otomatik kategorizasyon (pencere başlığı, uygulama adı, süre).
    - Bağlam temelli sınıflandırma (TensorFlow.js tabanlı `EdgeAIService` ile).
    - Kullanıcı geri bildirimi ve sürekli öğrenme ile adaptif kurallar.
    - `classifyActivity`, `learnFromUserFeedback`, `adaptClassificationRules`
      fonksiyonları.
2.  **Odaklanma ve Dikkat Analizi:**
    - Odaklanma puanı hesaplaması (bağlam değişimleri, uygulama kullanım
      desenleri).
    - Dikkat dağınıklığı tespiti (sosyal medya, verimsiz uygulamalar).
    - Verimlilik öngörüsü (günlük tahmin, optimal çalışma saatleri, mola
      önerileri).
    - `calculateFocusScore`, `detectDistractions`, `predictProductivity`,
      `suggestOptimalSchedule` fonksiyonları.
3.  **Kişiselleştirilmiş İçgörüler ve Öneriler:**
    - Davranış analizi (çalışma alışkanlıkları, üretkenlik ritimleri, stres
      göstergeleri).
    - Özelleştirilmiş öneriler (mola zamanlaması, odaklanma geliştirme, iş akışı
      optimizasyonu).
    - Karşılaştırmalı analiz (anonim akran kıyaslaması, kişisel ilerleme).
    - `generatePersonalInsights`, `createRecommendations`,
      `analyzeBehaviorPatterns`, `compareWithPeers` fonksiyonları. (OpenAI
      servisi ile entegrasyon öngörülüyor).
4.  **Akıllı Bildirim Sistemi:**
    - Bağlamsal bildirimler (çalışma modu, toplantı tespiti, odaklanma durumu).
    - Adaptif zamanlama (optimal bildirim zamanları, kullanıcı yanıt desenleri).
    - Çoklu kanal desteği (masaüstü, e-posta, mobil).
    - `determineOptimalNotificationTime`, `createContextualNotification`,
      `adaptNotificationFrequency`, `prioritizeNotifications` fonksiyonları.
5.  **Ses Tanıma ve Doğal Dil İşleme (NLP):**
    - Ses komutları (aktivite kaydı, hızlı notlar, hedef güncellemeleri).
    - Doğal dil analizi (pencere başlığı analizi, toplantı notu çıkarma, duygu
      analizi).
    - Ses tabanlı geri bildirim (günlük özet anlatımı).
    - `processVoiceCommand`, `extractMeetingInsights`, `analyzeSentiment`,
      `generateAudioSummary` fonksiyonları.
6.  **Enerji ve Ruh Hali Tahminleme:**
    - Enerji seviyesi tahmini (sirkadiyen ritim, aktivite etkisi, uyku düzeni).
    - Ruh hali analizi (üretkenlik-ruh hali korelasyonu, uygulama kullanımına
      bağlı göstergeler).
    - Proaktif öneriler (enerji optimizasyonu, ruh hali geliştirme).
    - `predictEnergyLevels`, `analyzeMoodPatterns`, `suggestEnergyOptimization`,
      `correlateActivityWithMood` fonksiyonları.

### AI Fonksiyon İmplementasyon Planı (ai-implementation-notes.md ve ai-features-plan.md'den derlenmiştir)

**Aşama 1: Temel AI Altyapısı (v0.2.0 Hedefi)**

- Firebase Cloud Functions AI servis katmanı (Tamamlandı)
- Yerel veri işleme pipeline'ı (Tamamlandı)
- Temel aktivite sınıflandırma algoritması (Devam Ediyor)
- Basit odaklanma skoru hesaplama (Bekleniyor)
- Kullanıcı geri bildirim sistemi (Bekleniyor)
- Edge AI model yükleme (`tensorflow-service.ts` içinde `initializeModel` ve
  `classifyActivity` mevcut, ancak entegrasyonun tamamlanması bekleniyor)

**Aşama 2: Akıllı Analitik (v0.3.0 Hedefi)**

- Gelişmiş pattern recognition
- Kişiselleştirilmiş içgörü üretimi
- Adaptif öğrenme sistemi
- Bağlamsal bildirim sistemi
- Temel ses komut desteği

**Aşama 3: Tahminleme ve Optimizasyon (v0.4.0 Hedefi)**

- Verimlilik tahmin modeli
- Enerji seviyesi analizi
- Proaktif öneri sistemi
- Gelişmiş NLP entegrasyonu
- Ruh hali korelasyon analizi

**Aşama 4: Gelişmiş AI Özellikleri (v0.5.0 Hedefi)**

- Deep learning modelleri
- Çok kullanıcılı pattern analizi
- Gerçek zamanlı anomali tespiti
- Sesli asistan entegrasyonu
- Predictive scheduling

## 5. Güvenlik ve Gizlilik Yaklaşımı

- **Veri Şifreleme:** Uçtan uca şifreleme.
- **Gizlilik:** Kullanıcı verilerinin anonim işlenmesi, yerel işleme önceliği,
  veri anonimleştirme (hassas verileri kaldırma, karmaşık hale getirme, buluta
  göndermeden önce toplama).
- **GDPR Uyumu:** Avrupa veri koruma standartlarına uygunluk.
- **Kullanıcı Kontrolü:** AI özelliklerini açma/kapama, veri paylaşımı onayı,
  model eğitiminden vazgeçme, yalnızca yerel mod seçeneği.

## 6. Performans Metrikleri

- **Model Performansı:** Doğruluk Oranı (>85% aktivite sınıflandırma), Tahmin
  Hassasiyeti (>80% verimlilik tahmini), Kullanıcı Memnuniyeti (>4.0/5.0
  öneriler), Yanıt Süresi (<200ms gerçek zamanlı analiz).
- **Sistem Performansı:** CPU Kullanımı (<5% background processing), RAM
  Kullanımı (<100MB AI modelleri), Ağ Trafiği (<10MB/gün cloud sync), Batarya
  Etkisi (<2% mobile).

## 7. Geliştirme Kuralları ve Araçları

- **Kodlama Standartları:** Tüm kod ve dosya isimleri İngilizce, kullanıcı
  arayüzü metinleri ve açıklamalar Türkçe, İngilizce commit mesajları.
- **Çalışma Akışı:** 3 prompt geliştirme döngüsü, her 3 prompt döngüsünde
  `version.md` güncellemesi ve git deposu güncellemesi.
- **Geliştirme Ortamı:** Node.js, Python, Rust, Firebase CLI, Git.
- **Geliştirme Araçları:** Cursor IDE, ESLint, Prettier, Vitest.

## 8. Özellik Katmanları

- **Free Katman:** Temel aktivite takibi, basit raporlama, 3 otomatik kural.
- **Premium Katman:** AI destekli içgörüler, haftalık detaylı raporlar, sınırsız
  otomasyon kuralları, gelişmiş hedef takibi.
- **Pro Katman:** Takım özellikleri, anonim benchmarking, API erişimi, öncelikli
  destek.

## 9. Sonuç ve Sonraki Adımlar İçin Öneriler

Bu analiz, PeakActivity projesinin kapsamlı bir dijital refah ve üretkenlik
aracı olma vizyonunu ortaya koymaktadır. Proje, sağlam bir hibrit mimariye ve
geleceğe yönelik güçlü AI özelliklerine sahiptir.

**Mevcut Durum Özeti:**

- Temel proje yapısı ve ana .md dosyaları incelendi.
- Git submodule'lar başarıyla indirildi.
- `aw-client` modülünün temel işlevleri ve CLI araçları anlaşıldı.
- AI özellik planı ve implementasyon notları detaylıca incelendi.

**Sonraki Adımlar İçin Öneriler:**

`ai-implementation-notes.md` ve `ai-features-plan.md` dosyalarındaki planlara
dayanarak, projenin AI entegrasyonu için aşağıdaki adımların atılması
önceliklidir:

1.  **AI Aşama 1 Tamamlama:**
    - **Temel Aktivite Sınıflandırma Algoritması:** `EdgeAIService` içindeki
      `interpretPrediction` ve `ruleBasedClassification` metotlarını daha da
      geliştirerek aktivite sınıflandırma doğruluğunu artırın. Gerekirse yeni
      özellikler (örn. klavye/fare kullanım yoğunluğu) ekleyin.
    - **Basit Odaklanma Skoru Hesaplama:** Kullanıcının odaklanma durumunu
      gösteren basit bir metrik oluşturun. `useAIAnalytics.ts` içindeki
      `calculateFocusMetrics` fonksiyonunu implemente edin.
    - **Kullanıcı Geri Bildirim Sistemi:** Kullanıcıların otomatik
      sınıflandırmaları düzeltebilmesi için bir mekanizma ekleyin ve bu geri
      bildirimleri model eğitimi için kullanın. `learnFromUserFeedback`
      fonksiyonunu tasarlayın ve implemente edin.
    - **TensorFlow.js Entegrasyonunu Sağlamlaştırma:**
      `desktop-app/src/services/ai/tensorflow-service.ts` dosyasındaki model
      yükleme ve tahminleme süreçlerini daha robust hale getirin. Hata yönetimi
      ve performans optimizasyonu üzerinde çalışın.

2.  **`aw-core` ve Diğer `aw-*` Modüllerinin Derinlemesine Analizi:** Projenin
    genel işleyişini daha iyi anlamak için `aw-core`, `aw-server`, `aw-qt` ve
    `aw-notify` gibi temel modüllerin kodlarını detaylıca inceleyin. Özellikle
    veri akışı ve modüller arası iletişim mekanizmalarına odaklanın.

3.  **Hata Ayıklama ve Test Ortamı Kurulumu:** AI modelleri ve entegrasyonları
    için kapsamlı bir hata ayıklama ve test stratejisi oluşturun. Özellikle
    `ai-implementation-notes.md`'de belirtilen "A/B Testing" ve "Sürekli
    Öğrenme" yaklaşımlarını hayata geçirin.

4.  **`version-peakactivity.md` Güncellemesi:** Her 3 prompt döngüsünde
    `version-peakactivity.md` dosyasını güncelleyerek tamamlanan işleri, yeni
    eklenen özellikleri ve giderilen hataları listeleyin. Bu, proje geçmişinin
    şeffaf bir şekilde takip edilmesini sağlar.

Bu adımlar, projenin belirlenen yol haritasına uygun olarak ilerlemesi için
kritik öneme sahiptir.
