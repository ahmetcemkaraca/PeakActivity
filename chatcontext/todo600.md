# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# PeakActivity - Kapsamlı Geliştirme ve İyileştirme Listesi (TODO-600)

## Giriş

Bu belge, PeakActivity projesinin tüm modüllerini kapsayan, derinlemesine bir analiz sonucu oluşturulmuş merkezi TODO listesidir. Amaç, projeyi kod kalitesi, performans, güvenlik, test edilebilirlik, dokümantasyon ve kullanıcı deneyimi açılarından en üst seviyeye taşımaktır. Her madde, sorunun tanımını, kök nedenini, çözüm önerisini ve detaylı uygulama adımlarını içermektedir. Bu liste, "Senior Software Developer" bakış açısıyla, sadece semptomları değil, sorunların temelini hedef alacak şekilde hazırlanmıştır.

**Toplam Madde Sayısı:** 600

---

## Bölüm 1: Kod Kalitesi, Linting ve Refactoring (1-150)

### Alt Bölüm 1.1: Python Kod Kalitesi (1-100)

#### **Docstring ve Yorumlar (1-20)**

1.  **Sorun:** Projedeki Python modüllerinin çoğunda (`aw-server`, `aw-qt`, `aw-watcher-*` vb.) modül, sınıf ve fonksiyon seviyesinde eksik veya yetersiz docstring'ler bulunmaktadır. Bu durum, kodun anlaşılabilirliğini ve bakımını zorlaştırmaktadır.
    **Çözüm:** Google Stil Rehberi'ne uygun olarak tüm public modül, sınıf, metod ve fonksiyonlara kapsamlı docstring'ler eklenmelidir.
    **Implementasyon:**
    - `aw-server/aw_server/rest.py`: Tüm API Resource sınıfları ve HTTP metodları için docstring ekle. Parametreleri, döndürdüğü değerleri ve yükseltebileceği hataları belirt.
    - `aw-server/aw_server/api.py`: `ServerAPI` sınıfı ve metodları için detaylı açıklamalar ekle.
    - `aw-watcher-input/src/aw_watcher_input/main.py`: `main` ve diğer yardımcı fonksiyonlar için docstring ekle.
    - `aw-core/aw_core/models.py`: Event ve Bucket modelleri için docstring ekle.

2.  **Sorun:** Karmaşık kod bloklarında (örn: `aw-server/aw_server/sync.py` içindeki senkronizasyon mantığı) ne yapıldığını açıklayan yorum satırları eksiktir.
    **Çözüm:** Algoritmik olarak karmaşık veya anlaşılması zor olan kod bölümlerine, neden o şekilde yapıldığını açıklayan `#` ile başlayan yorumlar eklenmelidir.
    **Implementasyon:**
    - `aw-server/aw_server/sync.py`: `full_sync` ve `sync_events` fonksiyonlarındaki döngülerin ve koşulların mantığını açıklayan yorumlar ekle.
    - `aw-watcher-window/aw_watcher_window/macos_jxa.py`: AppleScript/JXA etkileşim kodlarının ne işe yaradığını açıklayan yorumlar ekle.

3.  **Görev:** `aw-server/aw_server/query/transform.py` içindeki transform fonksiyonlarına (örn: `merge_events_by_keys`) ne tür veri yapıları beklediğini ve döndürdüğünü açıklayan docstring'ler ekle.
4.  **Görev:** `aw-qt/aw_qt/manager.py` içindeki `Manager` sınıfının metodlarına, özellikle de thread ve process yönetimini yapan kısımlara, işleyişi açıklayan docstring'ler ekle.
5.  **Görev:** `aw-datastore/storages/peewee.py` içindeki `PeeweeStorage` metodlarının `AbstractStorage` arayüzünü nasıl implemente ettiğini açıklayan docstring'ler ekle.
6.  **Görev:** `functions/src/services/ai/` dizinindeki AI servis fonksiyonlarına, kullandıkları modelleri ve beklenen girdi/çıktı formatlarını açıklayan docstring'ler ekle.
7.  **Görev:** `aw-server/aw_server/config.py` dosyasındaki her bir konfigürasyon seçeneğinin ne işe yaradığını açıklayan yorumlar ekle.
8.  **Görev:** `aw-watcher-afk/aw_watcher_afk/listeners.py` içindeki platforma özel listener sınıflarının nasıl çalıştığını açıklayan docstring'ler ekle.
9.  **Görev:** `aw-server/aw_server/firebase_datastore/firestore.py` içindeki Firestore etkileşim metodlarına, hangi koleksiyonlarla çalıştığını ve veri modelini açıklayan docstring'ler ekle.
10. **Görev:** `aw-core/aw_core/transforms.py` içindeki tüm transform fonksiyonlarına docstring ekle.
11. **Görev:** `aw-notify/aw_notify/__main__.py` dosyasındaki bildirim oluşturma mantığına yorumlar ekle.
12. **Görev:** `aw-qt/aw_qt/trayicon.py` dosyasındaki tepsi menüsü olaylarına (event handlers) ne işe yaradıklarını açıklayan docstring'ler ekle.
13. **Görev:** `aw-watcher-window/aw_watcher_window/main.py` dosyasındaki ana döngüye (main loop) mantığını açıklayan yorumlar ekle.
14. **Görev:** `aw-server/aw_server/rest.py` içindeki `INFO_SCHEMA` gibi global değişkenlerin amacını açıklayan yorumlar ekle.
15. **Görev:** `aw-server/aw_server/server.py` içindeki `AWFlask` sınıfının başlatılma (initialization) sürecini açıklayan yorumlar ekle.
16. **Görev:** `functions/src/triggers/` dizinindeki her bir Firestore trigger'ının ne zaman ve neden tetiklendiğini açıklayan docstring'ler ekle.
17. **Görev:** `aw-server/praisonai_integration/agent_service.py` içindeki PraisonAI agent entegrasyonunun nasıl çalıştığını açıklayan docstring'ler ekle.
18. **Görev:** `aw-datastore/storages/abstract.py` içindeki soyut metodların her birinin ne yapması gerektiğini ve implemente eden sınıfların nelere dikkat etmesi gerektiğini açıklayan docstring'ler ekle.
19. **Görev:** `aw-core/aw_core/log.py` içindeki loglama yapılandırma fonksiyonlarına docstring ekle.
20. **Görev:** `aw-client/aw_client/client.py` içindeki `AWClient` sınıfı ve metodlarına, API ile nasıl etkileşim kurduğunu açıklayan docstring'ler ekle.

#### **Kod Yapısı ve Standartlar (21-60)**

21. **Sorun:** Birçok Python dosyasında satır uzunluğu 100-120 karakteri aşıyor, bu da okunabilirliği düşürüyor.
    **Çözüm:** Proje genelinde `black` veya `ruff format` ile otomatik formatlama uygulanarak satır uzunluğu standardı (örn: 99 karakter) zorunlu hale getirilmelidir.
    **Implementasyon:**
    - `pyproject.toml` dosyasına `[tool.black]` veya `[tool.ruff]` yapılandırmasını ekle.
    - CI pipeline'ına format kontrolü adımı ekle.
    - `black .` veya `ruff format .` komutunu çalıştırarak tüm projeyi formatla.

22. **Sorun:** `def my_func(items=[]):` gibi değiştirilebilir (mutable) default argümanlar kullanılıyor. Bu, beklenmedik yan etkilere yol açar çünkü liste tüm çağrılar arasında paylaşılır.
    **Çözüm:** Default argüman olarak `None` kullanılmalı ve fonksiyon içinde `if items is None: items = []` şeklinde kontrol yapılmalıdır.
    **Implementasyon:**
    - `aw-server/aw_server/api.py` ve diğer ilgili dosyalardaki tüm fonksiyon tanımlarını bu kurala göre düzelt.

23. **Sorun:** Proje genelinde `logging` çağrılarında `f-string` veya `+` ile string birleştirme kullanılıyor (`logging.info(f"Event: {event}")`). Bu, log mesajı üretilmese bile string formatlama maliyetine yol açar.
    **Çözüm:** Lazy formatting (`logging.info("Event: %s", event)`) kullanılmalıdır.
    **Implementasyon:**
    - Projedeki tüm `logging.*` çağrılarını `grep` veya IDE arama araçlarıyla bul ve lazy formatting kullanacak şekilde düzelt.

24. **Sorun:** `open("file.txt")` gibi `encoding` belirtilmeden dosya açma işlemleri yapılıyor. Bu, farklı işletim sistemlerinde varsayılan encoding farklı olabileceği için hatalara yol açabilir.
    **Çözüm:** Tüm `open()` çağrılarına `encoding="utf-8"` parametresi eklenmelidir.
    **Implementasyon:**
    - Projedeki tüm `open()` çağrılarını bul ve `encoding` parametresini ekle.

25. **Görev:** `aw-server/aw_server/server.py` ve diğer modüllerdeki import sıralaması standart değil (örn: standart kütüphane, üçüncü parti, yerel modüller). `isort` veya `ruff` ile importları otomatik olarak sırala.
26. **Görev:** Proje genelinde kullanılmayan importları (`unused imports`) `ruff` veya `pylint` ile tespit edip kaldır.
27. **Görev:** `aw-watcher-window/aw_watcher_window/macos_applescript.py` gibi dosyalarda `global` değişken kullanımı var. Mümkünse bu değişkenleri sınıf özellikleri (class attributes) veya fonksiyon parametreleri haline getirerek refactor et.
28. **Görev:** Sabit (constant) değerler (örn: "afk", "not-afk") doğrudan kod içinde string olarak kullanılıyor. Bunları `aw-core` içinde merkezi bir `enum` veya `constants.py` dosyasına taşı.
29. **Görev:** `aw-server/aw_server/rest.py` içindeki `InfoResource` gibi sınıflarda `redefined-builtin` (örn: `dict` ismini değişken olarak kullanma) hatalarını düzelt.
30. **Görev:** `aw-server/aw_server/api.py` içindeki bazı fonksiyonlar çok uzun ve birden fazla iş yapıyor (örn: `heartbeat`). Bu fonksiyonları daha küçük, tek bir iş yapan (single responsibility) fonksiyonlara böl.
31. **Görev:** Proje genelinde `pathlib` kütüphanesini kullanarak `os.path`'e göre daha modern ve nesne yönelimli dosya yolu manipülasyonu yap.
32. **Görev:** `aw-server/aw_server/settings.py` dosyasındaki ayar yönetimini `pydantic-settings` kullanarak daha sağlam ve tip-güvenli hale getir. Bu, ortam değişkenlerinden ve .env dosyalarından otomatik tip dönüşümü ile okuma sağlar.
33. **Görev:** `aw-server/aw_server/rest.py` içindeki API endpoint'lerinde `redefined-outer-name` hatalarını düzelt.
34. **Görev:** Proje genelinde `__init__.py` dosyalarını incele ve gereksiz kodları temizle. Sadece paket tanımı için boş bırak veya gerekli import'ları yap.
35. **Görev:** `aw-core/aw_core/models.py` içindeki `Event` ve `Bucket` sınıflarını `dataclasses` veya `pydantic` modelleri olarak yeniden yazarak daha az boilerplate kod ile daha okunaklı hale getir.
36. **Görev:** `aw-server/aw_server/query/__init__.py` içindeki `query2` fonksiyonunu, okunabilirliği artırmak için daha küçük yardımcı fonksiyonlara böl.
37. **Görev:** Proje genelinde `except:` gibi çıplak `except` bloklarını kaldır. Her zaman `except BaseException:` veya daha spesifik bir istisna yakala.
38. **Görev:** `aw-watcher-input/src/aw_watcher_input/main.py` gibi dosyalarda `while True:` döngüleri var. Bunları daha kontrollü hale getirmek için bir "durdurma" (shutdown) mekanizması ekle.
39. **Görev:** `aw-server/aw_server/server.py` içindeki Flask route tanımlarını, `Flask-RESTX` veya `FastAPI` gibi bir kütüphane kullanarak daha yapısal ve kendini belgeleyen (self-documenting) bir hale getir.
40. **Görev:** Proje genelinde `print()` çağrılarını kaldır ve yerine standart `logging` modülünü kullan.
41. **Görev:** `aw-qt/aw_qt/main.py` içindeki `sys.exit()` çağrılarını, uygulamanın temiz bir şekilde kapanmasını sağlayan bir `shutdown` fonksiyonu ile değiştir.
42. **Görev:** `aw-server/aw_server/sync.py` içindeki `last_sync` zaman damgasını bir dosyaya yazmak yerine, veritabanında özel bir "meta" tablosunda/koleksiyonunda sakla.
43. **Görev:** `aw-core/aw_core/models.py` içindeki `Event` veri yapısında `data` alanı serbest bir `dict`. `pydantic` kullanarak `afk`, `window` gibi event tipleri için spesifik veri modelleri oluştur.
44. **Görev:** `aw-server/aw_server/rest.py` içindeki `get` ve `post` metodlarında parametre validasyonunu manuel yapmak yerine, `pydantic` veya `marshmallow` ile otomatikleştir.
45. **Görev:** `aw-watcher-afk/aw_watcher_afk/windows.py` gibi platforma özel modülleri, daha genel bir arayüz arkasına taşıyarak platform bağımlılığını azalt.
46. **Görev:** Proje genelinde `datetime.now()` yerine `datetime.utcnow()` kullanarak zaman damgası yönetimini standartlaştır ve zaman dilimi (timezone) kaynaklı hataları önle.
47. **Görev:** `aw-server/aw_server/api.py` içindeki `_get_events_for_bucket` gibi "private" olarak düşünülen metodların ismini `_` ile başlat.
48. **Görev:** `aw-server/aw_server/query/transform.py` içindeki `NoEventsException` gibi özel istisnaları, merkezi bir `aw_core/exceptions.py` dosyasına taşı.
49. **Görev:** `aw-server/aw_server/server.py` içindeki CORS ayarlarını, bir yapılandırma dosyasından okunacak şekilde dinamik hale getir.
50. **Görev:** `aw-qt/aw_qt/manager.py` içindeki `QProcess` kullanımını, daha sağlam hata yönetimi ve iletişim için `QThread` ve sinyal/slot mekanizması ile refactor et.
51. **Görev:** `aw-watcher-input/src/aw_watcher_input/main.py` dosyasındaki `pynput` listener'larını bir sınıf içine alarak state yönetimini kolaylaştır.
52. **Görev:** `aw-server/aw_server/rest.py` içindeki `get_or_create_bucket` fonksiyonunda "race condition" potansiyeli var. Veritabanı seviyesinde "upsert" veya "transaction" kullanarak atomik hale getir.
53. **Görev:** `aw-core/aw_core/models.py` içindeki `timedelta_to_seconds` gibi yardımcı fonksiyonları, merkezi bir `utils.py` modülüne taşı.
54. **Görev:** `aw-server/aw_server/server.py` içindeki `create_app` fonksiyonunu, test edilebilirliği artırmak için uygulama yapılandırmasını bir parametre olarak alacak şekilde düzenle.
55. **Görev:** `aw-watcher-window/aw_watcher_window/macos_jxa.py` içindeki JXA script'ini ayrı bir `.js` dosyasına taşı ve Python'dan bu dosyayı çalıştır.
56. **Görev:** `aw-server/aw_server/api.py` içindeki `heartbeat` fonksiyonunda `last_event_cache` için `cachetools` kullanılıyor. Bu cache'in anahtarını (`cache_key`) daha spesifik hale getirerek (örn: `f"last_event_{bucket_id}"`) olası çakışmaları önle.
57. **Görev:** `aw-server/aw_server/query/__init__.py` içindeki `query` fonksiyonunun parametrelerini bir `dataclass` veya `pydantic` modeli ile gruplayarak daha okunabilir hale getir.
58. **Görev:** `aw-server/aw_server/server.py` içindeki `Flask-APScheduler` yapılandırmasını, jobstore'u veritabanı tabanlı yapacak şekilde güncelleyerek sunucu yeniden başladığında görevlerin kaybolmasını engelle.
59. **Görev:** `aw-server/aw_server/rest.py` içindeki `EventsResource`'da `limit` parametresinin `int`'e çevrilmesi sırasında `ValueError` yakalanmıyor. Bir `try-except` bloğu ekleyerek geçersiz girdileri ele al.
60. **Görev:** Proje genelinde `mypy` ile statik tip denetimini zorunlu kıl. `pyproject.toml` dosyasına `mypy` yapılandırması ekle ve CI'da çalıştır.

#### **Hata Yönetimi ve Sağlamlık (61-80)**

61. **Sorun:** `try...except Exception:` gibi çok geniş kapsamlı istisna yakalama blokları kullanılıyor. Bu, `KeyboardInterrupt` gibi sistem seviyesi istisnaları da yakalayarak programın sonlandırılmasını engeller ve hata ayıklamayı zorlaştırır.
    **Çözüm:** Her zaman beklenen spesifik istisnalar (`FileNotFoundError`, `ValueError`, `requests.RequestException` vb.) yakalanmalıdır.
    **Implementasyon:**
    - `aw-watcher-input/src/aw_watcher_input/main.py`: `main_loop` içindeki `except Exception` bloğunu, beklenen I/O veya network hatalarını yakalayacak şekilde daralt.
    - `aw-server/aw_server/rest.py`: API endpoint'lerindeki `try...except` bloklarını, veritabanı veya validasyon hataları gibi spesifik durumları ele alacak şekilde güncelle.

62. **Görev:** `aw-client/aw_client/client.py` içindeki API isteklerinde `requests.exceptions.RequestException`'dan türeyen daha spesifik hataları (`ConnectionError`, `Timeout`) yakalayarak kullanıcıya daha anlamlı hata mesajları göster.
63. **Görev:** `aw-server/aw_server/server.py` içinde Flask için merkezi bir hata yöneticisi (`@app.errorhandler`) tanımla. Bu yönetici, tüm beklenmedik hataları yakalayıp loglamalı ve kullanıcıya standart bir 500 Internal Server Error yanıtı dönmelidir.
64. **Görev:** `aw-datastore/storages/peewee.py` içindeki veritabanı işlemlerinde `peewee.PeeweeException`'ı yakalayarak veritabanı bağlantı hatalarını veya sorgu hatalarını daha zarif bir şekilde ele al.
65. **Görev:** `aw-qt/aw_qt/manager.py` içindeki `QProcess` başlatma ve iletişiminde olası hataları (örn: watcher executable dosyasının bulunamaması) `try-except` blokları ile ele al.
66. **Görev:** `aw-server/aw_server/firebase_datastore/firestore.py` içindeki Firestore işlemlerinde `google.api_core.exceptions` modülündeki spesifik hataları (`NotFound`, `PermissionDenied`) yakala.
67. **Görev:** Dosya okuma/yazma işlemlerinin (örn: `settings.py`, `sync.py`) yapıldığı her yerde `FileNotFoundError` ve `PermissionError` istisnalarını yakala.
68. **Görev:** `aw-server/aw_server/sync.py` içindeki `full_sync` başarısız olduğunda, bir sonraki senkronizasyon denemesi için "backoff" (gecikmeli yeniden deneme) stratejisi uygula.
69. **Görev:** `aw-watcher-input/src/aw_watcher_input/main.py` içindeki `aw_client.heartbeat` çağrısı başarısız olduğunda, olayları yerel bir kuyruğa alıp bağlantı geri geldiğinde gönderecek bir mekanizma ekle.
70. **Görev:** `aw-server/aw_server/rest.py` içindeki `post` metodlarında JSON parse hatası (`json.JSONDecodeError` veya Flask'ın `BadRequest` hatası) için özel bir hata yönetimi ekle.
71. **Görev:** `aw-qt/aw_qt/main.py` içinde `QApplication` başlatılmadan önce oluşabilecek hatalar için global bir `sys.excepthook` tanımlayarak bu hataları logla veya bir dialog ile kullanıcıya göster.
72. **Görev:** `aw-server/aw_server/query/__init__.py` içindeki `query` fonksiyonunda geçersiz `timeperiods` formatı için bir `ValueError` fırlat ve bunu API katmanında yakala.
73. **Görev:** `aw-server/aw_server/config.py` içindeki `load_config` fonksiyonunda YAML/TOML parse hatalarını yakalayarak kullanıcıya hangi satırda sorun olduğunu belirten bir mesaj göster.
74. **Görev:** `aw-watcher-window/aw_watcher_window/main.py` içindeki platforma özel modül import edilirken `ImportError` yakalanarak, desteklenmeyen bir platformda çalıştırıldığında anlamlı bir hata mesajı ver.
75. **Görev:** `aw-server/aw_server/api.py` içindeki `delete_bucket` fonksiyonunda, eğer bucket bulunamazsa, bir istisna fırlatmak yerine, idempotent (tekrarlanabilir) olması için sessizce başarılı kabul et veya `204 No Content` dön.
76. **Görev:** `aw-client/aw_client/client.py` içinde, sunucudan 4xx veya 5xx HTTP durum kodu döndüğünde, `response.raise_for_status()` çağırarak bir `HTTPError` fırlatılmasını sağla.
77. **Görev:** `aw-server/aw_server/server.py` içindeki `Flask-APScheduler` görevleri çalışırken bir istisna oluşursa, bu istisnanın loglanmasını ve görevin çökmemesini sağlayan bir mekanizma ekle.
78. **Görev:** `aw-server/aw_server/rest.py` içindeki `get_events` fonksiyonunda, `datetime.strptime` ile tarih parse edilirken `ValueError` yakalanarak geçersiz tarih formatları için `400 Bad Request` dön.
79. **Görev:** `aw-qt/aw_qt/manager.py` içindeki watcher'ların çökmesini (unexpected exit) tespit eden bir mekanizma ekle ve çöken watcher'ı otomatik olarak yeniden başlatmayı dene.
80. **Görev:** `aw-server/aw_server/firebase_datastore/firestore.py` içindeki `_get_firestore_db` fonksiyonunda, Firebase credentials bulunamazsa veya geçersizse, bu durumu yakalayıp açıklayıcı bir hata logu oluştur.

#### **Performans ve Verimlilik (81-100)**

81. **Sorun:** Büyük listeler üzerinde `for` döngüleri içinde `+` veya `+=` ile string birleştirme yapılıyor. Bu, her adımda yeni bir string nesnesi oluşturduğu için verimsizdir.
    **Çözüm:** String parçaları bir listeye eklenmeli ve döngü sonunda `"".join(list)` ile birleştirilmelidir.
    **Implementasyon:**
    - Rapor veya log oluşturan döngüleri tespit et ve `join` metodunu kullanacak şekilde refactor et.

82. **Görev:** `aw-server/aw_server/query/transform.py` içindeki `merge_events_by_keys` gibi veri işleme fonksiyonlarında büyük veri setleri için `pandas` veya `numpy` gibi optimize edilmiş kütüphaneleri kullanmayı değerlendir.
83. **Görev:** `aw-server/aw_server/api.py` içindeki `get_events` fonksiyonunda, sadece istenen alanları (`fields`) veritabanından çekecek şekilde sorguyu optimize et (eğer veritabanı destekliyorsa, örn: `SELECT col1, col2 FROM ...`).
84. **Görev:** `aw-server/aw_server/sync.py` içindeki `full_sync` işlemi sırasında tüm event'leri belleğe yüklemek yerine, event'leri toplu gruplar (batches) halinde okuyup işleyerek bellek kullanımını azalt.
85. **Görev:** `aw-watcher-input/src/aw_watcher_input/main.py` içindeki olay biriktirme (event batching) mantığını, zaman veya olay sayısına göre (hangisi önce dolarsa) gönderim yapacak şekilde iyileştir.
86. **Görev:** `aw-server/aw_server/rest.py` içindeki JSON serileştirme işlemini, `orjson` veya `ujson` gibi daha hızlı bir kütüphane ile değiştir.
87. **Görev:** `aw-server/aw_server/api.py` içindeki `heartbeat` fonksiyonunda `last_event_cache` kullanılıyor. Bu cache'i, en sık erişilen bucket'lar için birden fazla son olayı tutacak şekilde (LRU Cache) genişlet.
88. **Görev:** `aw-server/aw_server/query/__init__.py` içindeki `query` fonksiyonunda, periyotlar (timeperiods) birleştirilirken `sorted` listeler kullanılıyorsa, `heapq.merge` ile daha verimli bir birleştirme yap.
89. **Görev:** `aw-qt/aw_qt/manager.py` içindeki watcher'lardan gelen verileri (stdout) okurken, büyük veri bloklarının UI thread'ini bloklamaması için asenkron okuma veya ayrı bir thread kullan.
90. **Görev:** `aw-server/aw_server/firebase_datastore/firestore.py` içindeki toplu yazma (`batch.commit()`) işlemlerinde, Firestore'un 500'lük limitini göz önünde bulundurarak büyük listeleri otomatik olarak parçalara (chunks) ayıran bir yardımcı fonksiyon yaz.
91. **Görev:** `aw-core/aw_core/models.py` içindeki `Event` sınıfında `__slots__` kullanarak, çok sayıda `Event` nesnesi oluşturulduğunda bellek kullanımını azalt.
92. **Görev:** `aw-server/aw_server/query/transform.py` içindeki `categorize_events` gibi fonksiyonlarda, kategori kurallarını her seferinde derlemek yerine, derlenmiş regex'leri bir cache'de tut.
93. **Görev:** `aw-server/aw_server/api.py` içindeki `get_buckets` fonksiyonuna, bucket listesini cache'leyecek bir mekanizma ekle, çünkü bucket'lar event'lere göre çok daha az sıklıkta değişir.
94. **Görev:** `aw-watcher-window/aw_watcher_window/main.py` içindeki aktif pencere sorgulama sıklığını (polling interval) dinamik hale getir. Örneğin, kullanıcı AFK olduğunda sorgulama sıklığını düşür.
95. **Görev:** `aw-server/aw_server/server.py` içindeki Flask uygulamasını, `gunicorn` veya `uvicorn` (ASGI adaptörü ile) gibi bir WSGI/ASGI sunucusu arkasında çalıştırarak üretim performansını artır.
96. **Görev:** `aw-server/aw_server/rest.py` içindeki `get_events` fonksiyonunda, eğer istemci `Accept-Encoding: gzip` başlığını gönderirse, yanıtı `gzip` ile sıkıştırarak ağ trafiğini azalt.
97. **Görev:** `aw-datastore/storages/peewee.py` içindeki veritabanı bağlantısını, her istek için açıp kapatmak yerine, bir bağlantı havuzu (connection pool) kullanarak yönet.
98. **Görev:** `aw-server/aw_server/query/transform.py` içindeki `limit_events_by_count` ve `limit_events_by_duration` fonksiyonlarını, veritabanı seviyesinde `LIMIT` ve `SUM` kullanarak yapmayı değerlendir (eğer mümkünse).
99. **Görev:** `aw-server/aw_server/api.py` içindeki `ServerAPI` sınıfının başlatılmasını (initialization) yavaşlatan işlemleri (örn: veritabanı bağlantısı) lazy (tembel) hale getir, yani sadece ilk kullanıldığında başlat.
100. **Görev:** `aw-watcher-input/src/aw_watcher_input/main.py` içindeki `last_input_timestamp` gibi sık güncellenen değişkenler için `threading.Lock` kullanarak thread-safe erişim sağla.

### Alt Bölüm 1.2: TypeScript/JavaScript Kod Kalitesi (101-150)

#### **Tip Güvenliği ve Arayüzler (101-120)**

101. **Sorun:** `aw-server/aw-webui` içindeki birçok TypeScript dosyasında `any` tipi kullanılıyor. Bu, TypeScript'in sağladığı tip güvenliğini ortadan kaldırır.
     **Çözüm:** `tsconfig.json` içinde `"noImplicitAny": true` ve `"strict": true` kuralları etkinleştirilmelidir. Tüm `any` kullanımları, uygun interfaceler veya tipler ile değiştirilmelidir.
     **Implementasyon:**
     - `aw-server/aw-webui/src/types/` klasörü oluştur.
     - API'den dönen `Event`, `Bucket` gibi nesneler için `interface IEvent`, `interface IBucket` tanımları yap.
     - `aw-server/aw-webui/src/stores/views.ts`: Store state ve action'larında `any` yerine bu interfaceleri kullan.
     - `aw-server/aw-webui/src/util/edge-ai-service.ts`: Fonksiyon parametreleri ve dönüş değerleri için tipleri belirt.

102. **Sorun:** API'den gelen nesnelerin veya opsiyonel özelliklerin `null` veya `undefined` olabileceği durumlar kontrol edilmiyor. Bu, runtime hatalarına yol açar.
     **Çözüm:** `?.` (optional chaining) ve `??` (nullish coalescing) operatörleri kullanılmalı, ayrıca type guard'lar ile nesnelerin varlığı ve tipi kontrol edilmelidir.
     **Implementasyon:**
     - `aw-server/aw-webui/src/views/activity/Activity.vue`: `event.data.title` gibi erişimlerde `event?.data?.title` kullanarak güvenli hale getir.
     - `if (event && event.data)` gibi kontroller ekle.

103. **Görev:** `functions/src/index.ts` ve diğer Firebase fonksiyonlarında, `data` ve `context` parametreleri için `any` yerine, `firebase-functions/v1`'den gelen `CallableContext` gibi uygun tipleri kullan.
104. **Görev:** `aw-server/aw-webui/src/stores/` içindeki Pinia/Vuex store'ları için state, getter, ve action'ları tam olarak tiple. `defineStore` için generic tipleri kullan.
105. **Görev:** `aw-server/aw-webui/src/util/awclient.ts` içindeki `AWClient` sınıfının metodlarının dönüş tiplerini (`Promise<IEvent[]>`, `Promise<IBucket>`) açıkça belirt.
106. **Görev:** `functions/src/types/` dizini oluştur ve `User`, `Activity`, `Insight` gibi Firestore'da saklanan veri modelleri için `interface`'ler tanımla.
107. **Görev:** `aw-server/aw-webui/src/views/` altındaki Vue bileşenlerinin `props` tanımlarını, `type` ve `required` özelliklerini içeren nesne formatında yap. `PropType<T>` kullanarak karmaşık tipleri belirt.
108. **Görev:** `functions/src/services/` içindeki servis fonksiyonlarının parametre ve dönüş tiplerini eksiksiz olarak tanımla.
109. **Görev:** `aw-server/aw-webui/src/router/index.ts` içindeki rota meta verileri (`meta`) için bir `interface` tanımla.
110. **Görev:** `aw-server/aw-webui/src/util/` içindeki tüm yardımcı fonksiyonlar için JSDoc veya TSDoc formatında, parametreleri ve dönüş değerlerini açıklayan yorumlar ekle.
111. **Görev:** `functions/src/index.ts` içindeki `onCall` fonksiyonlarında, girdi verisini `zod` veya `io-ts` gibi bir kütüphane ile valide et ve tipini güvenli hale getir.
112. **Görev:** `aw-server/aw-webui/src/components/` altındaki tüm Vue bileşenleri için `defineComponent` kullanarak Composition API'nin tip çıkarım yeteneklerinden tam olarak faydalan.
113. **Görev:** `window.aw` gibi global nesneler için `globals.d.ts` dosyasında tip tanımları oluştur.
114. **Görev:** `aw-server/aw-webui/src/views/activity/Activity.vue` içindeki `refs` için tipleri belirt. Örn: `const el = ref<HTMLDivElement | null>(null)`.
115. **Görev:** `functions/src/utils/` içindeki yardımcı fonksiyonlarda, generic tipler kullanarak tekrar kullanılabilir ve tip-güvenli fonksiyonlar oluştur. Örn: `function arrayToObject<T>(arr: T[], key: keyof T): { [key: string]: T }`.
116. **Görev:** `aw-server/aw-webui/src/stores/auth.ts` içindeki kullanıcı nesnesinin (`user`) tipini, Firebase Auth'dan gelen `User` tipi veya kendi `IUserProfile` arayüzün ile tanımla.
117. **Görev:** `aw-server/aw-webui/src/views/settings/` altındaki ayar bileşenlerinde, ayar nesnelerinin yapısını bir `interface` ile tanımla.
118. **Görev:** `functions/src/middlewares/` dizinindeki middleware fonksiyonlarının `req`, `res`, `next` parametrelerini Express'in tipleriyle (`Request`, `Response`, `NextFunction`) tiple.
119. **Görev:** `aw-server/aw-webui/src/visualizations/` içindeki D3.js veya diğer grafik kütüphaneleri ile etkileşimde, veri noktaları (data points) için `interface`'ler tanımla.
120. **Görev:** `tsconfig.json` dosyasına `"strictNullChecks": true` ekleyerek `null` ve `undefined`'ın tüm tiplerden ayrılmasını sağla ve gerekli kontrolleri ekle.

#### **Kod Yapısı ve Standartlar (121-140)**

121. **Görev:** `aw-server/aw-webui/` ve `functions/` dizinlerinde `ESLint` ve `Prettier` yapılandırmalarını standart hale getir. `.eslintrc.js` ve `.prettierrc` dosyaları oluştur ve CI'da kontrolünü yap.
122. **Görev:** `aw-server/aw-webui/src/util/` ve `functions/src/utils/` gibi dizinlerdeki çok sayıda küçük dosyayı, `index.ts` dosyaları kullanarak tek bir modül olarak dışa aktar (barrel files).
123. **Görev:** `aw-server/aw-webui/src/views/activity/Activity.vue` gibi büyük Vue bileşenlerini, daha küçük, yeniden kullanılabilir alt bileşenlere (`<ActivityTimeline>`, `<EventDetails>`) ayır.
124. **Görev:** `aw-server/aw-webui/src/stores/` içindeki Pinia/Vuex store'larını, mantıksal olarak ilgili oldukları özelliklere göre modüllere ayır (`auth.ts`, `activity.ts`, `settings.ts`).
125. **Görev:** `functions/src/index.ts` dosyasını, her bir fonksiyonu kendi dosyasından import edecek şekilde düzenle (`export * from './triggers/onUserCreate'`). Bu, ana dosyanın temiz kalmasını sağlar.
126. **Görev:** Proje genelinde `Promise`-tabanlı kodlarda `async/await` kullanımını tutarlı hale getir. `.then().catch()` zincirlerini `try/catch` blokları ile değiştir.
127. **Görev:** `aw-server/aw-webui/src/services/` veya `aw-server/aw-webui/src/api/` gibi bir dizin oluşturarak tüm API çağrılarını (örn: `axios` veya `fetch` kullanımı) bu katmanda merkezileştir.
128. **Görev:** `aw-server/aw-webui/src/assets/` dizinini, `images`, `styles`, `fonts` gibi alt klasörlerle organize et.
129. **Görev:** `aw-server/aw-webui/src/composables/` (Vue 3) veya `aw-server/aw-webui/src/mixins/` (Vue 2) dizini oluşturarak yeniden kullanılabilir mantığı (örn: `useAuth`, `useActivityFetcher`) buraya taşı.
130. **Görev:** `functions/src/config.ts` dosyası oluşturarak Firebase Functions'a özel ortam değişkenlerini ve ayarları buradan yönet.
131. **Görev:** `aw-server/aw-webui/` içindeki CSS/SCSS kodlarını, BEM (Block Element Modifier) gibi bir metodoloji veya `scoped styles` kullanarak daha yönetilebilir hale getir.
132. **Görev:** `functions/` içindeki kodlarda mutlak yol (absolute path) importları (`@/services/ai`) kullanmak için `tsconfig-paths`'i ayarla.
133. **Görev:** `aw-server/aw-webui/` içindeki tüm sihirli sayıları (magic numbers) ve string'leri (örn: API endpoint yolları, event isimleri) `constants.ts` gibi bir dosyada sabit olarak tanımla.
134. **Görev:** `functions/src/` içindeki veritabanı sorgularını, `services` katmanından ayırıp bir `repository` veya `data-access` katmanına taşı.
135. **Görev:** `aw-server/aw-webui/src/main.ts` (veya `.js`) dosyasını, sadece uygulama başlatma ve plugin'leri yükleme işini yapacak şekilde sadeleştir.
136. **Görev:** `aw-server/aw-webui/src/util/date-utils.ts` gibi bir dosya oluşturarak `date-fns` veya `dayjs` gibi bir kütüphane etrafında bir sarmalayıcı (wrapper) oluştur ve tarih/saat formatlamasını standartlaştır.
137. **Görev:** `functions/src/` içindeki `console.log` çağrılarını, Firebase'in kendi `functions.logger`'ını kullanacak şekilde değiştir. Bu, logların Google Cloud Logging'de daha iyi gruplanmasını sağlar.
138. **Görev:** `aw-server/aw-webui/src/` içindeki tüm `*.js` dosyalarını, `*.ts` dosyalarına dönüştürerek tip güvenliğini artır.
139. **Görev:** `aw-server/aw-webui/src/views/` altındaki bileşenlerde, `v-if` ve `v-for`'u aynı element üzerinde kullanmaktan kaçın. Gerekirse `<template>` elementi ile sarmala.
140. **Görev:** `functions/src/` içindeki asenkron işlemlerde `Promise.all` veya `Promise.allSettled` kullanarak paralel işlemleri verimli bir şekilde yönet.

#### **Hata Yönetimi ve Asenkron İşlemler (141-150)**

141. **Görev:** `aw-server/aw-webui/src/util/awclient.ts` içindeki API çağrılarında, `fetch` veya `axios`'dan gelen hataları yakalayıp, standart bir hata nesnesi (`{ message: string, code: number }`) döndüren bir yapı kur.
142. **Görev:** `functions/src/index.ts` içindeki `onCall` fonksiyonlarında, hataları `throw new functions.https.HttpsError('not-found', 'Message')` şeklinde fırlatarak istemcinin hatayı doğru işlemesini sağla.
143. **Görev:** `aw-server/aw-webui/` içindeki Vue bileşenlerinde, asenkron `setup` veya `created` hook'larında oluşabilecek hataları yakalamak için Vue'nun `onErrorCaptured` yaşam döngüsü kancasını kullan.
144. **Görev:** `functions/src/` içindeki `onCall` veya HTTP trigger'larında, `cors` modülünü kullanarak Cross-Origin Resource Sharing'i güvenli bir şekilde yönet.
145. **Görev:** `aw-server/aw-webui/` içindeki asenkron işlemlerde (örn: veri çekme), işlemin devam ettiğini belirtmek için bir `loading` state'i yönet ve UI'da bir yükleme göstergesi (spinner) göster.
146. **Görev:** `functions/src/` içindeki uzun süren işlemleri (örn: rapor oluşturma) bir `onCall` fonksiyonu yerine, bir `onDocumentWritten` trigger'ı ile tetiklenen bir arka plan fonksiyonuna taşı.
147. **Görev:** `aw-server/aw-webui/` içindeki `setTimeout` veya `setInterval` kullanımlarını, bileşen yok edildiğinde (`unmounted`) otomatik olarak temizleyecek şekilde `onUnmounted` hook'u içinde yönet.
148. **Görev:** `functions/src/` içindeki üçüncü parti API çağrılarında (örn: OpenAI), yeniden deneme (retry) ve üstel geri çekilme (exponential backoff) mantığı ekle.
149. **Görev:** `aw-server/aw-webui/` içindeki `Promise` zincirlerinde, her zaman bir `.catch()` bloğu olduğundan emin ol, aksi takdirde "unhandled promise rejection" hatası alınır.
150. **Görev:** `functions/src/` içindeki tüm asenkron fonksiyonların `Promise` döndürdüğünden ve bu `Promise`'ın Firebase Functions runtime'ı tarafından doğru bir şekilde beklendiğinden emin ol.

---

## Bölüm 2: Test, CI/CD ve Otomasyon (151-250)

### Alt Bölüm 2.1: Test Altyapısı ve Kapsamı (151-200)

151. **Sorun:** Projenin test kapsamı çok düşük. Özellikle `aw-server`'daki kritik API mantıkları ve `aw-watcher-*` modüllerinin çekirdek işlevleri test edilmiyor.
    **Çözüm:** `pytest` ve `coverage` kütüphaneleri kullanılarak birim (unit) ve entegrasyon testleri yazılmalı, test kapsamı hedefi (örn: %85) belirlenmeli ve CI sürecinde bu hedefe uyum zorunlu kılınmalıdır.
    **Implementasyon:**
    - `aw-server/tests/` dizininde `test_api.py` dosyası oluştur. `test_get_events_pagination`, `test_heartbeat_cache` gibi test senaryoları ekle.
    - `aw-watcher-afk/tests/test_afk.py` oluştur. AFK durum tespit logiğini mock objelerle test et.
    - `pyproject.toml` dosyalarına `[tool.coverage.run]` ve `[tool.coverage.report]` ayarlarını ekleyerek minimum kapsamı zorunlu kıl.

152. **Sorun:** Testler veritabanı gibi dış servislere bağımlı. Bu, testlerin yavaş ve kararsız olmasına neden olur.
    **Çözüm:** Veritabanı etkileşimleri için `pytest-mock` ile mock'lama veya `testing.postgresql` gibi kütüphanelerle geçici test veritabanları kullanılmalıdır. `aw-datastore` için bir in-memory (bellek-içi) storage implementasyonu testlerde kullanılabilir.
    **Implementasyon:**
    - `aw-server/tests/conftest.py` dosyası oluşturarak mock `ServerAPI` veya mock veritabanı bağlantısı sağlayan fixture'lar tanımla.
    - Testlerde `mocker.patch('aw_server.api.get_db_connection', return_value=mock_connection)` gibi yamalar kullan.

153. **Görev:** `aw-server/aw-webui/` için `vitest` veya `jest` ile birim testleri (unit tests) altyapısı kur. Özellikle `stores` ve `util` fonksiyonlarını test et.
154. **Görev:** `functions/` dizini için `jest` ve `firebase-functions-test` kütüphaneleri ile test altyapısı kur. Hem HTTP/Callable fonksiyonları hem de arka plan trigger'larını test et.
155. **Görev:** `aw-qt/` için `pytest-qt` kütüphanesini kullanarak UI etkileşimlerini ve sinyal/slot bağlantılarını test eden testler yaz.
156. **Görev:** `aw-server/tests/` içinde API entegrasyon testleri için `requests` veya `httpx` kütüphanesini kullanarak çalışan bir sunucuya karşı testler yaz.
157. **Görev:** `aw-core/tests/` dizini oluştur ve `Event`, `Bucket` modelleri ile `transform` fonksiyonları için testler yaz.
158. **Görev:** `aw-server/aw-webui/` için `Testing Library` veya `Cypress` ile bileşen (component) ve uçtan uca (E2E) testler yaz.
159. **Görev:** `pytest` için `conftest.py` dosyalarında yeniden kullanılabilir `fixture`'lar (örn: `test_client`, `sample_event_data`) oluştur.
160. **Görev:** `functions/tests/` içinde Firestore güvenlik kurallarını (`firestore.rules`) test etmek için `firebase-rules-unit-testing` kütüphanesini kullan.
161. **Görev:** `aw-watcher-window/tests/` dizini oluştur ve platforma özel pencere sorgulama mantığını mock'layarak test et.
162. **Görev:** `aw-server/tests/` içinde `query` fonksiyonunu farklı zaman aralıkları ve transformasyonlarla test eden kapsamlı testler yaz.
163. **Görev:** `aw-server/aw-webui/tests/` içinde Pinia/Vuex store action'larının ve mutation'larının state'i doğru şekilde değiştirdiğini test et.
164. **Görev:** `functions/tests/` içinde `firebase-functions-test` ile bir trigger'ın (örn: `onUserCreate`) beklenen yan etkileri (örn: Firestore'a yeni bir doküman yazma) yarattığını test et.
165. **Görev:** `pytest` için parametrizasyon (`@pytest.mark.parametrize`) kullanarak aynı testi farklı girdilerle çalıştırmayı sağla.
166. **Görev:** `aw-server/tests/` içinde `api.py`'deki hata durumlarının (örn: geçersiz `bucket_id`) doğru HTTP hata kodlarını (`400`, `404`) döndürdüğünü test et.
167. **Görev:** `aw-server/aw-webui/tests/` içinde `awclient.ts`'in ağ hatalarını doğru şekilde ele aldığını mock'layarak test et.
168. **Görev:** `aw-datastore/tests/` dizini oluştur ve `PeeweeStorage` ile `FirestoreStorage`'ın `AbstractStorage` arayüzüne uygun davrandığını test eden bir test paketi yaz.
169. **Görev:** `aw-server/tests/` içinde `sync.py`'deki senkronizasyon mantığını, kaynak ve hedef veritabanlarını mock'layarak test et.
170. **Görev:** `aw-server/aw-webui/tests/` içinde Vue router'ın doğru rotalara yönlendirme yaptığını ve rota guard'larının çalıştığını test et.
171. **Görev:** `functions/tests/` içinde AI servislerini mock'layarak, AI servislerinden gelen farklı yanıtlara göre fonksiyonların doğru davranıp davranmadığını test et.
172. **Görev:** `aw-server/tests/` içinde `config.py`'nin farklı yapılandırma dosyalarını doğru okuduğunu ve varsayılan değerleri doğru atadığını test et.
173. **Görev:** `aw-client/tests/` dizini oluştur ve `AWClient`'in `heartbeat`, `create_bucket` gibi temel fonksiyonlarını mock bir sunucuya karşı test et.
174. **Görev:** `aw-notify/tests/` dizini oluştur ve bildirimlerin doğru başlık ve içerikle oluşturulduğunu test et.
175. **Görev:** `aw-server/aw-webui/tests/` içinde `i18n` (uluslararasılaştırma) fonksiyonlarının doğru çevirileri döndürdüğünü test et.
176. **Görev:** `pytest` testlerinde `freezegun` kütüphanesini kullanarak zaman-bağımlı testleri (örn: "son 24 saatteki event'ler") deterministik hale getir.
177. **Görev:** `aw-server/tests/` içinde veritabanı şeması migration'larını (eğer `alembic` gibi bir araç kullanılırsa) test eden bir süreç oluştur.
178. **Görev:** `functions/tests/` içinde `zod` veya benzeri validasyon şemalarının hem geçerli hem de geçersiz verileri doğru şekilde işlediğini test et.
179. **Görev:** `aw-server/aw-webui/tests/` içinde `localStorage` veya `sessionStorage` kullanan fonksiyonları, bu API'leri mock'layarak test et.
180. **Görev:** Proje genelinde test verilerini (`fixtures`) ayrı dosyalarda (`.json`, `.yml`) saklayarak testlerin daha okunabilir olmasını sağla.
181. **Görev:** `aw-server/tests/` içinde `Flask-APScheduler` ile zamanlanmış görevlerin doğru zamanda ve doğru parametrelerle tetiklendiğini test et.
182. **Görev:** `aw-qt/tests/` içinde `manual_activity_dialog.py` gibi dialog pencerelerinin açıldığını ve kullanıcı girdisini doğru şekilde işlediğini test et.
183. **Görev:** `aw-server/aw-webui/tests/` içinde `Web Sockets` veya diğer gerçek zamanlı iletişim mekanizmalarını test etmek için bir altyapı kur.
184. **Görev:** `functions/tests/` içinde `onDelete` trigger'larının, ilişkili verileri temizleme gibi "cleanup" işlemlerini doğru yaptığını test et.
185. **Görev:** `aw-server/tests/` içinde `Flask-Limiter`'ın hız sınırlamalarını doğru uyguladığını test et.
186. **Görev:** `aw-server/aw-webui/tests/` içinde `Vue` bileşenlerinin `emit` ettiği olayların doğru verilerle tetiklendiğini test et.
187. **Görev:** `aw-server/tests/` içinde `Peewee` veritabanı için testleri her çalıştırmada temiz bir veritabanı ile başlatmak için `in-memory SQLite` kullan.
188. **Görev:** `functions/tests/` içinde `idempotency` (tekrarlanabilirlik) gerektiren fonksiyonların, aynı girdi ile birden çok kez çağrıldığında aynı sonucu ürettiğini ve yan etkileri tekrarlamadığını test et.
189. **Görev:** `aw-server/aw-webui/tests/` içinde `Cypress` veya `Playwright` ile görsel regresyon (visual regression) testleri kurarak UI'daki beklenmedik değişiklikleri yakala.
190. **Görev:** `pytest` için özel marker'lar (`@pytest.mark.slow`, `@pytest.mark.api`) tanımlayarak testleri grupla ve CI'da sadece belirli grupları çalıştırma imkanı sağla.
191. **Görev:** `aw-server/tests/` içinde `auth.py` (eğer varsa) veya güvenlik ile ilgili middleware'lerin token doğrulama, yetkilendirme gibi mantıklarını test et.
192. **Görev:** `aw-server/aw-webui/tests/` içinde `Vue` composable'larının (`use...`) reaktifliğini ve state yönetimini doğru yaptığını test et.
193. **Görev:** `functions/tests/` içinde `firebase-admin` SDK'sını mock'layarak, testlerin gerçek bir Firebase projesine bağlanmasını engelle.
194. **Görev:** `aw-server/tests/` içinde `query/transform.py` içindeki her bir transform fonksiyonunu, kenar durumları (edge cases) içerecek şekilde (boş event listesi, tek event vb.) test et.
195. **Görev:** `aw-qt/tests/` içinde `config.py`'nin ayarları doğru okuduğunu ve kaydettiğini test et.
196. **Görev:** `aw-server/aw-webui/tests/` içinde `axios` veya `fetch` için mock'lar oluşturarak (`msw` - Mock Service Worker gibi) frontend'i backend'den bağımsız test etme imkanı sağla.
197. **Görev:** `aw-server/tests/` içinde `Peewee` modellerinin ilişkilerinin (foreign key, back-reference) doğru çalıştığını test et.
198. **Görev:** `functions/tests/` içinde `Pub/Sub` trigger'larını test etmek için `firebase-functions-test`'in `pubsub` özelliklerini kullan.
199. **Görev:** `aw-server/aw-webui/tests/` içinde `Vue` bileşenlerinin `slot`'larını doğru şekilde render ettiğini test et.
200. **Görev:** Proje genelinde testlerin paralel (`pytest-xdist`) çalıştırılabilmesi için state paylaşımı gibi sorunları gider.

### Alt Bölüm 2.2: CI/CD (201-250)

201. **Sorun:** Mevcut CI/CD süreçleri (varsa) eksik. Kod formatlama, linting, test ve derleme adımları otomatik olarak çalışmıyor.
    **Çözüm:** GitHub Actions kullanılarak kapsamlı bir CI/CD pipeline oluşturulmalıdır. Bu pipeline, her `push` ve `pull_request`'te çalışarak kod kalitesi kontrollerini ve testleri otomatikleştirmelidir.
    **Implementasyon:**
    - `.github/workflows/ci.yml` dosyası oluştur.
    - `jobs` olarak `lint`, `test-python`, `test-frontend`, `build` adımlarını tanımla.
    - `lint` job'u içinde `ruff check .` ve `ruff format --check .` komutlarını çalıştır.
    - `test-python` job'u içinde `poetry install` ve `poetry run pytest --cov` komutlarını çalıştır.
    - Başarısız adımlarda pipeline'ın durmasını sağla.

202. **Görev:** CI pipeline'ına test kapsamı raporunu (`coverage.xml`) `Codecov` veya `Coveralls` gibi bir servise yükleyen bir adım ekle. Bu, PR'larda kapsam değişikliklerini görmeyi sağlar.
203. **Görev:** `main` veya `master` branch'ine merge yapıldığında otomatik olarak `firebase deploy --only functions` ve `firebase deploy --only hosting` komutlarını çalıştıran bir CD (Continuous Deployment) pipeline'ı (`.github/workflows/deploy.yml`) oluştur.
204. **Görev:** CD pipeline'ına, dağıtımdan önce Firebase projesi için bir "staging" (hazırlık) ortamına dağıtım yapma ve orada E2E testleri çalıştırma adımı ekle.
205. **Görev:** GitHub Actions'da `poetry` ve `node` bağımlılıklarını cache'leyerek CI/CD süreçlerini hızlandır.
206. **Görev:** `aw-qt` masaüstü uygulaması için, her release tag'i oluşturulduğunda Windows, macOS ve Linux için build alıp GitHub Releases'e yükleyen bir CI/CD pipeline'ı oluştur.
207. **Görev:** CI pipeline'ına, `pyproject.toml` ve `poetry.lock` dosyalarının senkronize olduğunu kontrol eden bir adım (`poetry lock --check`) ekle.
208. **Görev:** `aw-server/aw-webui` için `npm run build` komutunu CI'da çalıştırarak frontend'in başarılı bir şekilde derlendiğini doğrula.
209. **Görev:** CD pipeline'ında Firebase deploy komutları için gerekli olan `FIREBASE_TOKEN`'ı, GitHub Secrets kullanarak güvenli bir şekilde sakla.
210. **Görev:** `pull_request`'lerde, değişen dosyalara göre sadece ilgili testleri çalıştıran (path filtering) bir mantık ekleyerek CI süresini kısalt.
211. **Görev:** `dependabot` veya `renovate` gibi bir araç kurarak proje bağımlılıklarını otomatik olarak güncelleyen ve testleri çalıştıran PR'lar açmasını sağla.
212. **Görev:** CI pipeline'ına, `mypy` ile Python kodunun statik tip denetimini yapan bir adım ekle.
213. **Görev:** CI pipeline'ına, `eslint` ile TypeScript/JavaScript kodunun linting'ini yapan bir adım ekle.
214. **Görev:** `aw-qt` için macOS build'lerini noterize eden (notarization) bir script'i CI'a entegre et.
215. **Görev:** Her başarılı `main` branch build'inden sonra, `aw-server` için bir Docker imajı oluşturup Docker Hub veya Google Container Registry'ye push'layan bir adım ekle.
216. **Görev:** CI pipeline'ında, Python ve Node.js versiyonlarını `.python-version` ve `.nvmrc` gibi dosyalardan okuyarak, geliştirme ortamı ile tutarlılığı sağla.
217. **Görev:** `pull_request`'lere, test kapsamı ve lint sonuçları hakkında yorum yapan bir GitHub botu (`codecov-bot` gibi) entegre et.
218. **Görev:** CD pipeline'ına, Firebase deploy'dan sonra, production URL'ine bir "health check" isteği atarak dağıtımın başarılı olduğunu doğrulayan bir adım ekle.
219. **Görev:** `aw-server` için, `pyinstaller` veya `nuitka` ile tek-dosya executable oluşturma işlemini CI'a taşı.
220. **Görev:** GitHub Actions'da, farklı Python versiyonları (3.9, 3.10, 3.11) ve farklı işletim sistemleri (ubuntu-latest, macos-latest, windows-latest) üzerinde testleri çalıştıran bir matris (matrix) stratejisi kur.
221. **Görev:** `functions` dizini için, `firebase-tools`'u CI ortamına kuran ve `firebase deploy` komutunu çalıştıran bir job tanımla.
222. **Görev:** CI pipeline'ına, `bandit` gibi bir araçla Python kodu için statik güvenlik analizi (SAST) yapan bir adım ekle.
223. **Görev:** `aw-server/aw-webui` için, `npm audit` komutunu CI'da çalıştırarak bilinen güvenlik açıklarını kontrol et.
224. **Görev:** `release-drafter` gibi bir GitHub Action kullanarak, `pull_request`'lerden otomatik olarak release notları taslağı oluştur.
225. **Görev:** CI pipeline'ında, `poetry build` ile `sdist` ve `wheel` paketlerinin başarılı bir şekilde oluşturulduğunu doğrula.
226. **Görev:** CD pipeline'ına, yeni bir versiyon yayınlandığında, Python paketlerini PyPI'a otomatik olarak yükleyen bir adım ekle.
227. **Görev:** `aw-qt` için `src-tauri` build'lerini CI'da cache'leyerek derleme sürelerini kısalt.
228. **Görev:** CI pipeline'ına, `docs` dizinindeki dokümantasyonun (eğer `sphinx` veya `mkdocs` kullanılıyorsa) başarılı bir şekilde build edildiğini kontrol eden bir adım ekle.
229. **Görev:** GitHub Actions'da, `on: workflow_dispatch` trigger'ı ekleyerek pipeline'ları manuel olarak tetikleme imkanı sağla.
230. **Görev:** `aw-server` için, `docker-compose.yml` dosyasını kullanarak CI ortamında veritabanı gibi servisleri başlat ve entegrasyon testlerini bu ortamda çalıştır.
231. **Görev:** CI pipeline'ında, `secret-scan` gibi bir araçla koda yanlışlıkla eklenmiş API anahtarı gibi sırları tarayan bir adım ekle.
232. **Görev:** `aw-qt` için, macOS build'lerini noterize eden (notarization) bir script'i CI'a entegre et.
233. **Görev:** CD pipeline'ına, bir dağıtım başarısız olursa, bir önceki stabil versiyona otomatik olarak geri dönme (rollback) mekanizması ekle.
234. **Görev:** CI pipeline'ında, `pytest-xdist` kullanarak Python testlerini paralel çalıştır ve test süresini kısalt.
235. **Görev:** `functions` deploy pipeline'ına, sadece değişen fonksiyonları deploy eden (`--only functions:myFunc1,functions:myFunc2`) bir mantık ekle.
236. **Görev:** CI pipeline'ında, `cml` (Continuous Machine Learning) araçlarını kullanarak AI modellerindeki değişiklikleri ve performans metriklerini PR'larda raporla.
237. **Görev:** `aw-server/aw-webui` için, `lighthouse-ci` kullanarak performans, erişilebilirlik ve SEO metriklerini CI'da otomatik olarak kontrol et.
238. **Görev:** CD pipeline'ına, `A/B testing` veya `canary release` stratejilerini destekleyecek şekilde (örn: Firebase Remote Config ile), yeni özellikleri kullanıcıların bir kısmına aşamalı olarak sunma yeteneği ekle.
239. **Görev:** CI pipeline'ında, `check-jsonschema` gibi bir araçla `firestore.indexes.json` gibi JSON yapılandırma dosyalarının şemaya uygunluğunu kontrol et.
240. **Görev:** `aw-qt` için, Windows build'lerini `msiex` veya `exe` olarak imzalayan (code signing) bir adım ekle.
241. **Görev:** CI pipeline'ında, `npm` yerine `pnpm` veya `yarn` kullanarak frontend bağımlılık kurulumunu hızlandır.
242. **Görev:** CD pipeline'ına, `gsutil` kullanarak `aw-webui` build dosyaları için cache başlıklarını (cache headers) optimize eden bir adım ekle.
243. **Görev:** CI pipeline'ında, `prettier --check` komutunu çalıştırarak kod formatının standartlara uygunluğunu kontrol et.
244. **Görev:** `aw-server` için, `Dockerfile`'da multi-stage build'ler kullanarak son imaj boyutunu küçült.
245. **Görev:** CI pipeline'ında, `hadolint` ile `Dockerfile`'ı lint'le.
246. **Görev:** CD pipeline'ına, Slack veya Discord'a dağıtım durumu hakkında bildirim gönderen bir adım ekle.
247. **Görev:** CI pipeline'ında, `poetry check` komutu ile `pyproject.toml` dosyasının geçerliliğini kontrol et.
248. **Görev:** `aw-qt` için, Linux build'lerini `AppImage`, `deb`, `snap` gibi farklı formatlarda oluşturan adımlar ekle.
249. **Görev:** CI pipeline'ında, `git-cliff` veya benzeri bir araçla `CHANGELOG.md` dosyasını commit mesajlarından otomatik olarak oluştur.
250. **Görev:** CD pipeline'ında, `firebase appdistribution:distribute` komutunu kullanarak test kullanıcılarına yeni mobil/desktop build'lerini dağıt.

---

## Bölüm 3: Güvenlik (251-350)

### Alt Bölüm 3.1: Veri Güvenliği ve Şifreleme (251-280)

251. **Sorun:** Hassas verilerin (API anahtarları, şifreler) kod içinde veya yapılandırma dosyalarında düz metin olarak saklanma riski var.
    **Çözüm:** `python-dotenv` kütüphanesi ile ortam değişkenleri (`.env` dosyası) kullanılmalı ve bu dosya `.gitignore`'a eklenmelidir. Üretim ortamı için Google Secret Manager veya HashiCorp Vault gibi bir sır yönetim sistemi entegre edilmelidir.
    **Implementasyon:**
    - `aw-server/aw_server/settings.py`: Ayarları `os.getenv("SECRET_KEY")` gibi ortam değişkenlerinden okuyacak şekilde refactor et.
    - Proje kök dizinine `.env.example` dosyası ekleyerek gerekli değişkenleri belgele.
    - `google-cloud-secret-manager` kütüphanesini kullanarak üretimde sırları çekecek bir yardımcı fonksiyon yaz.

252. **Görev:** `firestore.rules` dosyasını, en az ayrıcalık (least privilege) prensibine göre sıkılaştır. Kullanıcıların sadece kendi verilerine erişebildiğinden ve yazabildiğinden emin ol.
253. **Görev:** `storage.rules` dosyasını, kullanıcıların sadece kendi dosyalarını yükleyebileceği ve okuyabileceği, ayrıca dosya tipi ve boyut limiti kontrolleri içerecek şekilde güncelle.
254. **Görev:** `aw-server` ve `functions` arasında veya dış API'lerle iletişimde kullanılan API anahtarlarını, Google Secret Manager'a taşı ve çalışma zamanında (runtime) bu servisten oku.
255. **Görev:** `aw-server`'da, veritabanında saklanan hassas kullanıcı bilgileri (eğer varsa) için sütun seviyesinde şifreleme (column-level encryption) uygula.
256. **Görev:** `aw-qt`'de, yerel olarak saklanan hassas verileri (örn: auth token'ları) işletim sisteminin anahtarlık (keychain/keystore) servisini kullanarak güvenli bir şekilde sakla. `keyring` kütüphanesi bunun için kullanılabilir.
257. **Görev:** `aw-server/aw_server/data_anonymization/anonymizer.py` dosyasındaki veri anonimleştirme mantığını, k-anonymity gibi standart teknikleri göz önünde bulundurarak güçlendir.
258. **Görev:** `functions/src/services/encryption/` dizininde, istemci tarafı şifreleme (client-side encryption) için bir anahtar yönetim sistemi (KMS) entegrasyonu yap.
259. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
260. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
261. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
262. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
263. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
264. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
265. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
266. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
267. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
268. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
269. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
270. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
271. **Görev:** `aw-webui`'nin, `aw-server` API'si ile iletişim kurarken tüm trafiği HTTPS üzerinden yaptığından emin ol.
272. **Görev:** `aw-server`'da, `debug=True` modunun üretim ortamında kesinlikle kapalı olduğundan emin ol.
273. **Görev:** `functions`'da, HTTP ile tetiklenen fonksiyonların, istek yapanın kimliğini (Firebase Auth token) doğruladığından emin ol.
274. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
275. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
276. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
277. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
278. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
279. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
280. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
281. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
282. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
283. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
284. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
285. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
286. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
287. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
288. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
289. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
290. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
291. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
292. **Görev:** `aw-webui`'nin, `aw-server` API'si ile iletişim kurarken tüm trafiği HTTPS üzerinden yaptığından emin ol.
293. **Görev:** `aw-server`'da, `debug=True` modunun üretim ortamında kesinlikle kapalı olduğundan emin ol.
294. **Görev:** `functions`'da, HTTP ile tetiklenen fonksiyonların, istek yapanın kimliğini (Firebase Auth token) doğruladığından emin ol.
295. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
296. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
297. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
298. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
299. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
300. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
301. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
302. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
303. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
304. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
305. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
306. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
307. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
308. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
309. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
310. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
311. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
312. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
313. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
314. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
315. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
316. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
317. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
318. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
319. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
320. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
321. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
322. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
323. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
324. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
325. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
326. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
327. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
328. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
329. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
330. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
331. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
332. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
333. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
334. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
335. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
336. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
337. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
338. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
339. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
340. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
341. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
342. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
343. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
344. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
345. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
346. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
347. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
348. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
349. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
350. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.

### Alt Bölüm 3.2: API ve Ağ Güvenliği (281-320)

281. **Sorun:** API endpoint'lerinde hız sınırlaması (rate limiting) bulunmuyor. Bu, kötü niyetli kullanıcıların sunucuya aşırı yüklenmesine (DoS saldırısı) olanak tanır.
    **Çözüm:** `Flask-Limiter` gibi bir kütüphane kullanarak tüm public API endpoint'lerine IP bazlı veya kullanıcı bazlı hız sınırlaması eklenmelidir.
    **Implementasyon:**
    - `aw-server/aw_server/server.py`: `AWFlask` uygulamasına `Limiter` eklentisini entegre et.
    - `@limiter.limit("100/minute")` decorator'ını `EventsResource` gibi kritik endpoint'lere ekle.

282. **Görev:** `aw-server`'da, tüm API endpoint'lerinin (özellikle veri değiştirenler: POST, PUT, DELETE) CSRF (Cross-Site Request Forgery) korumasına sahip olduğundan emin ol. `Flask-WTF` veya benzeri bir kütüphane ile CSRF token'ları kullan.
283. **Görev:** `aw-server`'da, kullanıcı kimlik doğrulama (authentication) ve yetkilendirme (authorization) mantığını, her istekte çalışacak bir Flask middleware'i veya decorator'ı içine taşı.
284. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
285. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
286. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
287. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
288. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
289. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
290. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
291. **Görev:** `aw-webui`'nin, `aw-server` API'si ile iletişim kurarken tüm trafiği HTTPS üzerinden yaptığından emin ol.
292. **Görev:** `aw-server`'da, `debug=True` modunun üretim ortamında kesinlikle kapalı olduğundan emin ol.
293. **Görev:** `functions`'da, HTTP ile tetiklenen fonksiyonların, istek yapanın kimliğini (Firebase Auth token) doğruladığından emin ol.
294. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
295. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
296. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
297. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
298. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
299. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
300. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
301. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
302. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
303. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
304. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
305. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
306. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
307. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
308. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
309. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
310. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
311. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
312. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
313. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
314. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
315. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
316. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
317. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
318. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
319. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
320. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
321. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
322. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
323. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
324. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
325. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
326. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
327. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
328. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
329. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
330. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
331. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
332. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
333. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
334. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
335. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
336. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
337. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
338. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
339. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
340. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
341. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
342. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
343. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
344. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
345. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
346. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
347. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
348. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
349. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
350. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.

### Alt Bölüm 3.2: API ve Ağ Güvenliği (281-320)

281. **Sorun:** API endpoint'lerinde hız sınırlaması (rate limiting) bulunmuyor. Bu, kötü niyetli kullanıcıların sunucuya aşırı yüklenmesine (DoS saldırısı) olanak tanır.
    **Çözüm:** `Flask-Limiter` gibi bir kütüphane kullanarak tüm public API endpoint'lerine IP bazlı veya kullanıcı bazlı hız sınırlaması eklenmelidir.
    **Implementasyon:**
    - `aw-server/aw_server/server.py`: `AWFlask` uygulamasına `Limiter` eklentisini entegre et.
    - `@limiter.limit("100/minute")` decorator'ını `EventsResource` gibi kritik endpoint'lere ekle.

282. **Görev:** `aw-server`'da, tüm API endpoint'lerinin (özellikle veri değiştirenler: POST, PUT, DELETE) CSRF (Cross-Site Request Forgery) korumasına sahip olduğundan emin ol. `Flask-WTF` veya benzeri bir kütüphane ile CSRF token'ları kullan.
283. **Görev:** `aw-server`'da, kullanıcı kimlik doğrulama (authentication) ve yetkilendirme (authorization) mantığını, her istekte çalışacak bir Flask middleware'i veya decorator'ı içine taşı.
284. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
285. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
286. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
287. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
288. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
289. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
290. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
291. **Görev:** `aw-webui`'nin, `aw-server` API'si ile iletişim kurarken tüm trafiği HTTPS üzerinden yaptığından emin ol.
292. **Görev:** `aw-server`'da, `debug=True` modunun üretim ortamında kesinlikle kapalı olduğundan emin ol.
293. **Görev:** `functions`'da, HTTP ile tetiklenen fonksiyonların, istek yapanın kimliğini (Firebase Auth token) doğruladığından emin ol.
294. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
295. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
296. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
297. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
298. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
299. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
300. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
301. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
302. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
303. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
304. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
305. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
306. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
307. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
308. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
309. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
310. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
311. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
312. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
313. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
314. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
315. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
316. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
317. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
318. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
319. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
320. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
321. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
322. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
323. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
324. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
325. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
326. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
327. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
328. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
329. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
330. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
331. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
332. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
333. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
334. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
335. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
336. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
337. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
338. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.
339. **Görev:** `aw-server`'da, kullanıcı oturum (session) cookie'leri için `HttpOnly`, `Secure` ve `SameSite=Strict` bayraklarını ayarla.
340. **Görev:** `aw-server`'da, kullanıcıların kendi hesaplarını silme veya devre dışı bırakma işlemleri için, işlemden önce şifrelerini tekrar girmelerini isteyerek ek bir güvenlik katmanı sağla.
341. **Görev:** `aw-server`'da, API'nin `Server` başlığında Flask veya Python versiyonu gibi detayları ifşa etmesini engelle.
342. **Görev:** `aw-server`'da, hata mesajlarında stack trace gibi hassas sistem bilgilerini kullanıcıya gösterme. Bunları sadece sunucu loglarına yaz.
343. **Görev:** `aw-server`'da, kullanıcıların sıralı ID'lerini (1, 2, 3...) tahmin ederek başka kullanıcıların verilerine erişmesini engellemek için, public endpoint'lerde `UUID` kullan.
344. **Görev:** `aw-server`'da, dosya yükleme endpoint'i varsa, dosya adını ve tipini sıkı bir şekilde kontrol et ve `../../` gibi path traversal saldırılarını önlemek için dosya adını sanitize et.
345. **Görev:** `aw-server`'da, `redirect` kullanılıyorsa, kullanıcı tarafından sağlanan URL'lere yönlendirme yapmaktan kaçın (open redirect zafiyeti). Yönlendirme yapılacak URL'leri bir beyaz listede (whitelist) tut.
346. **Görev:** `aw-server`'da, XML tabanlı bir girdi işleniyorsa (örn: SAML), XXE (XML External Entity) saldırılarına karşı XML parser'ı güvenli bir şekilde yapılandır.
347. **Görev:** `aw-server`'da, kullanıcıların oturum açma denemelerini logla ve kısa bir süre içinde çok sayıda başarısız deneme olursa (brute-force saldırısı), o IP adresini veya hesabı geçici olarak kilitle.
348. **Görev:** `aw-server`'da, JWT (JSON Web Tokens) kullanılıyorsa, `alg` başlığının `none` olmamasını ve güçlü bir imzalama algoritması (örn: RS256) kullanılmasını zorunlu kıl.
349. **Görev:** `aw-server`'da, JWT token'larını geçersiz kılma (invalidate) mekanizması (örn: bir "deny list" kullanarak) ekle. Bu, kullanıcı çıkış yaptığında veya şifresini değiştirdiğinde token'ın kullanılmasını engeller.
350. **Görev:** `aw-server`'da, HTTP yanıtlarına `Content-Security-Policy` (CSP), `X-Content-Type-Options`, `Strict-Transport-Security` (HSTS) gibi güvenlik başlıklarını ekleyen bir middleware kullan.

### Alt Bölüm 3.3: Bağımlılık Güvenliği (321-350)

321. **Sorun:** Projenin bağımlılıkları (`pyproject.toml`, `package.json`) bilinen güvenlik açıklarına karşı düzenli olarak taranmıyor.
    **Çözüm:** `pip-audit` (Python için) ve `npm audit` (Node.js için) araçları CI pipeline'ına entegre edilmelidir. Güvenlik açığı bulunduğunda pipeline başarısız olmalıdır.
    **Implementasyon:**
    - CI pipeline'ına (`.github/workflows/ci.yml`) yeni bir `security-audit` job'u ekle.
    - Bu job içinde `poetry export -f requirements.txt | pip-audit` komutunu çalıştır.
    - `aw-server/aw-webui` dizininde `npm audit --audit-level=high` komutunu çalıştır.

322. **Görev:** `poetry.lock` ve `package-lock.json` dosyalarını kullanarak bağımlılıkları sabitle (pinning). Bu, her kurulumda aynı versiyonların kullanılmasını sağlayarak "supply chain" saldırı riskini azaltır.
323. **Görev:** `dependabot` veya `renovate` yapılandırmasını, sadece patch ve minor versiyon güncellemelerini otomatik olarak yapacak, major versiyon güncellemelerini ise manuel onay gerektirecek şekilde ayarla.
324. **Görev:** Projedeki tüm Python bağımlılıklarının `pyproject.toml` dosyasında tanımlandığından ve `requirements.txt` gibi manuel dosyalar kullanılmadığından emin ol.
325. **Görev:** `aw-server/aw-webui`'de, `npm` yerine `pnpm` veya `yarn` kullanarak, paylaşılan bir `node_modules` yapısı ile disk alanından tasarruf et ve kurulumları hızlandır.
326. **Görev:** Projeye yeni bir bağımlılık eklemeden önce, popülerliğini, bakım durumunu ve bilinen güvenlik açıklarını kontrol etmek için bir politika oluştur.
327. **Görev:** `aw-server` için oluşturulan Docker imajını, `trivy` veya `grype` gibi bir araçla güvenlik açıklarına karşı tara.
328. **Görev:** CI pipeline'ına, `pip-audit`'in sonuçlarını `SARIF` formatında kaydedip GitHub'ın "Security" sekmesinde gösteren bir adım ekle.
329. **Görev:** Projedeki eski ve artık kullanılmayan bağımlılıkları tespit edip kaldır. `depcheck` (Node.js) ve `deptry` (Python) gibi araçlar kullanılabilir.
330. **Görev:** `aw-server` için oluşturulan Docker imajını, `docker scan` komutu ile tarayarak bilinen güvenlik açıklarına karşı kontrol et.
331. **Görev:** `functions` dizinindeki `package.json` dosyasında, `devDependencies` altında sadece geliştirme için gerekli bağımlılıkların bulunduğundan emin ol.
332. **Görev:** `aw-server` için, `pyproject.toml`'da, bağımlılıkların hash'lerini de içeren bir `poetry.lock` dosyası oluşturarak bütünlük kontrolü sağla.
333. **Görev:** `aw-server/aw-webui` için, `npm` script'lerinde `preinstall` veya `postinstall` gibi otomatik çalışan script'lere karşı dikkatli ol ve bunların güvenilir kaynaklardan geldiğinden emin ol.
334. **Görev:** Projeye yeni bir bağımlılık eklemeden önce, popülerliğini, bakım durumunu ve bilinen güvenlik açıklarını kontrol etmek için bir politika oluştur.
335. **Görev:** `aw-server` için, `poetry`'nin sanal ortamını (`.venv`) `.gitignore`'a ekleyerek reponun temiz kalmasını sağla.
336. **Görev:** `aw-server/aw-webui` için, `node_modules` dizininin `.gitignore`'da olduğundan emin ol.
337. **Görev:** Projeye yeni bir bağımlılık eklemeden önce, popülerliğini, bakım durumunu ve bilinen güvenlik açıklarını kontrol etmek için bir politika oluştur.
338. **Görev:** `aw-server` için, `poetry`'nin `source` yapılandırmasını, sadece güvenilir paket depolarını (PyPI gibi) kullanacak şekilde ayarla.
339. **Görev:** `aw-server/aw-webui` için, `.npmrc` dosyası oluşturarak `npm`'in davranışını (örn: sadece resmi registry'den paket indirme) standartlaştır.
340. **Görev:** `aw-server` için, `poetry config virtualenvs.in-project true` komutunu kullanarak sanal ortamın proje klasörü içinde oluşturulmasını sağlayarak geliştirici deneyimini iyileştir.
341. **Görev:** `functions` dizininde, `npm ci` komutunu kullanarak `package-lock.json`'a tam olarak uyan bağımlılıkların kurulmasını CI'da zorunlu kıl.
342. **Görev:** `aw-server` için, `poetry install --no-dev` komutunu kullanarak üretim Docker imajında sadece üretim bağımlılıklarının kurulmasını sağla.
343. **Görev:** `aw-server/aw-webui` için, `npm` script'lerinin `shell`'e bağımlı komutlar içermemesini sağla (`shx` gibi platformlar arası araçlar kullan).
344. **Görev:** `aw-server` için, `poetry export` komutunu kullanarak `requirements.txt` dosyası oluşturma işlemini CI'a taşı ve bu dosyanın repoya commit'lenmesini engelle.
345. **Görev:** `aw-server/aw-webui` için, `package-lock.json` dosyasının `.gitignore`'da olmadığından emin ol.
346. **Görev:** `aw-server` için, `poetry.lock` dosyasının `.gitignore`'da olmadığından emin ol.
347. **Görev:** Projenin tüm alt modüllerindeki (`aw-core`, `aw-client` vb.) `pyproject.toml` dosyalarını, ortak geliştirme bağımlılıklarını (örn: `pytest`, `ruff`) paylaşacak şekilde yapılandır.

### Alt Bölüm 6.2: Build ve Dağıtım (491-510)

491. **Görev:** `aw-qt` için, `pyinstaller` veya `Tauri`'nin build yapılandırmasını, son executable dosya boyutunu küçültecek şekilde (örn: UPX kullanarak) optimize et.
492. **Görev:** `aw-server` için, `gunicorn` veya `uvicorn` ile çalıştırılacak bir üretim `Dockerfile`'ı oluştur.
493. **Görev:** `Makefile`'ı, `build-all`, `release-all` gibi tüm projeyi kapsayan hedeflerle zenginleştir.
494. **Görev:** `aw-qt` için, Windows, macOS ve Linux için kod imzalama (code signing) ve noterizasyon (notarization) süreçlerini otomatikleştiren script'ler yaz.
495. **Görev:** `functions` için, `firebase deploy` komutunu, sadece değişen fonksiyonları deploy edecek şekilde (`--only functions:myFunc1,functions:myFunc2`) daha akıllı hale getiren bir script yaz.
496. **Görev:** `aw-server/aw-webui` için, `vite`'ın build yapılandırmasını, `sourcemap`'leri üretimde gizleyecek veya ayrı bir dosyaya çıkaracak şekilde ayarla.
497. **Görev:** `aw-server` için, `poetry build` komutu ile oluşturulan `wheel` ve `sdist` paketlerinin PyPI'a yüklenebilir olduğundan emin ol.
498. **Görev:** `aw-qt` için, `Tauri`'nin `updater` özelliğini yapılandırarak uygulama içi otomatik güncelleme mekanizmasını etkinleştir.
499. **Görev:** `aw-server` için, `docker-compose.yml` dosyasını kullanarak CI ortamında veritabanı gibi servisleri başlat ve entegrasyon testlerini bu ortamda çalıştır.
500. **Görev:** CI pipeline'ında, `vite`'ın `assetsInlineLimit` ayarını optimize ederek küçük resimlerin ve fontların doğrudan JS bundle'ına gömülmesini sağla.
501. **Görev:** `aw-qt` için, `Tauri`'nin `allowlist` özelliğini yapılandırarak, frontend'in erişebileceği Rust komutlarını ve dosya sistemi API'lerini sınırlandır.
502. **Görev:** `aw-server` için, `systemd` veya `supervisor` gibi bir process manager için örnek servis yapılandırma dosyaları oluştur.
503. **Görev:** `aw-server/aw-webui` için, `index.html` dosyasını, build zamanında `git hash` veya versiyon numarası gibi bilgileri içerecek şekilde dinamik olarak oluşturan bir süreç ekle.
504. **Görev:** `aw-qt` için, uygulamanın farklı platformlar için uygulama ikonlarını (`.ico`, `.icns`) ve metadata'yı (`Info.plist`, `appxmanifest`) doğru şekilde yapılandır.
505. **Görev:** `functions` için, `firebase.json`'daki `predeploy` script'lerini kullanarak, deploy'dan önce linting veya test gibi kontrolleri otomatik olarak çalıştır.
506. **Görev:** `aw-server` için, `alembic` veya `peewee-db-evolve` gibi bir veritabanı migration aracı kur ve yapılandır.
507. **Görev:** `aw-qt` için, `Tauri`'nin `sidecar` özelliğini kullanarak, Python tabanlı watcher'ları ana uygulama ile birlikte paketle.
508. **Görev:** `aw-server` için, `Dockerfile`'da, uygulamayı `root` olmayan bir kullanıcı ile çalıştırarak güvenliği artır.
509. **Görev:** `aw-server/aw-webui` için, `vite`'ın `legacy` plugin'ini kullanarak eski tarayıcılar için uyumluluk sağla (eğer gerekiyorsa).
510. **Görev:** `aw-server` için, `helm` chart'ı veya `kubernetes` manifest dosyaları oluşturarak Kubernetes üzerinde dağıtımı kolaylaştır.

### Alt Bölüm 6.3: Ortam Yönetimi (511-530)

511. **Görev:** Proje kök dizinine `.env.example` dosyası ekleyerek, geliştirme için gerekli tüm ortam değişkenlerini (environment variables) belgele.
512. **Görev:** `aw-server` ve `functions` için, `development`, `staging` ve `production` ortamları için farklı yapılandırma dosyaları (`config.dev.yml`, `config.prod.yml`) kullanma stratejisi geliştir.
513. **Görev:** `aw-server`'da, `python-dotenv` kütüphanesini kullanarak `.env` dosyasından ortam değişkenlerini otomatik olarak yükle.
514. **Görev:** `functions` için, Firebase CLI'ın `functions:config:set` komutunu kullanarak ortam değişkenlerini güvenli bir şekilde ayarla. Bu komutları bir script'e dök.
515. **Görev:** `aw-server/aw-webui` için, `vite`'ın ortam değişkeni yönetimini (`.env`, `.env.production`) kullanarak, `VITE_API_URL` gibi değişkenleri yönet.
516. **Görev:** `docker-compose.yml` dosyasında, `env_file` direktifini kullanarak `.env` dosyasını konteynerlere bağla.
517. **Görev:** `aw-qt`'de, uygulamanın saklayacağı dizinleri, işletim sisteminin standartlarına uygun yerlerde (örn: `AppData`, `~/Library/Application Support`) oluşturmasını sağla.
518. **Görev:** `aw-server`'da, `settings.py`'nin, ortam değişkeni bulunamadığında makul varsayılan (default) değerler kullanmasını sağla.
519. **Görev:** `functions` için, Firebase CLI'ın `functions:config:set` komutunu kullanarak ortam değişkenlerini güvenli bir şekilde ayarla. Bu komutları bir script'e dök.
520. **Görev:** `aw-server`'da, `pytest` için ayrı bir test yapılandırması (`config.test.yml`) oluştur ve testler çalışırken bu yapılandırmanın kullanılmasını sağla.
521. **Görev:** `aw-qt`'de, kullanıcıya, uygulamanın veri dizinini değiştirme seçeneği sun.
522. **Görev:** `functions`'da, `firebase-functions-test` ile alınan yapılandırmanın tiplerini, bir `interface` ile tanımlayarak tip-güvenli hale getir.
523. **Görev:** `aw-server`'da, `Flask`'ın `config.from_envvar()` fonksiyonunu kullanarak, hangi yapılandırma dosyasının yükleneceğini bir ortam değişkeni ile belirle.
524. **Görev:** `aw-server/aw-webui`'de, `Vite`'ın `server.proxy` ayarını kullanarak, geliştirme ortamında API isteklerini `aw-server`'a yönlendir ve CORS sorunlarını çöz.
525. **Görev:** `aw-server`'da, `pytest` için ayrı bir test yapılandırması (`config.test.yml`) oluştur ve testler çalışırken bu yapılandırmanın kullanılmasını sağla.
526. **Görev:** `aw-qt`'de, uygulamanın başlangıçta otomatik olarak çalışmasını sağlayan bir ayar ekle.
527. **Görev:** `functions` dizininde, `npm ci` komutunu kullanarak `package-lock.json`'a tam olarak uyan bağımlılıkların kurulmasını CI'da zorunlu kıl.
528. **Görev:** `aw-server` için, `poetry install --no-dev` komutunu kullanarak üretim Docker imajında sadece üretim bağımlılıklarının kurulmasını sağla.
529. **Görev:** `aw-server/aw-webui` için, `npm` script'lerinin `shell`'e bağımlı komutlar içermemesini sağla (`shx` gibi platformlar arası araçlar kullan).
530. **Görev:** `aw-server` için, `poetry export` komutunu kullanarak `requirements.txt` dosyası oluşturma işlemini CI'a taşı ve bu dosyanın repoya commit'lenmesini engelle.

---

## Bölüm 7: Kullanıcı Deneyimi ve Arayüz (UI/UX) (531-600)

### Alt Bölüm 7.1: Arayüz Tutarlılığı ve Tasarım Sistemi (531-550)

531. **Sorun:** `aw-webui` arayüzü, farklı bileşenler ve görünümler arasında tutarlı bir tasarıma sahip değil.
    **Çözüm:** `Vuetify`, `Quasar` veya `PrimeVue` gibi standart bir UI bileşen kütüphanesi seçilmeli ve tüm arayüz bu kütüphanenin bileşenleri kullanılarak yeniden oluşturulmalıdır. Bu, tutarlılık sağlar ve geliştirmeyi hızlandırır.
    **Implementasyon:**
    - Seçilen kütüphaneyi `package.json`'a ekle ve `main.js`'de başlat.
    - Mevcut HTML buton, input gibi elementleri kütüphanenin `<v-btn>`, `<v-text-field>` gibi bileşenleriyle değiştir.

532. **Sorun:** Uygulamada hata mesajları, yükleme durumları veya başarılı işlem bildirimleri kullanıcıya net bir şekilde gösterilmiyor.
    **Çözüm:** API istekleri sırasında bir yükleme göstergesi (spinner) gösterilmeli, hatalar için standart bir "toast" veya "snackbar" bildirim sistemi kurulmalı ve başarılı işlemler (kaydetme gibi) için de pozitif geri bildirim verilmelidir.
    **Implementasyon:**
    - Merkezi bir state management (Pinia/Vuex) içinde `loading` ve `error` state'leri tut.
    - `App.vue` gibi ana bir bileşene, bu state'lere göre görünüp kaybolan bir loading indicator ve snackbar bileşeni ekle.

533. **Görev:** Proje için renk paleti, tipografi, boşluklar ve ikonografi gibi temel tasarım prensiplerini tanımlayan bir "Tasarım Sistemi" (Design System) oluştur.
534. **Görev:** `aw-webui`'deki tüm form elemanlarını (input, select, checkbox) standart ve tutarlı bir görünüme kavuştur.
535. **Görev:** Uygulama genelinde kullanılan ikonları, `Material Design Icons` veya `Font Awesome` gibi tek bir setten seçerek tutarlılığı sağla.
536. **Görev:** `aw-webui`'de, "karanlık mod" (dark mode) ve "açık mod" (light mode) arasında geçiş yapma imkanı sun.
537. **Görev:** Uygulamanın farklı bölümlerindeki (zaman çizelgesi, ayarlar, raporlar) başlık, paragraf ve liste stillerini standartlaştır.
538. **Görev:** `aw-webui`'deki tüm butonların (birincil, ikincil, tehlikeli eylem) stilini ve davranışını tutarlı hale getir.
539. **Görev:** `aw-qt` masaüstü uygulamasının arayüzünü, web arayüzü (`aw-webui`) ile olabildiğince tutarlı hale getir.
540. **Görev:** `aw-webui`'de, boş durumlar (empty states) için (örn: "Henüz hiç aktiviteniz yok") bilgilendirici ve yönlendirici tasarımlar oluştur.
541. **Görev:** `aw-webui`'deki tüm tabloların görünümünü, sıralama, filtreleme ve sayfalama özelliklerini standartlaştır.
542. **Görev:** Uygulama içindeki tüm "modal" veya "dialog" pencerelerinin açılış/kapanış animasyonlarını ve genel tasarımını tutarlı hale getir.
543. **Görev:** `aw-webui`'de, `SCSS` değişkenleri kullanarak renk paletini ve temel ölçüleri merkezi bir yerden yönet.
544. **Görev:** `aw-qt`'de, uygulamanın tepsi (tray) ikonunu ve menüsünü, farklı işletim sistemlerinin (Windows, macOS) tasarım kurallarına uygun hale getir.
545. **Görev:** `aw-webui`'nin, farklı ekran boyutlarına (mobil, tablet, masaüstü) uyum sağlayan "responsive" (duyarlı) bir tasarıma sahip olduğundan emin ol.
546. **Görev:** `aw-webui`'deki tüm veri görselleştirmelerinin (grafikler, barlar) renklerini ve stillerini uygulamanın genel tasarım sistemiyle uyumlu hale getir.
547. **Görev:** `aw-webui`'de, kullanıcı bir eylemi gerçekleştirmeden önce (örn: bir hedefe ulaşıldığında) onay isteyen bir "confirmation dialog" göster.
548. **Görev:** `aw-webui`'de, sayfa geçişleri için yumuşak ve tutarlı animasyonlar ekle.
549. **Görev:** `aw-webui`'de, uygulamanın logosunu ve marka kimliğini yansıtan bir "favicon" ekle.
550. **Görev:** `aw-webui`'de, `Storybook` kurarak UI bileşenlerini izole bir şekilde belgele ve test et.

### Alt Bölüm 7.2: Bileşen ve Özellik Geliştirmeleri (551-580)

551. **Görev:** `aw-webui`'de, kullanıcıların gün, hafta ve ay bazında üretkenlik skorlarını ve en çok vakit geçirdikleri kategorileri görebilecekleri bir "Dashboard" (Gösterge Paneli) sayfası oluştur.
552. **Görev:** `aw-webui`'deki zaman çizelgesi (timeline) görünümünü, sürükle-bırak ile event'leri birleştirme veya bölme gibi interaktif özelliklerle geliştir.
553. **Görev:** `aw-webui`'de, kullanıcıların belirli hedefler (örn: "Günde 2 saatten fazla sosyal medyada vakit geçirme") belirleyip ilerlemelerini takip edebilecekleri bir "Hedefler" (Goals) modülü ekle.
554. **Görev:** `aw-server` ve `aw-webui`'de, "kural tabanlı" kategorizasyona ek olarak, yapay zeka destekli "otomatik kategorizasyon" önerileri sunan bir özellik ekle.
555. **Görev:** `aw-webui`'de, kullanıcıların verilerini `.csv` veya `.json` formatında dışa aktarmalarını (export) sağlayan bir özellik ekle.
556. **Görev:** `aw-qt`'de, kullanıcıların o an üzerinde çalıştıkları görevi manuel olarak seçebilecekleri bir "manuel aktivite" giriş penceresi ekle.
557. **Görev:** `aw-webui`'de, klavye kısayolları (`Ctrl+F` ile arama, `Esc` ile pencere kapama vb.) için destek ekle.
558. **Görev:** `aw-server` ve `aw-webui`'de, kullanıcıların belirli olaylar gerçekleştiğinde (örn: bir hedefe ulaşıldığında) bildirim almasını sağlayan bir bildirim sistemi kur.
559. **Görev:** `aw-webui`'de, zaman çizelgesinde, event'leri sürükleyerek sürelerini veya başlangıç/bitiş zamanlarını değiştirme imkanı sağla.
560. **Görev:** `aw-webui`'de, uygulamanın tüm özelliklerini hızlıca arayıp erişmeyi sağlayan `Cmd/Ctrl + K` gibi bir "komut paleti" (command palette) ekle.
561. **Görev:** `aw-webui`'de, farklı zaman dilimlerindeki (timezones) kullanıcılar için zaman gösterimini doğru şekilde ayarlayan bir mekanizma kur.
562. **Görev:** `aw-webui`'de, kullanıcıların kendi rapor şablonlarını oluşturup kaydedebilecekleri bir "Özelleştirilebilir Raporlar" sayfası ekle.
563. **Görev:** `aw-server` ve `aw-webui`'de, kullanıcıların verilerini (anonimleştirilmiş olarak) diğer kullanıcılarla karşılaştırabilecekleri bir "kıyaslama" (benchmarking) özelliği ekle.
564. **Görev:** `aw-qt`'de, Pomodoro tekniğini uygulamak için bir zamanlayıcı (timer) ve mola hatırlatıcısı ekle.
565. **Görev:** `aw-webui`'de, uygulamanın yeni özellikleri ve güncellemeleri hakkında bilgi veren bir "Yenilikler" (What's New) penceresi ekle.
566. **Görev:** `aw-server` ve `aw-webui`'de, kullanıcıların hesaplarını ve tüm verilerini kalıcı olarak silebilecekleri bir "Hesabı Sil" özelliği ekle.
567. **Görev:** `aw-webui`'de, zaman çizelgesi görünümünde, event'leri sürükleyerek sürelerini veya başlangıç/bitiş zamanlarını değiştirme imkanı sağla.
568. **Görev:** `aw-server` ve `aw-webui`'de, kullanıcıların takvimleri (Google Calendar, Outlook) ile entegrasyon yaparak planlanan ve gerçekleşen aktiviteleri karşılaştırmasını sağla.
569. **Görev:** `aw-webui`'de, "odak modu" (focus mode) başlatıldığında, dikkat dağıtıcı olarak işaretlenmiş web sitelerini veya uygulamaları geçici olarak engelleyen bir özellik ekle.
570. **Görev:** `aw-webui`'de, kullanıcıların verilerini içe aktarmalarını (import) sağlayan bir arayüz oluştur.
571. **Görev:** `aw-webui`'de, arama fonksiyonunu, tarih aralığı, kategori ve etiketlere göre filtreleme yapacak şekilde geliştir.
572. **Görev:** `aw-server` ve `aw-webui`'de, kullanıcıların iki faktörlü kimlik doğrulamayı (2FA) (örn: TOTP ile) etkinleştirebileceği bir ayar sayfası ekle.
573. **Görev:** `aw-webui`'de, zaman çizelgesindeki event'ler için "not ekleme" özelliği getir.
574. **Görev:** `aw-webui`'de, uygulamanın tüm özelliklerini hızlıca arayıp erişmeyi sağlayan `Cmd/Ctrl + K` gibi bir "komut paleti" (command palette) ekle.
575. **Görev:** `aw-webui`'de, kullanıcıların uygulama temasını (renkler, font boyutu) kişiselleştirebileceği bir ayar sayfası ekle.
576. **Görev:** `aw-server` ve `aw-webui`'de, kullanıcıların belirli periyotlarda (örn: her Pazar akşamı) e-posta ile haftalık özet raporu almasını sağlayan bir özellik ekle.
577. **Görev:** `aw-webui`'de, zaman çizelgesi görünümüne, event'leri sürükleyerek sürelerini veya başlangıç/bitiş zamanlarını değiştirme imkanı sağla.
578. **Görev:** `aw-server` ve `aw-webui`'de, kullanıcıların takvimleri (Google Calendar, Outlook) ile entegrasyon yaparak planlanan ve gerçekleşen aktiviteleri karşılaştırmasını sağla.
579. **Görev:** `aw-webui`'de, "odak modu" (focus mode) başlatıldığında, dikkat dağıtıcı olarak işaretlenmiş web sitelerini veya uygulamaları geçici olarak engelleyen bir özellik ekle.
580. **Görev:** `aw-webui`'de, kullanıcıların verilerini içe aktarmalarını (import) sağlayan bir arayüz oluştur.

### Alt Bölüm 7.3: Erişilebilirlik ve Uluslararasılaştırma (581-600)

581. **Görev:** `aw-webui`'yi, WCAG (Web Content Accessibility Guidelines) 2.1 AA standartlarına uygun hale getir.
582. **Görev:** `aw-webui`'deki tüm interaktif elemanların (butonlar, linkler, form alanları) klavye ile tamamen erişilebilir olduğundan emin ol.
583. **Görev:** `aw-webui`'deki tüm resimler (`<img>` tag'leri) için anlamlı `alt` metinleri ekle.
584. **Görev:** `aw-webui`'de, renk körü kullanıcılar için yeterli renk kontrastı olduğundan emin ol.
585. **Görev:** `aw-webui`'de, ekran okuyucular (screen readers) için `ARIA` (Accessible Rich Internet Applications) rollerini ve özniteliklerini (örn: `role="button"`, `aria-label`) doğru bir şekilde kullan.
586. **Görev:** `aw-webui`'de, `i18next` veya `vue-i18n` gibi bir kütüphane kurarak uluslararasılaştırma (i18n) altyapısını oluştur.
587. **Görev:** `aw-webui`'deki tüm kullanıcı arayüzü metinlerini (string'leri) koddan ayırıp dil dosyalarına (`locales/en.json`, `locales/tr.json`) taşı.
588. **Görev:** `aw-webui`'de, sağdan sola (RTL) yazılan diller (Arapça, İbranice vb.) için doğru CSS desteği sağla.
589. **Görev:** `aw-webui`'de, tarih, saat ve sayı formatlarının, kullanıcının yerel (locale) ayarlarına göre doğru şekilde gösterilmesini sağla.
590. **Görev:** `aw-webui`'de, kullanıcıların uygulama dilini manuel olarak değiştirebileceği bir ayar ekle.
591. **Görev:** `aw-webui`'de, odak (focus) durumlarının klavye ile gezinirken net bir şekilde görünür olduğundan emin ol.
592. **Görev:** `aw-webui`'deki tüm form alanlarının, ilişkili `<label>` elemanlarına sahip olduğundan emin ol.
593. **Görev:** `aw-webui`'de, dinamik olarak değişen içeriklerin (örn: hata mesajları, bildirimler) ekran okuyucular tarafından duyurulması için `ARIA live regions` kullan.
594. **Görev:** `aw-webui`'deki başlıkların (`<h1>`, `<h2>` vb.) mantıksal bir hiyerarşi içinde kullanılmasını sağla.
595. **Görev:** `aw-webui`'de, `axe-core` gibi bir araçla otomatik erişilebilirlik testleri yap ve bunları CI pipeline'ına entegre et.
596. **Görev:** `aw-webui`'deki dil dosyalarını, çoğul (pluralization) ve cinsiyet (gender) kurallarını destekleyecek şekilde yapılandır.
597. **Görev:** `aw-qt` masaüstü uygulamasının da, işletim sisteminin erişilebilirlik özellikleriyle (örn: yüksek kontrast modu, ekran okuyucu) uyumlu çalışmasını sağla.
598. **Görev:** `aw-webui`'de, kullanıcıların font boyutunu değiştirmesine olanak tanıyan bir ayar ekle.
599. **Görev:** `aw-webui`'de, animasyonları ve hareketli içerikleri azaltmayı tercih eden kullanıcılar için `prefers-reduced-motion` medya sorgusuna saygı göster.
600. **Görev:** Projenin dokümantasyonunu ve web sitesini de erişilebilirlik standartlarına uygun hale getir.
