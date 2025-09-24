# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
 # PeakActivity - Merkezi TODO Listesi (Kökten Çözümler ve Detaylı Implementasyon Önerileri)

Bu belge, PeakActivity projesindeki mevcut ve olası sorunları, bu sorunlara yönelik kökten çözümleri ve bu çözümlerin nasıl implemente edilebileceğine dair detaylı önerileri içermektedir. Her madde, senior software developer bakış açısıyla hazırlanmıştır ve mevcut fonksiyon ve özellikleri bozmadan, projedeki bağımlı/bağlı olduğu dosyalara uygun olacak şekilde tasarlanmıştır.

---

### 1-50: Kod Kalitesi, Lint, Refactoring ve Temizlik

1.  **Kodun Tamamında Lint Standartlarının Uygulanması**
    *   **Sorun:** Kod tabanında PEP8/ESLint/TSLint gibi standartlara uyumsuzluklar, kod okunabilirliğini ve sürdürülebilirliğini azaltıyor.
    *   **Çözüm:** Tüm projede (Python, JavaScript/TypeScript, Rust) statik kod analizi araçları (linters) entegre edilmeli ve kod standartları otomatize edilmeli. CI/CD pipeline’ına lint kontrolleri eklenerek kodun kalitesi sürekli denetlenmeli.
    *   **Implementasyon:**
        *   `pyproject.toml`, `eslint.config.mjs`, `Cargo.toml` gibi yapılandırma dosyalarında lint kurallarını belirleyin.
        *   Python için `flake8`, `black`, `isort`; JavaScript/TypeScript için `ESLint`, `Prettier`; Rust için `clippy` gibi araçları kullanın.
        *   Mevcut tüm kodları bu standartlara göre biçimlendirin ve fix'leyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `pyproject.toml` (tüm Python projeleri)
        *   `aw-webui/babel.config.js`, `aw-webui/jest.config.js`, `aw-webui/vite.config.js`, `aw-webui/vue.config.js`
        *   `functions/eslint.config.mjs`, `functions/jest.config.js`, `functions/vitest.config.ts`
        *   `aw-qt/src-tauri/Cargo.toml`
        *   `Makefile` (lint komutları)
        *   `.github/workflows/` (CI/CD lint adımları)

2.  **Kapsamlı Modül ve Fonksiyon Belgelendirmesi (Docstrings/JSDoc)**
    *   **Sorun:** Kod içinde modüllerin, sınıfların ve fonksiyonların amacı, parametreleri, dönüş değerleri ve istisnaları hakkında yeterli belgelendirme yok.
    *   **Çözüm:** Tüm public (genel kullanıma açık) modül, sınıf ve fonksiyonlar için standart docstring (Python) veya JSDoc (JavaScript/TypeScript) formatında belgelendirme yapılmalı. Bu, kodun anlaşılırlığını ve bakımını artırır.
    *   **Implementasyon:**
        *   Python için Sphinx veya MkDocs ile otomatik dokümantasyon oluşturmayı sağlayın.
        *   JavaScript/TypeScript için JSDoc/TSDoc kullanarak dökümantasyon standartlarını uygulayın.
        *   Mevcut tüm önemli fonksiyonlara açıklayıcı docstringler/JSDoc'lar ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm Python dosyaları (`.py`)
        *   Tüm JavaScript/TypeScript dosyaları (`.js`, `.ts`, `.vue`)
        *   `docs/` klasörü (dokümantasyon oluşturulacak yer)

3.  **Tekrar Eden Kodların (Duplication) Azaltılması**
    *   **Sorun:** Projenin farklı yerlerinde aynı veya benzer kod blokları tekrar ediyor, bu da bakımı zorlaştırıyor ve hata riskini artırıyor.
    *   **Çözüm:** Tekrar eden kodlar tespit edilip, yeniden kullanılabilir fonksiyonlara, sınıflara veya yardımcı modüllere dönüştürülmeli. DRY (Don't Repeat Yourself) prensibi uygulanmalı.
    *   **Implementasyon:**
        *   `aw-core/`: Ortak Python yardımcı fonksiyonları ve sınıfları buraya taşınabilir.
        *   `functions/src/utils/`: Ortak TypeScript yardımcı fonksiyonları buraya taşınabilir.
        *   `aw-webui/src/util/`: Ortak Vue/JS yardımcıları buraya taşınabilir.
        *   Kod tabanında kopyalanmış kodları aramak için statik analiz araçları (örneğin PMD, JPlag) kullanılabilir.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-core/`
        *   `functions/src/utils/`
        *   `aw-webui/src/util/`
        *   `aw-server/aw_server/api.py`, `aw-server/aw_server/rest.py` (API ve REST katmanlarında benzerlikler)

4.  **Eski (Deprecated) Kodların Temizlenmesi**
    *   **Sorun:** Kullanılmayan veya güncel olmayan fonksiyonlar, sınıflar ve dosyalar kod tabanını şişiriyor, anlaşılırlığı azaltıyor ve potansiyel güvenlik riski oluşturuyor.
    *   **Çözüm:** Kullanılmayan kodlar tespit edilip silinmeli veya geçici olarak yorum satırı haline getirilmeli. Eski API endpoint'leri veya özellikler aşamalı olarak kaldırılmalı.
    *   **Implementasyon:**
        *   Kod tabanında `grep -r "deprecated"` veya benzeri aramalar yapın.
        *   Git geçmişini (blame) kullanarak kodun ne zamandır kullanılmadığını veya kim tarafından eklendiğini kontrol edin.
        *   Silme işleminden önce kodun gerçekten kullanılmadığından emin olmak için testleri çalıştırın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm kod dosyaları
        *   `problems.md`, `problems2.md`, `problems3.md`, `problems4.md`, `problems5.md` (bu dosyalarda belirtilen eski kodlar)

5.  **Kod Karmaşıklığının Azaltılması (Cyclomatic Complexity)**
    *   **Sorun:** Yüksek siklomatik karmaşıklığa sahip fonksiyonlar, test edilmesi, anlaşılması ve bakımı zor kodlara yol açıyor.
    *   **Çözüm:** Karmaşık fonksiyonlar daha küçük, tek sorumluluk prensibine uygun parçalara ayrılmalı. Koşullu mantıklar basitleştirilmeli veya strateji/durum desenleri kullanılmalı.
    *   **Implementasyon:**
        *   Radon (Python) veya ESLint (JS/TS) gibi araçlarla karmaşıklık analizi yapın.
        *   Yüksek karmaşıklığa sahip fonksiyonları refaktör edin. Özellikle `if-else` zincirlerini veya derinlemesine iç içe geçmiş döngüleri hedefleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/api.py` (karmaşık olabilecek API mantığı)
        *   `aw-qt/aw_qt/main.py`, `aw-qt/aw_qt/manager.py` (UI/iş mantığı)
        *   `functions/src/services/` (uzun servis fonksiyonları)

6.  **Değişken, Fonksiyon ve Sınıf İsimlendirmelerinde Anlamsallık**
    *   **Sorun:** Değişken, fonksiyon ve sınıf isimleri (özellikle Türkçe harfler içerenler) amaçlarını net bir şekilde yansıtmıyor veya tutarsız.
    *   **Çözüm:** Tüm isimlendirmelerde İngilizce, açıklayıcı ve anlamsal isimler kullanılmalı. Proje genelinde tutarlı bir isimlendirme kuralı (camelCase, snake_case, PascalCase) belirlenmeli.
    *   **Implementasyon:**
        *   Kod tabanında İngilizce olmayan veya anlamsız isimleri tespit edin.
        *   Refaktöring araçlarını kullanarak bu isimleri güvenli bir şekilde değiştirin.
        *   Yeni yazılan tüm kodlarda bu kurala uyulduğundan emin olun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm kod dosyaları (Python, JS/TS, Rust)

7.  **Kod Yorumlarının Güncellenmesi ve Tutarlılığı**
    *   **Sorun:** Kod yorumları eski, yanıltıcı veya hiç yok. Türkçe yorumlar yabancı geliştiriciler için sorun yaratıyor.
    *   **Çözüm:** Tüm kod yorumları güncel, doğru ve İngilizce olmalı. Yorumlar, kodun "nasıl" çalıştığından ziyade "neden" çalıştığını açıklamalıdır. Karmaşık mantıklar için diyagram veya referans linkleri eklenebilir.
    *   **Implementasyon:**
        *   Mevcut yorumları gözden geçirin ve İngilizce'ye çevirin.
        *   Gereksiz veya eski yorumları silin.
        *   Yeni yorumları İngilizce olarak ve ilgili kod bloğunu açıklayacak şekilde ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm kod dosyaları

8.  **Bağımlılık Enjeksiyonu (Dependency Injection) Uygulaması**
    *   **Sorun:** Modüller arasında sıkı bağımlılıklar (tight coupling) test edilebilirliği zorlaştırıyor ve kodun esnekliğini azaltıyor.
    *   **Çözüm:** Sıkı bağımlılıkları azaltmak ve birim testlerini kolaylaştırmak için bağımlılık enjeksiyonu prensibi uygulanmalı. Servisler veya yöneticiler dışarıdan enjekte edilmeli.
    *   **Implementasyon:**
        *   Python için `attrs`, `dataclasses` veya bir DI framework'ü (örneğin `injector`) kullanılabilir.
        *   TypeScript için constructor injection veya bir DI kütüphanesi (`reflect-metadata`) kullanılabilir.
        *   Özellikle `aw-server/aw_server/api.py` ve `functions/src/services/` gibi servis katmanlarında uygulayın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/api.py`
        *   `functions/src/services/` (tüm servis dosyaları)
        *   Test dosyaları (`tests/`, `functions/test/`)

9.  **Sorumlulukların Ayrılması (Separation of Concerns)**
    *   **Sorun:** Fonksiyonlar veya sınıflar birden fazla sorumluluğa sahip (örneğin, hem veri çekme hem de iş mantığı), bu da bakımı zorlaştırıyor.
    *   **Çözüm:** Her bir modül, sınıf veya fonksiyonun tek bir sorumluluğu olmalı (Single Responsibility Principle). İş mantığı, veri erişim katmanı, sunum katmanı birbirinden ayrılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/api.py` ve `aw-server/aw_server/rest.py`: API ve iş mantığını daha net ayırın.
        *   `functions/src/api/` ve `functions/src/services/`: API endpoint'leri ve iş mantığı servislerini birbirinden daha net ayırın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/api.py`, `aw-server/aw_server/rest.py`
        *   `functions/src/api/`
        *   `functions/src/services/`

10. **Aşırı Geniş Kapsamlı Fonksiyon/Sınıfların Parçalanması**
    *   **Sorun:** Bazı fonksiyonlar veya sınıflar çok fazla kod içeriyor ve bu da anlaşılmalarını ve yönetilmelerini zorlaştırıyor.
    *   **Çözüm:** Büyük fonksiyonlar ve sınıflar daha küçük, odaklanmış parçalara ayrılmalı. Her parçanın belirli bir görevi olmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/main.py`, `aw-qt/aw_qt/main.py`, `functions/src/index.ts` gibi ana giriş noktası dosyalarındaki karmaşıklığı azaltın.
        *   Büyük sınıfları yardımcı sınıflara veya modüllere bölün.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/main.py`
        *   `aw-qt/aw_qt/main.py`
        *   `functions/src/index.ts`
        *   `aw-server/aw_server/api.py` (geniş API mantığı)

11. **Sihirli Sayıların/Metinlerin Sabitlere Dönüştürülmesi**
    *   **Sorun:** Kod içinde doğrudan sayısal değerler veya metin dizeleri (magic numbers/strings) kullanılması, kodun okunabilirliğini azaltıyor ve bakımı zorlaştırıyor.
    *   **Çözüm:** Bu tür değerler, açıklayıcı isimlere sahip sabit değişkenlere dönüştürülmeli ve merkezi bir yerde (örneğin bir `constants.py` veya `constants.ts` dosyası) tanımlanmalı.
    *   **Implementasyon:**
        *   `aw-core/constants.py` (oluşturulabilir) veya `aw-server/aw_server/config.py` içine sabitler ekleyin.
        *   `functions/src/utils/constants.ts` (oluşturulabilir) içine sabitler ekleyin.
        *   `aw-webui/src/util/constants.js` (oluşturulabilir) içine sabitler ekleyin.
        *   Tüm kod tabanını tarayarak sihirli sayı/metin kullanımlarını bulun ve dönüştürün.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm kod dosyaları
        *   Yeni oluşturulacak `constants` dosyaları

12. **Global Değişkenlerin Kullanımının Azaltılması**
    *   **Sorun:** Aşırı global değişken kullanımı, kodun test edilebilirliğini ve paralel çalışabilirliğini zorlaştırıyor, beklenmedik yan etkilere yol açıyor.
    *   **Çözüm:** Global değişken kullanımı minimuma indirilmeli. Bunun yerine, fonksiyonlara parametre olarak geçirme veya sınıf özelliklerini kullanma tercih edilmeli. Gerekliyse, global durum yönetimi için daha kontrollü mekanizmalar (singleton desen, bağımlılık enjeksiyonu) kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/config.py` gibi yerlerde global durumu azaltın veya daha kontrollü hale getirin.
        *   Flask `current_app` gibi bağlamsal proxy'leri güvenli bir şekilde kullanın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/config.py`
        *   `aw-server/aw_server/main.py`
        *   `aw-qt/aw_qt/config.py`

13. **Veri Modellerinin ve Şemalarının Standardizasyonu**
    *   **Sorun:** Veritabanı modelleri, API yanıt şemaları veya iç veri yapıları arasında tutarsızlıklar var.
    *   **Çözüm:** Veri modelleri ve şemaları (örneğin JSON Schema, OpenAPI/Swagger ile) tek bir yerde tanımlanmalı ve projenin tüm katmanlarında (frontend, backend, veritabanı) tutarlı bir şekilde kullanılmalı.
    *   **Implementasyon:**
        *   `functions/src/types/` dizinindeki TypeScript arayüzlerini ve tiplerini gözden geçirin ve tutarlılığı sağlayın.
        *   Python tarafında veri modelleri için `dataclasses` veya `Pydantic` kullanılabilir.
        *   API dokümantasyonu için OpenAPI/Swagger tanımları oluşturun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `functions/src/types/`
        *   `aw-server/aw_server/api.py` (API şemaları)
        *   `aw_datastore/` (veritabanı modelleri)

14. **Asenkron İşlemlerin Yönetimi ve Hata Yakalama**
    *   **Sorun:** Asenkron kodlarda (callback'ler, promise'ler, async/await) hata yönetimi yetersiz veya karmaşık, bu da beklenmedik çökmelere yol açıyor.
    *   **Çözüm:** Asenkron işlemlerde tutarlı bir hata yakalama mekanizması (örneğin `try-catch` blokları, promise zincirlerinde `.catch()`, `asyncHandler` yardımcıları) kullanılmalı.
    *   **Implementasyon:**
        *   `functions/src/utils/asyncHandler.ts`: Bu yardımcı fonksiyonu tüm async route handler'larda kullanıldığından emin olun.
        *   `aw-webui/src/mixins/asyncErrorCaptured.js`: Vue bileşenlerinde asenkron hataların doğru şekilde yakalandığından emin olun.
        *   Python `asyncio` tabanlı kodlarda `try-except` bloklarını güçlendirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `functions/src/utils/asyncHandler.ts`
        *   `functions/src/api/` (tüm API endpoint'leri)
        *   `aw-webui/src/mixins/asyncErrorCaptured.js`
        *   `aw-server/aw_server/server.py` (async işlemler)

15. **Hatalı Loglama Seviyelerinin Düzeltilmesi**
    *   **Sorun:** Log mesajları yanlış loglama seviyeleriyle (DEBUG, INFO, WARNING, ERROR) yazılıyor, bu da logların analizini zorlaştırıyor.
    *   **Çözüm:** Her log mesajı, olayın ciddiyetine ve önemine göre doğru loglama seviyesiyle yazılmalı. Geliştirme ortamında daha detaylı loglama (`DEBUG`), üretimde ise daha kritik loglar (`INFO`, `WARNING`, `ERROR`) kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/log.py`: Loglama yapılandırmasını kontrol edin.
        *   Tüm `print()` ifadelerini uygun `logging` çağrılarıyla değiştirin.
        *   `functions/src/index.ts`: Firebase Functions'ta `console.log`, `console.error` yerine `functions.logger` kullanın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/log.py`
        *   Tüm Python dosyaları
        *   `functions/src/index.ts` ve diğer TypeScript dosyaları

16. **Kod Yürütme Sırasında Yan Etkilerin Kontrolü**
    *   **Sorun:** Fonksiyonlar veya metotlar, açıkça belirtilmeyen veya beklenmedik yan etkilere (örneğin global durumu değiştirme, dosya yazma) sahip.
    *   **Çözüm:** Fonksiyonların yan etkileri minimuma indirilmeli ve mümkün olduğunca saf fonksiyonlar yazılmalı. Yan etkiler kontrol altında tutulmalı ve açıkça belgelenmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/sync.py`: Veri senkronizasyonunda yan etkileri kontrol edin.
        *   `aw-watcher-afk/aw_watcher_afk/afk.py`: Durum değişikliklerini ve yan etkileri dikkatlice yönetin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/sync.py`
        *   `aw-watcher-afk/aw_watcher_afk/afk.py`
        *   `aw-qt/aw_qt/manager.py`

17. **Karmaşık Koşullu Mantıkların Basitleştirilmesi**
    *   **Sorun:** Uzun `if-elif-else` zincirleri veya iç içe geçmiş koşullu ifadeler, kodun okunabilirliğini ve anlaşılabilirliğini azaltıyor.
    *   **Çözüm:** Karmaşık koşullu mantıklar, strateji desenleri, durum makineleri veya polimorfizm kullanılarak basitleştirilmeli. Guard clause'lar ve erken çıkışlar tercih edilmeli.
    *   **Implementasyon:**
        *   `aw-watcher-window/aw_watcher_window/windows.py`: Windows izleyici mantığını basitleştirin.
        *   `aw-server/aw_server/data_anonymization/anonymizer.py`: Anomimleştirme kurallarını daha okunabilir hale getirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-watcher-window/aw_watcher_window/windows.py`
        *   `aw-server/aw_server/data_anonymization/anonymizer.py`
        *   `functions/src/services/ai/` (varsa, AI mantığı)

18. **Dize Birleştirme Yerine Formatlı Dizeler (f-strings/template literals)**
    *   **Sorun:** Dize birleştirme (`+`) yerine daha modern ve okunabilir formatlı dize yöntemleri (Python f-strings, JavaScript template literals) kullanılmıyor.
    *   **Çözüm:** Tüm dize birleştirme işlemleri için dilin sunduğu en modern ve okunabilir yöntemler (Python için f-strings, JavaScript/TypeScript için template literals) kullanılmalı.
    *   **Implementasyon:**
        *   Tüm Python dosyalarında `%s` veya `+` ile dize birleştirmeleri yerine f-strings kullanın.
        *   Tüm JavaScript/TypeScript dosyalarında `+` ile dize birleştirmeleri yerine template literals kullanın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm Python dosyaları (`.py`)
        *   Tüm JavaScript/TypeScript dosyaları (`.js`, `.ts`, `.vue`)

19. **Kullanılmayan İthalatların (Imports) Temizlenmesi**
    *   **Sorun:** Kod dosyalarında kullanılmayan ithalatlar veya bağımlılıklar mevcut, bu da kod tabanını şişiriyor ve gereksiz bağımlılıklara yol açıyor.
    *   **Çözüm:** Tüm kullanılmayan ithalatlar otomatik araçlarla (örneğin `isort --check-only --diff`, ESLint) tespit edilmeli ve temizlenmeli.
    *   **Implementasyon:**
        *   Python için `isort`, `autoflake` gibi araçları kullanın.
        *   JavaScript/TypeScript için ESLint'in `no-unused-vars` kuralını etkinleştirin ve fix'leyin.
        *   IDE eklentileri (VS Code Auto Import) bu konuda yardımcı olabilir.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm kod dosyaları

20. **Sabit Dizelerin Yerelleştirme Dosyalarına Taşınması (i18n)**
    *   **Sorun:** Kullanıcı arayüzü metinleri veya hata mesajları kod içinde sabit dizeler olarak yer alıyor, bu da dil desteğini ve uluslararasılaşmayı zorlaştırıyor.
    *   **Çözüm:** Tüm kullanıcı arayüzü metinleri, hata mesajları ve diğer sabit dizeler, yerelleştirme (i18n) dosyalarına taşınmalı. Bu, uygulamanın farklı dillerde kolayca desteklenmesini sağlar.
    *   **Implementasyon:**
        *   `aw-webui/src/locales/` dizini içine dil dosyaları (örneğin `en.json`, `tr.json`) oluşturun.
        *   Vue I18n gibi bir kütüphane entegre edin.
        *   Tüm sabit dizeleri bu yerelleştirme dosyalarından okunacak şekilde kodu güncelleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/locales/`
        *   `aw-webui/src/App.vue`, `aw-webui/src/main.js` (i18n entegrasyonu)
        *   Tüm Vue bileşenleri (`.vue`)

21. **Test Ortamlarında Veri Temizliği (Test Data Management)**
    *   **Sorun:** Entegrasyon veya uçtan uca testler çalıştırılırken önceki testlerden kalan veriler, testlerin tutarsız sonuçlar vermesine yol açıyor.
    *   **Çözüm:** Her test çalıştırmasından önce veritabanı veya diğer veri depoları temizlenmeli veya test senaryosuna özel veri setleri kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/tests/conftest.py`: Pytest fixture'ları kullanarak test veritabanını her testten önce sıfırlayın.
        *   `functions/test/`: Firebase emülatörleri veya test util'leri ile veri temizliği sağlayın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/tests/conftest.py`
        *   `aw-server/tests/test_server.py`, `aw-server/tests/test_firebase_integration.py`
        *   `functions/test/` (tüm test dosyaları)

22. **Özel Durumların (Edge Cases) Test Edilmesi**
    *   **Sorun:** Kodun normal akış testleri yapılıyor ancak özel durumlar (boş girdiler, sıfır değerleri, negatif sayılar, sınır değerleri) yeterince test edilmiyor.
    *   **Çözüm:** Her fonksiyon ve modül için özel durum senaryoları belirlenmeli ve bu durumları kapsayan birim testleri ve entegrasyon testleri yazılmalı.
    *   **Implementasyon:**
        *   `aw-server/tests/`, `aw-qt/tests/`, `aw-watcher-afk/tests/`, `functions/test/` dizinlerinde her modül için kapsamlı testler ekleyin.
        *   Özellikle sayısal işlemler, tarih/saat işlemleri ve girdi işleme fonksiyonları için özel durum testleri yazın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm test dosyaları (`.test.py`, `.test.ts`, `.test.js`)
        *   `functions/src/services/utils/math-utils.ts` gibi yardımcı fonksiyonlar

23. **Güvenlik Testleri ve Zafiyet Tarama Otomasyonu**
    *   **Sorun:** Uygulama güvenlik testleri (örneğin, SQL Injection, XSS, CSRF) manuel olarak yapılıyor veya hiç yapılmıyor, bu da güvenlik açığı tespitini geciktiriyor.
    *   **Çözüm:** Güvenlik testleri CI/CD pipeline'ına entegre edilmeli. Statik Uygulama Güvenliği Testi (SAST) ve Dinamik Uygulama Güvenliği Testi (DAST) araçları kullanılmalı.
    *   **Implementasyon:**
        *   CI/CD (`.github/workflows/` veya benzeri): Bandit (Python), OWASP Dependency-Check, Snyk gibi araçları entegre edin.
        *   `SECURITY.md`: Güvenlik test süreçlerini ve zafiyet raporlama politikasını detaylandırın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   CI/CD yapılandırma dosyaları
        *   `SECURITY.md`
        *   `functions/test/security/firestore.test.ts` (genişletilebilir)

24. **Performans İzleme ve Log Analizi**
    *   **Sorun:** Uygulamanın üretim ortamındaki performansı (yanıt süreleri, bellek kullanımı, CPU) yeterince izlenmiyor veya loglar etkili bir şekilde analiz edilmiyor.
    *   **Çözüm:** Prometheus, Grafana, ELK Stack gibi merkezi izleme ve loglama çözümleri entegre edilmeli. Anormal durumlar veya performans düşüşleri için otomatik uyarılar yapılandırılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/log.py`: Log formatını yapılandırılmış (JSON) hale getirin.
        *   `apphosting.emulator.yaml`: Gerekli izleme yapılandırmalarını ekleyin.
        *   `aw-server/scripts/profile-werkzeug.py`, `profile-werkzeug-read.py`: Mevcut performans profil araçlarını kullanarak darboğazları tespit edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/log.py`
        *   `apphosting.emulator.yaml`
        *   `aw-server/scripts/` (profil araçları)

25. **Kod Kapsam (Code Coverage) Analizi**
    *   **Sorun:** Mevcut testlerin kodun ne kadarını kapsadığı bilinmiyor veya kapsama oranı düşük.
    *   **Çözüm:** Test suite'lerinin kod kapsama oranı düzenli olarak ölçülmeli ve iyileştirilmeli. Minimum bir kod kapsama hedefi (örneğin %80) belirlenmeli ve CI/CD'de zorunlu kılınmalı.
    *   **Implementasyon:**
        *   Python için `pytest-cov`, JavaScript/TypeScript için `c8` veya `Istanbul` gibi araçları entegre edin.
        *   `Makefile` veya CI/CD scriptlerine kod kapsama raporu oluşturma adımları ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `pyproject.toml`, `package.json` (bağımlılıklar)
        *   `Makefile` (test komutları)
        *   `.github/workflows/` (CI/CD test adımları)

26. **Modüler Test Yaklaşımı**
    *   **Sorun:** Testler çok büyük veya birden fazla modülün sorumluluğunu kapsıyor, bu da testlerin yavaş çalışmasına ve hataların tespitini zorlaştırmasına neden oluyor.
    *   **Çözüm:** Her bir modül için bağımsız, hızlı çalışan birim testleri yazılmalı. Entegrasyon testleri sadece modüller arası etkileşimleri test etmeli. Uçtan uca testler kullanıcı akışlarını kapsamalı.
    *   **Implementasyon:**
        *   `aw-server/tests/test_client.py` ve `test_server.py`: Testleri daha küçük, modüler dosyalara ve fonksiyonlara bölün.
        *   `functions/test/services/encryption/BaseEncryptionService.test.ts`: Servis bazlı birim testleri yazın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/tests/`
        *   `aw-qt/tests/`
        *   `aw-watcher-afk/tests/`
        *   `functions/test/`
        *   `aw-webui/test/unit/`

27. **Mocklama ve Saplama (Mocking/Stubbing) Kullanımı**
    *   **Sorun:** Birim testlerinde harici bağımlılıklar (veritabanı, API, dosya sistemi) gerçek halleriyle kullanılıyor, bu da testlerin yavaş ve kırılgan olmasına yol açıyor.
    *   **Çözüm:** Birim testlerinde harici bağımlılıklar için mocklama veya saplama teknikleri kullanılmalı. Bu, testlerin izole ve hızlı çalışmasını sağlar.
    *   **Implementasyon:**
        *   Python için `unittest.mock` veya `pytest-mock` kullanın.
        *   JavaScript/TypeScript için `jest.mock` veya `sinon.js` kullanın.
        *   Özellikle veritabanı veya ağ çağrıları yapan fonksiyonların testlerinde uygulayın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm birim test dosyaları

28. **Uçtan Uca (End-to-End) Test Otomasyonu**
    *   **Sorun:** Kullanıcı akışları ve uygulamanın genel işlevselliği manuel olarak test ediliyor, bu da zaman alıcı ve hataya açık.
    *   **Çözüm:** Cypress, Playwright, Selenium gibi araçlarla uçtan uca testler otomatikleştirilmeli. Kritik kullanıcı senaryoları düzenli olarak test edilmeli.
    *   **Implementasyon:**
        *   `aw-webui/test/e2e/screenshot.test.js`: Mevcut e2e testlerini genişletin veya yeni testler ekleyin.
        *   CI/CD pipeline'ına e2e test adımları ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/test/e2e/`
        *   CI/CD yapılandırma dosyaları

29. **Test Verilerinin Sürüm Kontrolü**
    *   **Sorun:** Test verileri versiyon kontrolünde değil veya test ortamları arasında tutarsız.
    *   **Çözüm:** Test verileri (örneğin JSON veya YAML formatında) versiyon kontrol sistemine (Git) dahil edilmeli ve testler bu verilere bağımlı olacak şekilde yazılmalı.
    *   **Implementasyon:**
        *   `aw-server/tests/fixtures/` (oluşturulabilir) veya `functions/test/fixtures/` (oluşturulabilir) dizinlerine test verilerini ekleyin.
        *   Testler bu fixture'ları kullanacak şekilde güncellenmeli.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Test dosyaları
        *   Yeni oluşturulacak test veri dizinleri

30. **Test Raporlaması ve Görselleştirme**
    *   **Sorun:** Test sonuçları sadece konsolda gösteriliyor ve okunması/analiz edilmesi zor. Test başarısızlıkları hakkında görsel raporlar yok.
    *   **Çözüm:** Test sonuçları Jenkins, GitLab CI/CD gibi araçlarla entegre edilerek görselleştirilmeli. Başarısız testler için detaylı raporlar (loglar, ekran görüntüleri) sağlanmalı.
    *   **Implementasyon:**
        *   `pytest`, `jest` veya `vitest` için JUnit XML veya HTML raporlama eklentileri kullanın.
        *   CI/CD araçlarında bu raporları gösterecek yapılandırmayı yapın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `Makefile` (test komutları)
        *   CI/CD yapılandırma dosyaları

31. **Eksik Birim Testleri İçin Kapsam Genişletme**
    *   **Sorun:** Kodun bazı kritik modülleri veya fonksiyonları için birim testleri eksik veya yetersiz.
    *   **Çözüm:** Kod kapsam raporları (madde 25) kullanılarak test kapsamı düşük olan alanlar tespit edilmeli ve bu alanlar için yeni birim testleri yazılmalı.
    *   **Implementasyon:**
        *   Özellikle `aw-core/`, `aw-server/aw_server/api.py`, `functions/src/services/` gibi iş mantığını içeren modüller için testler yazın.
        *   `aw-server/tests/test_client.py` ve `test_server.py` gibi mevcut test dosyalarını genişletin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/tests/`
        *   `functions/test/`
        *   `aw-qt/tests/`
        *   `aw-watcher-afk/tests/`
        *   `aw-webui/test/unit/`

32. **Veritabanı Entegrasyon Testlerinin İyileştirilmesi**
    *   **Sorun:** Veritabanı ile etkileşime giren kodun testleri yetersiz veya gerçek veritabanı bağlantısı gerektiriyor.
    *   **Çözüm:** Veritabanı entegrasyon testleri için gerçek veritabanı yerine hafif veritabanları (örneğin SQLite in-memory) veya test konteynerleri (Docker-compose ile PostgreSQL/Firestore emülatörü) kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/tests/conftest.py`: Testlerde geçici veritabanı kullanımı için fixture'ları güncelleyin.
        *   `aw-server/tests/test_firebase_integration.py`: Firebase emülatörü kullanımını optimize edin.
        *   `apphosting.emulator.yaml`: Emülatör yapılandırmalarını kontrol edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/tests/conftest.py`
        *   `aw-server/tests/test_firebase_integration.py`
        *   `apphosting.emulator.yaml`

33. **UI Testlerinde Geri Besleme ve Hata Tespiti**
    *   **Sorun:** UI testleri çalışırken (e2e, bileşen testleri) hatalar veya görsel regresyonlar hakkında yeterli geri bildirim sağlanmıyor.
    *   **Çözüm:** UI testlerinde ekran görüntüleri, video kayıtları veya DOM snapshot'ları alınmalı. Görsel regresyon testleri (Percy, Chromatic) entegre edilmeli.
    *   **Implementasyon:**
        *   `aw-webui/test/e2e/screenshot.test.js`: Ekran görüntüsü alma işlevselliğini genişletin.
        *   Cypress veya Playwright testlerinde hata durumunda otomatik ekran görüntüsü/video kaydı alın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/test/e2e/screenshot.test.js`
        *   CI/CD yapılandırma dosyaları

34. **Konfigürasyon Dosyalarının Versiyon Kontrolü**
    *   **Sorun:** Uygulama konfigürasyonları (veritabanı bağlantı dizeleri, API anahtarları gibi hassas bilgiler hariç) versiyon kontrolünde değil veya tutarsız.
    *   **Çözüm:** Uygulama konfigürasyon dosyaları (hassas bilgiler hariç) versiyon kontrol sistemine (Git) dahil edilmeli. Ortam bağımlı konfigürasyonlar için `.env` dosyaları kullanılmalı ve `.gitignore`'a eklenmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/config.py`, `aw-qt/aw_qt/config.py`: Konfigürasyon yönetimini standardize edin.
        *   `firebase.json`, `apphosting.emulator.yaml`: Bu dosyaların versiyon kontrolünde olduğundan ve doğru yapılandırıldığından emin olun.
        *   `.gitignore`: Hassas konfigürasyon dosyalarını (örneğin `.env`) dahil edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/config.py`
        *   `aw-qt/aw_qt/config.py`
        *   `firebase.json`
        *   `apphosting.emulator.yaml`
        *   `.gitignore`

35. **Ortam Değişkenlerinin Kullanımı**
    *   **Sorun:** Uygulama konfigürasyonları (özellikle API anahtarları, veritabanı şifreleri) kod içine gömülü veya güvensiz şekillerde yönetiliyor.
    *   **Çözüm:** Hassas konfigürasyonlar da dahil olmak üzere tüm ortama özel konfigürasyonlar, ortam değişkenleri aracılığıyla yönetilmeli. Bunlar `.env` dosyaları ile yerel olarak, üretimde ise cloud sağlayıcının Secret Management veya ortam değişkeni servisleri ile sağlanmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/config.py`: `os.environ` kullanarak ortam değişkenlerini okuyun.
        *   `functions/src/firebaseAdmin.ts`: Firebase Functions için ortam değişkenlerini kullanın.
        *   `.env.example` dosyası oluşturarak gerekli ortam değişkenlerini listeleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/config.py`
        *   `functions/src/firebaseAdmin.ts`
        *   `.gitignore` ( `.env` için)

36. **Proje Yapılandırmasının Tekilleştirilmesi**
    *   **Sorun:** Farklı modüller veya servisler için yapılandırma dosyaları (örneğin `pyproject.toml`, `Makefile`) tekrar ediyor veya tutarsız.
    *   **Çözüm:** Mümkün olduğunca ortak yapılandırmalar tek bir yerde (root `pyproject.toml` veya merkezi bir `config` dizini) tanımlanmalı ve modüller arasında paylaşılmalı.
    *   **Implementasyon:**
        *   `pyproject.toml`: Projenin root dizinindeki `pyproject.toml`'u merkezi bir yapılandırma dosyası olarak kullanmayı değerlendirin.
        *   `Makefile`: Tekrar eden makefile komutlarını tekilleştirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Root dizindeki `pyproject.toml`
        *   `Makefile` (root)
        *   Her modülün kendi `pyproject.toml`'u (gereksiz olanları birleştirin)

37. **Uygulama Bağımlılıklarının Yönetimi**
    *   **Sorun:** Farklı modüllerin bağımlılıkları (Python, Node.js, Rust) arasında uyumsuzluklar veya versiyon çakışmaları var.
    *   **Çözüm:** Bağımlılıklar Poetry (Python) veya npm/yarn (Node.js) gibi paket yöneticileri ile doğru bir şekilde yönetilmeli. Bağımlılık kilit dosyaları (`poetry.lock`, `package-lock.json`) versiyon kontrolüne dahil edilmeli.
    *   **Implementasyon:**
        *   Tüm Python modülleri için Poetry'nin doğru yapılandırıldığından emin olun.
        *   `aw-webui` ve `functions` için `package.json` ve `package-lock.json`'ların güncel olduğundan emin olun.
        *   `poetry.lock` ve `package-lock.json` dosyalarını `.gitignore`'a *eklemeyin* (versiyon kontrolünde olmaları gerekir).
    *   **İlişkili Dosyalar/Kodlar:**
        *   `pyproject.toml` (tüm Python projeleri)
        *   `poetry.lock` (tüm Python projeleri)
        *   `aw-webui/package.json`, `aw-webui/poetry.lock` (varsa)
        *   `functions/package.json`

38. **Çalışma Ortamının İzolasyonu (Virtual Environments/Docker)**
    *   **Sorun:** Geliştirme ortamları arasında bağımlılık çakışmaları yaşanıyor veya yeni geliştiricilerin ortam kurulumu zorlaşıyor.
    *   **Çözüm:** Her modül için sanal ortamlar (Python `venv`, `poetry env`) kullanılmalı veya tüm proje Docker konteynerleri içinde çalışacak şekilde yapılandırılmalı.
    *   **Implementasyon:**
        *   `scripts/ci/install_python.ps1`, `setup_venv_osx.sh`: Sanal ortam kurulum scriptlerini optimize edin.
        *   `Dockerfile` (varsa) oluşturarak her servisi Docker konteynerinde çalıştırın.
        *   `docker-compose.yml` (varsa) ile çoklu servisleri yönetin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `scripts/ci/`
        *   `poetry.lock`
        *   `Dockerfile` (oluşturulacaksa)
        *   `docker-compose.yml` (oluşturulacaksa)

39. **Statik Dosya ve Ortam Yönetimi**
    *   **Sorun:** Frontend statik dosyaları (CSS, JS, resimler) sunucuda veya CDN'de verimli bir şekilde servis edilmiyor.
    *   **Çözüm:** Statik dosyalar için doğru MIME tipleri, sıkıştırma (gzip/brotli) ve önbellekleme başlıkları (Cache-Control) yapılandırılmalı. Üretimde CDN kullanımı tercih edilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/custom_static.py`: Statik dosya sunumunu optimize edin.
        *   `aw-server/aw_server/static/`: Statik dosyaların dağıtımını kontrol edin.
        *   `public/index.html`: Statik dosya referanslarını kontrol edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/custom_static.py`
        *   `aw-server/aw_server/static/`
        *   `public/index.html`
        *   Web sunucusu (Nginx/Apache) yapılandırması

40. **Tarih ve Saat İşlemleri için Ortak Kütüphane Kullanımı**
    *   **Sorun:** Farklı modüller veya katmanlar arasında tarih ve saat işlemleri için farklı kütüphaneler (örneğin `datetime`, `arrow` Python'da; `Date`, `Moment.js`, `date-fns` JavaScript'te) kullanılıyor, bu da tutarsızlığa yol açıyor.
    *   **Çözüm:** Tüm tarih ve saat işlemleri için proje genelinde tek bir güçlü ve tutarlı kütüphane kullanılmalı (Python için `Pendulum` veya `Arrow`; JavaScript/TypeScript için `date-fns` veya `Luxon`).
    *   **Implementasyon:**
        *   Tüm Python dosyalarını tarayarak tarih/saat kütüphanesi kullanımlarını standardize edin.
        *   Tüm JavaScript/TypeScript dosyalarını tarayarak tarih/saat kütüphanesi kullanımlarını standardize edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm kod dosyaları
        *   `pyproject.toml`, `package.json` (yeni bağımlılık eklenecekse)

41. **Uygulama Versiyonlama ve Sürüm Notları Yönetimi**
    *   **Sorun:** Uygulama versiyonları tutarsız veya sürüm notları (changelog) yeterli bilgi içermiyor.
    *   **Çözüm:** Semantik versiyonlama (Semantic Versioning) kullanılmalı. Her sürüm için detaylı sürüm notları (`CHANGELOG.md` veya `version.md`) otomatik olarak veya manuel olarak oluşturulmalı.
    *   **Implementasyon:**
        *   `version.md`: Sürüm notlarını burada detaylıca tutun. Mevcut formatı zenginleştirin (yeni özellikler, bug fix'ler, breaking changes).
        *   `scripts/build_changelog.py`: Bu scripti kullanarak veya yeni bir script yazarak sürüm notlarının otomatik oluşturulmasını sağlayın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `version.md`
        *   `scripts/build_changelog.py`
        *   `pyproject.toml` (versiyon bilgisi)

42. **Lisans Bilgilerinin Güncellenmesi ve Tutarlılığı**
    *   **Sorun:** Projenin lisans dosyaları (LICENSE.txt) güncel değil veya farklı modüller arasında lisans bilgileri tutarsız.
    *   **Çözüm:** Tüm modüllerin ve projenin ana lisans dosyası güncel ve tutarlı olmalı. Açık kaynak lisanslarına uyumluluk kontrol edilmeli.
    *   **Implementasyon:**
        *   Tüm `LICENSE.txt` dosyalarını (root, `aw-qt`, `aw-server`, `aw-watcher-afk`) gözden geçirin ve güncelleyin.
        *   Ana `LICENSE.txt` dosyasını en doğru bilgiyi içerecek şekilde düzenleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `LICENSE.txt` (root)
        *   `aw-qt/LICENSE.txt`
        *   `aw-server/LICENSE.txt`
        *   `aw-watcher-afk/LICENSE.txt`

43. **README Dosyalarının Detaylandırılması**
    *   **Sorun:** Projenin veya modüllerin `README.md` dosyaları eksik, eski veya yeterli bilgi içermiyor.
    *   **Çözüm:** Tüm `README.md` dosyaları güncel, detaylı kurulum talimatları, kullanım örnekleri, katkı kılavuzları ve proje mimarisi hakkında bilgi içermeli.
    *   **Implementasyon:**
        *   Root `README.md` dosyasını baştan sona gözden geçirin ve eksik bilgileri ekleyin.
        *   Her bir alt modülün (`aw-server`, `aw-qt`, `aw-notify` vb.) `README.md` dosyalarını güncelleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Root `README.md`
        *   `aw-server/README.md`
        *   `aw-qt/README.md`
        *   `aw-notify/README.md`
        *   `aw-watcher-afk/README.md`
        *   `aw-watcher-input/README.md`
        *   `aw-watcher-window/README.md`

44. **Katkıda Bulunma Kılavuzunun (CONTRIBUTING.md) Oluşturulması/Güncellenmesi**
    *   **Sorun:** Projeye katkıda bulunmak isteyen geliştiriciler için açık ve güncel bir kılavuz yok.
    *   **Çözüm:** `CONTRIBUTING.md` dosyası oluşturulmalı veya güncellenmeli. Bu kılavuz, kodlama standartları, test yazım kuralları, pull request gönderme süreci ve yerel ortam kurulumu hakkında bilgi içermeli.
    *   **Implementasyon:**
        *   `CONTRIBUTING.md` dosyasını oluşturun/güncelleyin ve yukarıdaki maddeleri dahil edin.
        *   Lint ve test kurallarına referanslar ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `CONTRIBUTING.md` (root)

45. **Gizlilik Politikası (PRIVACY.md) ve Veri Kullanımının Belgelenmesi**
    *   **Sorun:** Uygulamanın topladığı veriler, bu verilerin nasıl kullanıldığı ve gizlilik politikası hakkında açık bir belgelendirme yok.
    *   **Çözüm:** `PRIVACY.md` dosyası oluşturulmalı veya güncellenmeli. Bu belge, GDPR, CCPA gibi düzenlemelere uygun şekilde, kullanıcı verilerinin toplanması, işlenmesi, saklanması ve paylaşılması hakkında şeffaf bilgi içermeli.
    *   **Implementasyon:**
        *   `PRIVACY.md` dosyasını oluşturun/güncelleyin.
        *   `docs/user-privacy-guide.md`: Kullanıcı gizliliği ile ilgili detaylı teknik bilgileri buraya ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `PRIVACY.md` (root)
        *   `docs/user-privacy-guide.md`

46. **Kod Dizini Yapısının Tutarlılığı**
    *   **Sorun:** Projenin farklı modülleri veya alt projeleri arasında tutarlı bir dizin yapısı yok.
    *   **Çözüm:** Proje genelinde (örneğin `src/`, `tests/`, `docs/`, `scripts/`, `config/`) tutarlı ve mantıklı bir dizin yapısı uygulanmalı.
    *   **Implementasyon:**
        *   Gerektiğinde dizinleri yeniden düzenleyin (örneğin `aw-server/aw_server/` içindeki modülleri daha mantıklı alt dizinlere ayırın).
        *   Dosya gezgini çıktısını inceleyerek anlamsız veya tutarsız dizin yapılarını tespit edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Tüm proje dizinleri ve dosyaları

47. **`py.typed` Dosyalarının Kontrolü (Type Hinting)**
    *   **Sorun:** Python modüllerinde type hinting kullanılıyor olsa bile, `py.typed` dosyaları eksik veya yanlış konumlandırılmış.
    *   **Çözüm:** Her bir Python modülünün type hint'lerinin doğru bir şekilde kontrol edilmesi için `py.typed` dosyaları ilgili dizinlere yerleştirilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/py.typed`: Bu dosyanın doğru konumda olduğundan ve içeriğinin (genellikle boş) doğru olduğundan emin olun.
        *   Diğer modüllerde de (eğer type hinting yoğun kullanılıyorsa) `py.typed` dosyası ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/py.typed`
        *   Diğer Python modüllerinin ana dizinleri

48. **`__about__.py` Dosyalarının Amacı ve Kullanımı**
    *   **Sorun:** `__about__.py` gibi dosyaların amacı ve içerdiği bilgilerin (versiyon, yazar, lisans) diğer yerlerdeki bilgilerle tutarsızlığı.
    *   **Çözüm:** `__about__.py` dosyaları sadece modül hakkında meta bilgileri içermeli ve bu bilgiler `pyproject.toml` veya diğer merkezi yapılandırma dosyalarıyla senkronize edilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/__about__.py`: Bu dosyanın içeriğini kontrol edin ve gereksiz bilgileri kaldırın, ilgili diğer dosyalarla tutarlılığı sağlayın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/__about__.py`
        *   `aw-server/pyproject.toml`
        *   `version.md`

49. **Log Dosyalarının Rotasyonu ve Boyut Yönetimi**
    *   **Sorun:** Uygulama log dosyaları sınırsız büyüyerek disk alanı tüketimine neden oluyor ve log analizi zorlaşıyor.
    *   **Çözüm:** Log dosyaları için rotasyon (günlük/haftalık/boyut bazlı) ve eski logların otomatik silinmesi veya arşivlenmesi politikaları uygulanmalı. `logrotate` veya Python'un kendi loglama modülündeki rotasyon handler'ları kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/log.py`: `RotatingFileHandler` veya `TimedRotatingFileHandler` gibi handler'ları yapılandırın.
        *   Sistem düzeyinde (Linux) `logrotate` yapılandırması ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/log.py`
        *   Sistem yapılandırma dosyaları

50. **Proje Analiz Raporlarının Güncellenmesi**
    *   **Sorun:** `PROJECT_ANALYSIS_REPORT.md` gibi analiz raporları güncel değil veya projenin mevcut durumu hakkında yeterli bilgi sağlamıyor.
    *   **Çözüm:** Proje analiz raporları düzenli olarak güncellenmeli ve projenin teknik borcu, kalite metrikleri, performans darboğazları ve gelecekteki yol haritası hakkında kapsamlı bilgi içermeli.
    *   **Implementasyon:**
        *   `PROJECT_ANALYSIS_REPORT.md`: Bu dosyayı projenin mevcut durumu, yapılan iyileştirmeler ve kalan sorunlar hakkında güncel bilgilerle doldurun.
        *   Periyodik olarak otomatik analiz araçları (SonarQube) entegre edilirse, rapor bu araçlardan beslenebilir.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `PROJECT_ANALYSIS_REPORT.md`
        *   `problems.md`, `problems2.md`, `problems3.md`, `problems4.md`, `problems5.md`

---

### 51-100: API, Güvenlik, Yetkilendirme, Entegrasyon ve Performans

51.  **API Endpoint’lerinde Standart Yanıt Formatı Kullanımı**
    *   **Sorun:** API yanıtlarının farklı formatlarda veya tutarsız yapıda olması, frontend ve diğer entegrasyonların veriyi işlemesini zorlaştırıyor.
    *   **Çözüm:** Tüm API yanıtları için tek tip, standart bir JSON formatı kullanılmalı (örn: `{"success": true, "data": {}, "error": null}` veya `{"status": "success/error", "message": "...", "data": {...}}`). Bu, istemci tarafındaki kodun daha öngörülebilir olmasını sağlar.
    *   **Implementasyon:**
        *   `aw-server/aw_server/api.py`: Tüm API endpoint'lerinin yanıtlarını, ortak bir `ApiResponse` veya benzeri bir yardımcı sınıf/fonksiyon aracılığıyla standardize edin.
        *   `functions/src/api/`: Firebase Functions API endpoint'leri için de benzer bir yapı (örneğin `api-response-formats.ts` içinde tanımlı bir format) kullanın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/rest.py`
        *   `functions/src/api/`
        *   `functions/src/utils/api-response-formats.ts` (oluşturulabilir veya mevcutsa iyileştirilebilir)

52.  **Ortak Hata Yönetimi ve İstisna İşleme Mekanizmaları**
    *   **Sorun:** Uygulamanın farklı katmanlarında (API, servisler, veritabanı) tutarsız hata yönetimi, hataların izlenmesini ve düzeltilmesini zorlaştırıyor.
    *   **Çözüm:** Uygulama genelinde merkezi bir hata işleme mekanizması (örneğin, custom istisna sınıfları ve merkezi bir hata yakalayıcı/middleware) oluşturulmalı. Her hata tipi için standart hata kodları ve mesajları tanımlanmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/exceptions.py`: Özel istisna sınıflarını tanımlayın (örneğin `ResourceNotFound`, `UnauthorizedError`).
        *   `aw-server/aw_server/rest.py`: `try-except` blokları ile bu istisnaları yakalayarak standart hata yanıtları döndürün.
        *   `functions/src/middlewares/errorHandler.ts`: Firebase Functions için merkezi bir hata işleme middleware'i oluşturun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/exceptions.py`
        *   `aw-server/aw_server/rest.py`
        *   `functions/src/middlewares/errorHandler.ts`
        *   `functions/src/utils/api-error-codes.ts`

53.  **Performans İzleme ve Optimizasyon Araçlarının Entegrasyonu**
    *   **Sorun:** Uygulamanın performans metrikleri (yanıt süreleri, bellek kullanımı, CPU kullanımı) yeterince izlenmiyor veya optimize edilmiyor.
    *   **Çözüm:** Prometheus, Grafana, Datadog gibi izleme araçları entegre edilerek uygulamanın performans metrikleri sürekli takip edilmeli ve darboğazlar tespit edilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/server.py`: Flask uygulamasında Prometheus veya benzeri bir kütüphane ile metrikleri expose edin.
        *   `apphosting.emulator.yaml`: Cloud ortamında izleme servislerinin yapılandırmasını ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/server.py`
        *   `apphosting.emulator.yaml`
        *   Proje genelindeki bağımlılık dosyaları (`pyproject.toml`, `requirements.txt`)

54.  **Veritabanı Sorgularının Optimizasyonu ve İndeksleme**
    *   **Sorun:** Yavaş veritabanı sorguları, uygulamanın genel performansını düşürüyor ve kullanıcı deneyimini olumsuz etkiliyor.
    *   **Çözüm:** Sık kullanılan sorguların `EXPLAIN ANALYZE` ile analizi yapılmalı, uygun indeksler oluşturulmalı ve karmaşık sorgular basitleştirilmeli. Gerektiğinde ORM yerine raw SQL kullanılabilir.
    *   **Implementasyon:**
        *   `aw_datastore/storages/peewee.py`: Peewee ORM kullanılırken sorguların optimize edildiğinden emin olun. Büyük veri kümeleri için `paginate` veya `stream` seçeneklerini değerlendirin.
        *   `aw-server/aw_server/firebase_datastore/firestore.py`: Firestore sorgularında indekslerin doğru kullanıldığından ve gereksiz okumalardan kaçınıldığından emin olun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw_datastore/storages/peewee.py`
        *   `aw-server/aw_server/firebase_datastore/firestore.py`
        *   Veritabanı şema tanımları (varsa)

55.  **Önbellekleme (Caching) Stratejilerinin Uygulanması**
    *   **Sorun:** Sık erişilen ama nadiren değişen veriler için önbellekleme kullanılmaması, veritabanı yükünü artırıyor ve yanıt sürelerini uzatıyor.
    *   **Çözüm:** Redis, Memcached gibi in-memory cache çözümleri veya CDN (Content Delivery Network) ile statik içerikler için önbellekleme stratejileri uygulanmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/api.py`: Sık çağrılan API endpoint'leri için `@cache` decorator'ları veya elle cache mekanizmaları ekleyin.
        *   `aw-server/pyproject.toml`: `cachetools` veya benzeri bir Python önbellekleme kütüphanesi ekleyin (zaten mevcut olabilir).
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/api.py`
        *   `aw-server/pyproject.toml`

56.  **Kimlik Doğrulama (Authentication) Mekanizmasının Güçlendirilmesi**
    *   **Sorun:** Zayıf kimlik doğrulama yöntemleri (örneğin, sadece parola), hesap güvenliğini riske atıyor.
    *   **Çözüm:** İki Faktörlü Kimlik Doğrulama (2FA), sosyal medya ile giriş, WebAuthn (FIDO2) gibi güçlü kimlik doğrulama yöntemleri entegre edilmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/auth/AuthService.ts`: Frontend'de WebAuthn entegrasyonu için gerekli kodları yazın.
        *   `functions/src/api/auth-api.ts`: Firebase Authentication veya Custom Authentication için gerekli backend API'lerini geliştirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/auth/AuthService.ts`
        *   `functions/src/api/auth-api.ts`
        *   `functions/src/middlewares/requireAuth.ts`
        *   `aw-webui/src/types/webauthn.d.ts`

57.  **Yetkilendirme (Authorization) Rol ve İzin Yönetimi**
    *   **Sorun:** Uygulama içindeki kullanıcıların farklı kaynaklara (veri, özellikler, API endpoint'leri) erişim izinleri yeterince granüler değil veya merkezi olarak yönetilmiyor.
    *   **Çözüm:** Rol tabanlı erişim kontrolü (RBAC) veya nitelik tabanlı erişim kontrolü (ABAC) ile yetkilendirme mekanizması geliştirilmeli. Kullanıcı rolleri ve bu rollere atanmış izinler merkezi bir yerde yönetilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/api.py`: API endpoint'lerinde `@permission_required` veya benzeri decorator'lar ile erişim kontrolü uygulayın.
        *   `functions/src/security/firestore.ts`: Firestore güvenlik kurallarında rol tabanlı okuma/yazma izinleri tanımlayın.
        *   `functions/src/triggers/auth-triggers.ts` (oluşturulabilir): Kullanıcı kaydolduğunda veya rolü değiştiğinde Firestore'da custom claim veya rollerini güncelleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/api.py`
        *   `functions/src/security/firestore.ts`
        *   `functions/src/middlewares/requireAuth.ts` (mevcutsa genişletilebilir)

58.  **Veri Şifreleme ve Hassas Veri Koruma**
    *   **Sorun:** Hassas kullanıcı verileri (parolalar, kişisel bilgiler) şifrelenmeden saklanıyor veya iletilmiyor.
    *   **Çözüm:** Veritabanında ve iletim sırasında (HTTPS) tüm hassas veriler şifrelenmeli. Şifreleme algoritmaları ve anahtar yönetimi güvenli bir şekilde yapılmalı.
    *   **Implementasyon:**
        *   `functions/src/services/encryption/`: Bu dizin altındaki servisleri kullanarak (örneğin `EncryptionService.ts`, `KeyDerivationService.ts`) uçtan uca şifreleme ve anahtar türetme işlemlerini uygulayın.
        *   `aw-server/aw_server/encryption/`: Backend'de benzer şifreleme mekanizmaları entegre edin.
        *   `docs/adr/ADR-002-encryption-architecture.md`: Şifreleme mimarisini detaylıca dokümante edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `functions/src/services/encryption/`
        *   `aw-server/aw_server/encryption/`
        *   `docs/adr/ADR-002-encryption-architecture.md`
        *   `docs/key-management-guide.md`
        *   `docs/security-implementation-guide.md`

59.  **Girdi Doğrulama (Input Validation) ve XSS/CSRF Koruması**
    *   **Sorun:** Kullanıcı girdileri yeterince doğrulanmıyor ve bu durum XSS (Cross-Site Scripting) ve CSRF (Cross-Site Request Forgery) gibi güvenlik açıklarına yol açıyor.
    *   **Çözüm:** Tüm kullanıcı girdileri (formlar, URL parametreleri, JSON payload'lar) hem frontend hem de backend tarafında kapsamlı bir şekilde doğrulanmalı ve temizlenmeli. Güvenlik başlıkları (Content-Security-Policy, X-XSS-Protection) kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/rest.py`: Flask-WTF veya benzeri bir form doğrulama kütüphanesi kullanarak backend'de girdi doğrulaması yapın.
        *   `aw-webui/src/util/`: Frontend'de girdileri temizlemek için yardımcı fonksiyonlar ekleyin (örneğin HTML sanitize).
        *   Web sunucusu veya Flask uygulaması üzerinden güvenlik başlıklarını yapılandırın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/rest.py`
        *   `aw-webui/src/util/`
        *   Web sunucusu (Nginx/Apache) veya `aw-server/aw_server/server.py`

60.  **Güvenlik Açığı Taraması ve Penetrasyon Testleri**
    *   **Sorun:** Bilinen güvenlik açıkları (OWASP Top 10) ve diğer zafiyetler düzenli olarak taranmıyor.
    *   **Çözüm:** Otomatik güvenlik açığı tarayıcıları (SAST/DAST araçları) CI/CD pipeline'ına entegre edilmeli. Periyodik penetrasyon testleri ve güvenlik denetimleri yapılmalı.
    *   **Implementasyon:**
        *   CI/CD (`.github/workflows/` veya benzeri): Güvenlik tarama adımlarını ekleyin (örneğin Bandit for Python, OWASP Dependency-Check).
        *   `SECURITY.md`: Güvenlik politikalarını ve raporlama süreçlerini güncelleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   CI/CD yapılandırma dosyaları
        *   `SECURITY.md`

61.  **Günlük Kaydı (Logging) ve İzlenebilirlik (Observability)**
    *   **Sorun:** Uygulama logları yeterince detaylı değil, merkezi olarak toplanmıyor veya kolayca sorgulanamıyor.
    *   **Çözüm:** Loglama seviyeleri (DEBUG, INFO, WARNING, ERROR) doğru kullanılmalı. Loglar yapılandırılmış formatta (JSON) merkezi bir log yönetim sistemine (ELK Stack, Grafana Loki) gönderilmeli. İzleme için trace ID'leri kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/log.py`: Loglama yapılandırmasını iyileştirin.
        *   `functions/src/index.ts`: Firebase Functions'ta logları daha detaylı ve yapılandırılmış şekilde yazın.
        *   Her istek için benzersiz bir trace ID oluşturup loglara ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/log.py`
        *   `functions/src/index.ts`
        *   `problems.md` (loglama sorunları belirtilmiş olabilir)

62.  **API Sürümleme (Versioning) Stratejisi**
    *   **Sorun:** API'de yapılan değişiklikler geriye dönük uyumluluğu bozuyor ve entegre olan diğer sistemlerde sorunlara yol açıyor.
    *   **Çözüm:** API için açık bir sürümleme stratejisi (URL sürümleme, header sürümleme) belirlenmeli ve her değişiklik bu stratejiye uygun yapılmalı. Eski sürümlerin desteği belirli bir süre sağlanmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/api.py`: `v1/`, `v2/` gibi URL önekleri ile sürümleme uygulayın.
        *   `aw-webui/src/awclient.ts`: API çağrılarında doğru sürümü kullandığından emin olun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/api.py`
        *   `aw-webui/src/awclient.ts`

63.  **Hizmet Kalitesi (QoS) ve Rate Limiting**
    *   **Sorun:** API endpoint'leri aşırı yüklenmeye karşı savunmasız ve kötü niyetli kullanımlara açık.
    *   **Çözüm:** API Gateway veya backend tarafında Rate Limiting (istek sınırı) ve Throttling (bant genişliği yönetimi) uygulanmalı. Özellikle hassas endpoint'ler için bu kontroller güçlendirilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/server.py`: Flask uygulamasına `Flask-Limiter` veya benzeri bir kütüphane entegre edin.
        *   Firebase Functions için Google Cloud API Gateway veya özel bir rate limiting mekanizması kullanın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/server.py`
        *   Firebase projesi yapılandırması (`firebase.json`, `apphosting.emulator.yaml`)

64.  **Veritabanı Bağlantı Havuzu (Connection Pooling)**
    *   **Sorun:** Her istek için yeni veritabanı bağlantısı açmak, performans overhead'ine ve kaynak tükenmesine yol açıyor.
    *   **Çözüm:** Veritabanı bağlantı havuzu (connection pooling) kullanılmalı. Bu, mevcut bağlantıların yeniden kullanılmasını sağlayarak performans artışı ve kaynak verimliliği sağlar.
    *   **Implementasyon:**
        *   `aw_datastore/storages/peewee.py`: Peewee ile bağlantı havuzu yapılandırmasını etkinleştirin veya kontrol edin.
        *   `aw-server/aw_server/firebase_datastore/firestore.py`: Firestore için bağlantı yönetimi Firebase SDK tarafından yapıldığı için ek bir işlem gerekmeyebilir, ancak doğru yapılandırıldığından emin olun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw_datastore/storages/peewee.py`
        *   `aw-server/aw_server/firebase_datastore/firestore.py`

65.  **Dış Bağımlılıkların ve Kütüphanelerin Güncel Tutulması**
    *   **Sorun:** Eski veya güncel olmayan bağımlılıklar, güvenlik açıkları, performans sorunları ve uyumluluk problemleri yaratır.
    *   **Çözüm:** Tüm proje bağımlılıkları (Python, Node.js, Rust vb.) düzenli olarak güncellenmeli. Otomatik bağımlılık güncelleme araçları (Dependabot, Renovate) kullanılabilir.
    *   **Implementasyon:**
        *   `pyproject.toml`, `requirements.txt`, `poetry.lock`, `Cargo.toml`, `package.json` (aw-webui için) dosyalarını düzenli olarak kontrol edin ve güncelleyin.
        *   CI/CD (`.github/workflows/` veya benzeri): Bağımlılık güncelleme kontrollerini ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `pyproject.toml` (birçok modül için)
        *   `requirements.txt` (aw-server için)
        *   `poetry.lock` (birçok modül için)
        *   `aw-webui/package.json`
        *   `functions/package.json`
        *   `aw-qt/src-tauri/Cargo.toml`

66.  **Uygulama İçi Arama Fonksiyonlarının İyileştirilmesi**
    *   **Sorun:** Uygulama içinde (örneğin etkinlik geçmişi, kategori arama) arama fonksiyonları yavaş veya yetersiz sonuçlar veriyor.
    *   **Çözüm:** Elasticsearch, Apache Solr gibi tam metin arama motorları entegre edilmeli veya mevcut veritabanı (PostgreSQL) için full-text search özellikleri optimize edilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/api.py`: Arama endpoint'lerini optimize edin.
        *   Yeni bir arama servisi entegre edilecekse, `aw-server/` altına bir modül eklenebilir.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/api.py`
        *   `aw_datastore/` (veritabanı entegrasyonu için)

67.  **Zaman Damgası (Timestamp) Tutarlılığı**
    *   **Sorun:** Farklı modüller veya servisler arasında zaman damgalarının (timestamp) formatı veya zaman dilimi (timezone) tutarsız.
    *   **Çözüm:** Tüm zaman damgaları için ISO 8601 formatı ve UTC (Coordinated Universal Time) kullanılmalı. Tarih-saat dönüşümleri merkezi bir yardımcı fonksiyonla yapılmalı.
    *   **Implementasyon:**
        *   `aw-core/`: Ortak bir zaman damgası işleme yardımcı modülü oluşturun veya mevcutsa iyileştirin.
        *   `aw-server/aw_server/api.py`: Gelen/giden tüm zaman damgalarını standardize edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-core/` (varsa)
        *   `aw-server/aw_server/api.py`
        *   `functions/src/types/activity-event.d.ts` (timestamp alanları)

68.  **API Güvenliği İçin HTTPS Zorunluluğu**
    *   **Sorun:** API trafiği HTTP üzerinden yapılıyor ve hassas veriler açık metin olarak iletiliyor.
    *   **Çözüm:** Tüm API iletişimleri için HTTPS zorunlu kılınmalı. Geliştirme ortamında bile HTTPS kullanımı teşvik edilmeli (self-signed sertifikalarla).
    *   **Implementasyon:**
        *   Web sunucusu yapılandırması (Nginx, Apache veya Flask'ın kendisi üzerinde) HTTPS'i zorunlu kılın.
        *   Firebase Functions zaten HTTPS kullanır, ancak diğer backend servisleri için bu kontrol edilmeli.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/server.py` (web sunucusu entegrasyonu)
        *   `apphosting.emulator.yaml` (Firebase App Hosting yapılandırması)

69.  **Çerez (Cookie) Güvenliği ve Oturum Yönetimi**
    *   **Sorun:** Oturum çerezleri güvensiz ayarlar (örneğin `HttpOnly` veya `Secure` bayrağı olmadan) kullanılıyor veya oturum yönetimi zayıf.
    *   **Çözüm:** Oturum çerezleri için `HttpOnly`, `Secure`, `SameSite` bayrakları kullanılmalı. Oturum sonlandırma, yenileme ve saldırı tespiti mekanizmaları güçlendirilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/server.py`: Flask oturum yapılandırmasını güvenli hale getirin.
        *   Frontend'de (Vue.js) çerezlerin doğru şekilde kullanıldığından emin olun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/server.py`
        *   `aw-webui/src/auth/AuthService.ts` (oturumu yöneten kısım)

70.  **DDoS ve Brute Force Saldırılarına Karşı Koruma**
    *   **Sorun:** Uygulama, dağıtılmış hizmet reddi (DDoS) ve kaba kuvvet (brute force) saldırılarına karşı yetersiz korumaya sahip.
    *   **Çözüm:** WAF (Web Application Firewall), CDN tabanlı korumalar, IP bloklama, CAPTCHA ve kademeli kimlik doğrulama denemeleri gibi önlemler alınmalı.
    *   **Implementasyon:**
        *   Cloudflare, AWS WAF gibi servislerle entegrasyonu araştırın ve uygulayın.
        *   Giriş ekranında başarısız deneme limitleri ve gecikmeler uygulayın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/rest.py` (giriş endpoint'i)
        *   Cloud sağlayıcı yapılandırmaları

71.  **Hassas Dosya Erişimi Kontrolü**
    *   **Sorun:** Konfigürasyon dosyaları, özel anahtarlar veya diğer hassas dosyalar yanlış izinlerle veya herkese açık dizinlerde saklanıyor.
    *   **Çözüm:** Hassas dosyalar, uygulama kök dizininin dışında, sadece yetkili kullanıcıların ve sürecin erişebileceği güvenli yerlerde saklanmalı. Dosya izinleri (`chmod`) doğru ayarlanmalı.
    *   **Implementasyon:**
        *   `apphosting.emulator.yaml`: Hassas dosyaların deployment sırasında yanlış yere kopyalanmadığından emin olun.
        *   `Makefile` veya `scripts/`: Dosya izinlerini ayarlayan adımlar ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `apphosting.emulator.yaml`
        *   `Makefile` (genel)
        *   `scripts/` altındaki deployment scriptleri

72.  **API Gateway Kullanımı ve Mikroservis İletişimi**
    *   **Sorun:** Mikroservisler arasında doğrudan iletişim veya merkezi olmayan API yönetimi, karmaşıklığı artırıyor ve güvenlik/izleme eksiklikleri yaratıyor.
    *   **Çözüm:** Bir API Gateway (örneğin Kong, Ocelot, AWS API Gateway, GCP API Gateway) kullanılarak tüm harici istekler tek bir noktadan yönlendirilmeli. Gateway üzerinde yetkilendirme, rate limiting, logging gibi katmanlar uygulanmalı.
    *   **Implementasyon:**
        *   Eğer mikroservis mimarisine geçilecekse, API Gateway seçimi ve entegrasyonu yapılmalı.
        *   `apphosting.emulator.yaml`: Firebase App Hosting, bir tür API Gateway işlevi görür, mevcut yapılandırmayı bu açıdan optimize edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `apphosting.emulator.yaml`
        *   Firebase projesi yapılandırması

73.  **Veritabanı Şifreleme ve Veri Maskeleme**
    *   **Sorun:** Hassas veriler veritabanında şifrelenmemiş olarak tutuluyor ve gelişim/test ortamlarında gerçek veriler kullanılıyor.
    *   **Çözüm:** Veritabanı düzeyinde (at-rest) şifreleme uygulanmalı. Geliştirme ve test ortamları için gerçek verilere benzeyen ancak hassas olmayan maskelenmiş veya sentetik veriler kullanılmalı.
    *   **Implementasyon:**
        *   PostgreSQL/MySQL için TDE (Transparent Data Encryption) veya uygulama katmanında şifreleme (`functions/src/services/encryption/`) uygulayın.
        *   `aw-server/aw_server/data_anonymization/anonymizer.py`: Mevcut anonimleştirme aracını genişleterek veri maskeleme yetenekleri ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `functions/src/services/encryption/`
        *   `aw-server/aw_server/data_anonymization/anonymizer.py`
        *   Veritabanı yapılandırmaları

74.  **Güvenli Konfigürasyon Yönetimi (Secret Management)**
    *   **Sorun:** API anahtarları, veritabanı kimlik bilgileri gibi hassas konfigürasyonlar kod içinde, versiyon kontrolünde veya güvensiz ortamlarda saklanıyor.
    *   **Çözüm:** Hassas konfigürasyonlar için güvenli bir Secret Management çözümü (örneğin AWS Secrets Manager, Google Secret Manager, HashiCorp Vault) kullanılmalı. Ortam değişkenleri veya güvenli dosya sistemleri tercih edilmeli.
    *   **Implementasyon:**
        *   `.env` dosyalarını `.gitignore`'a ekleyin ve ortam değişkenleri kullanın.
        *   `apphosting.emulator.yaml`: Çevresel değişkenlerin güvenli bir şekilde yüklendiğinden emin olun.
        *   `config.py` (aw-server, aw-qt): Hassas olmayan konfigürasyonları buradan yönetin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `.gitignore`
        *   `apphosting.emulator.yaml`
        *   `aw-server/aw_server/config.py`
        *   `aw-qt/aw_qt/config.py`

75.  **Veritabanı Yedekleme ve Geri Yükleme Politikası**
    *   **Sorun:** Veri kaybı riskine karşı düzenli veritabanı yedeklemeleri yapılmıyor veya geri yükleme süreçleri test edilmiyor.
    *   **Çözüm:** Otomatik ve düzenli veritabanı yedeklemeleri (full, incremental) yapılmalı. Yedekler farklı lokasyonlarda saklanmalı ve geri yükleme süreçleri periyodik olarak test edilmeli.
    *   **Implementasyon:**
        *   Cloud sağlayıcıların (Firebase Firestore, PostgreSQL) yedekleme özelliklerini yapılandırın.
        *   `scripts/` altına yedekleme ve geri yükleme için otomasyon scriptleri ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Cloud sağlayıcı konsol ve yapılandırmaları
        *   `scripts/` (yeni scriptler)

76.  **Uygulama Hata Bildirim Sistemleri**
    *   **Sorun:** Uygulama hataları sadece loglarda kalıyor ve proaktif olarak ilgili ekiplere bildirilmiyor.
    *   **Çözüm:** Sentry, New Relic, Rollbar gibi hata bildirim sistemleri entegre edilmeli. Kritik hatalarda (5xx HTTP kodları, uncaught exceptions) Slack, E-posta veya SMS ile anında bildirimler gönderilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/server.py`: Flask uygulamasında hata bildirim entegrasyonu yapın.
        *   `functions/src/middlewares/errorHandler.ts`: Firebase Functions hatalarını bu sistemlere gönderin.
        *   `aw-notify/aw_notify/main.py`: Mevcut bildirim sistemini genişleterek kritik hataları iletin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/server.py`
        *   `functions/src/middlewares/errorHandler.ts`
        *   `aw-notify/aw_notify/main.py`

77.  **Yüksek Erişilebilirlik (High Availability) ve Yük Dengeleme (Load Balancing)**
    *   **Sorun:** Uygulama tek bir hata noktasına (single point of failure) sahip ve yüksek trafik altında performans sorunları yaşıyor.
    *   **Çözüm:** Uygulama bileşenleri (web sunucuları, veritabanları, arka plan servisleri) birden fazla sunucuya dağıtılarak yük dengeleme (Load Balancer) ile yüksek erişilebilirlik sağlanmalı.
    *   **Implementasyon:**
        *   Firebase App Hosting ve Functions, bu tür yetenekleri otomatik olarak sunar, ancak yapılandırma (örneğin region seçimi) optimize edilmeli.
        *   Backend servisleri için (eğer ayrık sunucularda çalışacaksa) Nginx gibi bir yük dengeleyici yapılandırılmalı.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `apphosting.emulator.yaml`
        *   Cloud sağlayıcı altyapı yapılandırmaları

78.  **Veri Senkronizasyonu ve Çakışma Yönetimi**
    *   **Sorun:** Çevrimdışı yetenekler veya birden fazla istemci aynı veriyi güncellediğinde veri senkronizasyon sorunları ve çakışmalar meydana geliyor.
    *   **Çözüm:** Optimistic Locking, Last-Write-Wins veya CRDT (Conflict-free Replicated Data Types) gibi çakışma çözüm stratejileri uygulanmalı. Veri senkronizasyonu için belirlenmiş bir protokol kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/sync.py`: Senkronizasyon mantığını çakışma çözümlerini içerecek şekilde geliştirin.
        *   `aw-webui/src/stores/activity.ts`: Frontend tarafında senkronizasyon durumunu ve çakışmaları ele alın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/sync.py`
        *   `aw-webui/src/stores/activity.ts`
        *   `aw-server/aw_server/api.py` (senkronizasyon API'leri)

79.  **Uygulama İçi Bildirim Sistemleri**
    *   **Sorun:** Kullanıcılar için önemli olaylar (yeni özellik, hata, önemli duyurular) uygulama içinde yeterince bildirilmiyor.
    *   **Çözüm:** Uygulama içi bildirim sistemi (in-app notifications) entegre edilmeli. Kullanıcıya özel ve bağlamsal bildirimler sunulmalı (toast mesajları, bildirim merkezi).
    *   **Implementasyon:**
        *   `aw-webui/src/components/NotificationDisplay.vue` (veya benzeri): Bildirimleri göstermek için bir Vue bileşeni geliştirin.
        *   `aw-notify/aw_notify/main.py`: Backend'den push bildirimlerini veya web soketleri aracılığıyla gerçek zamanlı bildirimleri tetikleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/NotificationDisplay.vue` (yeni veya mevcutsa)
        *   `aw-notify/aw_notify/main.py`
        *   `aw-server/aw_server/api.py` (bildirim API'leri)

80.  **Webhook Desteği ve Harici Sistem Entegrasyonları**
    *   **Sorun:** Uygulamanın diğer sistemlerle olay tabanlı entegrasyonu için esnek bir mekanizma yok.
    *   **Çözüm:** Önemli olaylar (yeni etkinlik, kullanıcı kaydı) için webhook desteği sağlanmalı. Bu, üçüncü taraf uygulamaların ActiveWatch'tan gerçek zamanlı veri almasını sağlar.
    *   **Implementasyon:**
        *   `aw-server/aw_server/api.py`: Webhook kaydı ve tetikleme için yeni API endpoint'leri oluşturun.
        *   Olay dinleyicileri (event listeners) ve tetikleyicileri (triggers) geliştirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/api.py`
        *   `functions/src/triggers/` (Firebase Functions tetikleyicileri)

81.  **Gelişmiş Raporlama ve Analitik Panelleri**
    *   **Sorun:** Kullanıcıların etkinlik verilerini anlamlı bir şekilde görselleştirmesi ve analiz etmesi için yeterli raporlama aracı yok.
    *   **Çözüm:** Kullanıcılara özelleştirilebilir raporlar ve analitik panelleri sunulmalı. Veriler grafikler, tablolar ve KPI'lar (Anahtar Performans Göstergeleri) ile sunulmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/visualizations/`: Yeni görselleştirme bileşenleri geliştirin (örneğin gelişmiş istatistiksel grafikler).
        *   `aw-server/aw_server/api.py`: Raporlama için optimize edilmiş API endpoint'leri (toplamalar, gruplamalar) oluşturun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/visualizations/`
        *   `aw-server/aw_server/api.py`
        *   `aw-webui/src/queries.ts` (veri sorguları)

82.  **Uygulama Metrikleri ve Telemetri**
    *   **Sorun:** Uygulamanın kullanımı, kullanıcı davranışları ve özelliklerin benimsenme oranları hakkında yeterli veri toplanmıyor.
    *   **Çözüm:** Uygulama telemetri (kullanım metrikleri) toplanmalı ve analiz edilmeli (Google Analytics, Mixpanel, Segment). Bu veriler ürün geliştirme kararları için kullanılmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/main.js`: Frontend'de analitik SDK'larını entegre edin.
        *   `aw-server/aw_server/server.py`: Backend'de sunucu metriklerini toplayın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/main.js`
        *   `aw-server/aw_server/server.py`

83.  **Performans Testleri ve Yük Testleri**
    *   **Sorun:** Uygulama, yüksek trafik ve eşzamanlı kullanıcı yükleri altında nasıl performans göstereceği bilinmiyor.
    *   **Çözüm:** JMeter, k6, Locust gibi araçlarla düzenli performans ve yük testleri yapılmalı. Darboğazlar tespit edilip giderilmeli.
    *   **Implementasyon:**
        *   `aw-server/scripts/benchmark-api-heartbeat.py`: Mevcut benchmark scriptlerini genişletin.
        *   CI/CD pipeline'ına yük testleri ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/scripts/benchmark-api-heartbeat.py`
        *   CI/CD yapılandırma dosyaları

84.  **Uygulama İzleme ve Uyarı Sistemleri (Monitoring & Alerting)**
    *   **Sorun:** Uygulama üretimde çalışırken hatalar, performans düşüşleri veya anormal davranışlar anında tespit edilip bildirilmiyor.
    *   **Çözüm:** Prometheus, Grafana, ELK Stack gibi izleme araçları entegre edilmeli. Belirlenen eşik değerler aşıldığında (örneğin CPU kullanımı, hata oranı) ilgili ekiplere otomatik uyarılar gönderilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/log.py`: Metrikleri ve logları izleme sistemlerine gönderecek şekilde yapılandırın.
        *   Cloud sağlayıcıların izleme ve uyarı servislerini (Cloud Monitoring, Alerting) kullanın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/log.py`
        *   Cloud sağlayıcı yapılandırmaları

85.  **Otomatik Ölçeklendirme (Auto-Scaling) Konfigürasyonları**
    *   **Sorun:** Uygulama, ani trafik artışlarına veya azalışlarına otomatik olarak uyum sağlayamıyor.
    *   **Çözüm:** Cloud ortamında (Firebase App Hosting, Google Cloud Run, Kubernetes) otomatik ölçeklendirme kuralları (CPU kullanımı, istek sayısı bazlı) yapılandırılmalı.
    *   **Implementasyon:**
        *   `apphosting.emulator.yaml`: Otomatik ölçeklendirme ayarlarını inceleyin ve optimize edin.
        *   Cloud Run servisleri için `min-instances`, `max-instances` gibi ayarlar.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `apphosting.emulator.yaml`
        *   Cloud sağlayıcı yapılandırmaları

86.  **Uygulama Güncelleme ve Sürüm Yönetimi (Rolling Updates)**
    *   **Sorun:** Uygulama güncellemeleri sırasında kesinti yaşanıyor veya eski/yeni sürümler arasında uyumsuzluklar oluşuyor.
    *   **Çözüm:** Kesintisiz dağıtım için Rolling Updates, Blue/Green Deployment veya Canary Releases gibi stratejiler uygulanmalı. Veritabanı şema değişiklikleri için geriye dönük uyumluluk sağlanmalı.
    *   **Implementasyon:**
        *   CI/CD pipeline'ında bu dağıtım stratejilerini destekleyecek adımlar ekleyin.
        *   `version.md`: Sürüm notlarını düzenli olarak güncelleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   CI/CD yapılandırma dosyaları
        *   `version.md`
        *   Veritabanı migration scriptleri

87.  **Zayıf Şifre Tespiti ve Politika Zorlaması**
    *   **Sorun:** Kullanıcılar kolayca tahmin edilebilir veya zayıf parolalar kullanıyor.
    *   **Çözüm:** Parola karmaşıklık kuralları (minimum uzunluk, karakter çeşitliliği) zorunlu kılınmalı. Yaygın olarak kullanılan veya sızdırılmış parolaların kara listeleri kullanılmalı.
    *   **Implementasyon:**
        *   Firebase Authentication, parola politikalarını destekler, bunları yapılandırın.
        *   `functions/src/api/auth-api.ts`: Yeni parola belirleme veya değiştirme endpoint'lerinde politika doğrulaması ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `functions/src/api/auth-api.ts`
        *   Firebase Authentication yapılandırması

88.  **URL Yönlendirmeleri ve Güvenli Yönlendirmeler**
    *   **Sorun:** Açık yönlendirme (Open Redirect) güvenlik açıkları mevcut veya URL yapısı SEO dostu değil.
    *   **Çözüm:** Tüm yönlendirmeler güvenli bir şekilde kontrol edilmeli, harici yönlendirmeler beyaz listeye alınmalı. Anlamsal (semantic) ve SEO dostu URL yapıları kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/rest.py`: Yönlendirme logic'ini güvenli hale getirin.
        *   Frontend yönlendirmeleri için (Vue Router) `router.beforeEach` gibi guard'lar kullanın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/rest.py`
        *   `aw-webui/src/router/index.js` (Vue Router yapılandırması)

89.  **Uygulama Güvenliği Test Otomasyonu**
    *   **Sorun:** Güvenlik testleri manuel olarak yapılıyor veya hiç yapılmıyor, bu da güvenlik açığı tespitini geciktiriyor.
    *   **Çözüm:** Güvenlik testleri (örneğin SQL Injection, XSS) otomatikleştirilmeli. ZAP, Burp Suite gibi araçlar CI/CD pipeline'ına entegre edilmeli.
    *   **Implementasyon:**
        *   CI/CD yapılandırma dosyaları: Güvenlik test adımları ekleyin.
        *   `functions/test/security/firestore.test.ts`: Güvenlik kuralları için daha kapsamlı testler yazın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   CI/CD yapılandırma dosyaları
        *   `functions/test/security/firestore.test.ts`

90.  **Güvenlik Güncellemeleri ve Yama Yönetimi**
    *   **Sorun:** Kullanılan işletim sistemi, kütüphaneler ve çerçevelerdeki güvenlik yamaları düzenli olarak uygulanmıyor.
    *   **Çözüm:** Sunucular, konteyner imajları ve bağımlılıklar için düzenli güvenlik güncellemeleri ve yama yönetimi süreçleri oluşturulmalı.
    *   **Implementasyon:**
        *   `Dockerfile` (varsa) veya deployment scriptlerinde güncel base imajları kullanın.
        *   Otomatik güvenlik güncellemeleri için araçlar entegre edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `Dockerfile` (varsa)
        *   Deployment scriptleri (`scripts/`)

91.  **Zayıf Şifreleme Algoritmalarının Tespiti ve Değişimi**
    *   **Sorun:** Kriptografik işlemler için eski veya zayıf şifreleme algoritmaları kullanılıyor.
    *   **Çözüm:** Mevcut tüm şifreleme algoritmaları gözden geçirilmeli ve NIST veya benzeri kurumların önerdiği güçlü, güncel algoritmalarla değiştirilmeli (örneğin AES-256, Argon2).
    *   **Implementasyon:**
        *   `functions/src/services/encryption/CryptoUtils.ts`: Şifreleme işlemlerinin yapıldığı yerleri kontrol edin ve güncelleyin.
        *   `aw-server/aw_server/encryption/`: Backend'deki şifreleme modüllerini kontrol edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `functions/src/services/encryption/CryptoUtils.ts`
        *   `aw-server/aw_server/encryption/`
        *   `docs/security-implementation-guide.md`

92.  **API Anahtarları ve Kimlik Bilgileri Rotasyonu**
    *   **Sorun:** Uzun ömürlü API anahtarları ve veritabanı kimlik bilgileri, sızdırılma riskini artırıyor.
    *   **Çözüm:** Tüm API anahtarları, sertifikalar ve veritabanı kimlik bilgileri için düzenli rotasyon politikaları uygulanmalı. Otomatik rotasyon mekanizmaları kullanılmalı.
    *   **Implementasyon:**
        *   Secret Management çözümleri ile entegre edin (bkz. madde 74).
        *   Periyodik anahtar rotasyonunu otomatikleştiren scriptler ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   Secret Management yapılandırmaları
        *   `scripts/` (yeni rotasyon scriptleri)

93.  **İç ve Dış Ağ Güvenliği (Network Security)**
    *   **Sorun:** Uygulamanın çalıştığı sunucuların veya konteynerlerin ağ erişimleri gerektiğinden daha geniş veya güvensiz.
    *   **Çözüm:** Güvenlik grupları, ağ ACL'leri ve VPN gibi araçlarla ağ erişimi kısıtlanmalı. En az ayrıcalık (least privilege) prensibi uygulanmalı.
    *   **Implementasyon:**
        *   Cloud sağlayıcıların ağ güvenlik özelliklerini (VPC, Güvenlik Grupları) yapılandırın.
        *   `apphosting.emulator.yaml`: Ağ yapılandırmasını inceleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `apphosting.emulator.yaml`
        *   Cloud sağlayıcı yapılandırmaları

94.  **Uygulama Konfigürasyonu Doğrulaması**
    *   **Sorun:** Uygulama başlatılırken veya çalışma anında konfigürasyon ayarları (veritabanı bağlantı dizeleri, API anahtarları) doğrulanmıyor, bu da beklenmedik hatalara yol açıyor.
    *   **Çözüm:** Uygulama başlatıldığında veya konfigürasyon yüklendiğinde tüm gerekli konfigürasyon değişkenleri ve değerleri doğrulanmalı. Eksik veya geçersiz konfigürasyonlarda erken hata verilmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/config.py`: Konfigürasyon dosyalarını yüklerken doğrulama logic'i ekleyin.
        *   `functions/src/firebaseAdmin.ts`: Firebase Admin SDK'sının doğru initialize edildiğinden emin olun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/config.py`
        *   `functions/src/firebaseAdmin.ts`
        *   `apphosting.emulator.yaml`

95.  **Uygulama Bağımlılıklarının Lisans Uyumluluğu**
    *   **Sorun:** Kullanılan üçüncü taraf kütüphanelerin lisansları, projenin genel lisans politikasıyla uyumsuz olabilir.
    *   **Çözüm:** Tüm bağımlılıkların lisansları kontrol edilmeli ve projenin lisans gereksinimleriyle uyumlu olduğundan emin olunmalı. Gerekirse lisans tarama araçları kullanılmalı.
    *   **Implementasyon:**
        *   Lisans uyumluluğunu tarayan bir araç (örneğin `license-checker` veya `FOSSA`) CI/CD'ye entegre edin.
        *   `LICENSE.txt`: Projenin ana lisans dosyasını güncelleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `LICENSE.txt` (genel)
        *   `pyproject.toml`, `package.json`, `Cargo.toml` (bağımlılık listeleri)

96.  **Sağlık Kontrolü (Health Checks) ve Canlılık/Hazırlık Probları (Liveness/Readiness Probes)**
    *   **Sorun:** Uygulamanın çalıştığı ortamda (konteyner, VM) sağlıklı olup olmadığı veya isteklere yanıt vermeye hazır olup olmadığı doğru tespit edilmiyor.
    *   **Çözüm:** Uygulama içinde sağlık kontrolü endpoint'leri (`/health`, `/ready`) oluşturulmalı. Bu endpoint'ler, altyapı izleme araçları (Kubernetes Liveness/Readiness probes) tarafından kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/server.py`: `/health` ve `/ready` endpoint'leri ekleyin.
        *   `apphosting.emulator.yaml`: Bu health check'leri kullanacak şekilde yapılandırın.
    *   **İşkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/server.py`
        *   `apphosting.emulator.yaml`

97.  **Sertifika ve Anahtar Yönetimi**
    *   **Sorun:** SSL/TLS sertifikaları, API anahtarları gibi kritik güvenlik varlıklarının yönetimi manuel veya güvensiz yollarla yapılıyor.
    *   **Çözüm:** Sertifika ve anahtar yönetimi için merkezi bir çözüm (örneğin bir PKI sistemi veya cloud KMS) kullanılmalı. Sertifika süreleri takip edilmeli ve otomatik yenileme süreçleri kurulmalı.
    *   **Implementasyon:**
        *   Cloud sağlayıcıların (Google Cloud Key Management Service) veya bir Secret Management aracının (Vault) entegrasyonunu araştırın.
        *   `aw-qt/src-tauri/` (Tauri uygulaması için sertifikalar) dizinini kontrol edin.
    *   **İşkili Dosyalar/Kodlar:**
        *   `aw-qt/src-tauri/`
        *   Cloud sağlayıcı yapılandırmaları

98.  **Uygulama İçi Güvenlik Başlıkları (Security Headers)**
    *   **Sorun:** Web uygulaması, tarayıcı tabanlı güvenlik açıklarını önlemek için gerekli HTTP güvenlik başlıklarını kullanmıyor.
    *   **Çözüm:** Content-Security-Policy (CSP), X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security (HSTS) gibi güvenlik başlıkları uygulama yanıtlarına eklenmeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/server.py`: Flask uygulamasında bu başlıkları ekleyen middleware'ler veya `@after_request` hook'ları kullanın.
        *   Web sunucusu yapılandırmasında (Nginx) bu başlıkları ayarlayın.
    *   **İşkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/server.py`
        *   Web sunucusu yapılandırmaları

99.  **Kullanıcı Kimlik Doğrulama Logları ve Anomali Tespiti**
    *   **Sorun:** Başarısız oturum açma denemeleri veya şüpheli kimlik doğrulama aktiviteleri yeterince izlenmiyor.
    *   **Çözüm:** Tüm kimlik doğrulama olayları (başarılı/başarısız giriş, parola sıfırlama, 2FA kullanımı) loglanmalı. Bu loglar üzerinde anomali tespiti (örneğin birden fazla başarısız giriş denemesi, farklı IP'lerden giriş) yapılmalı ve uyarılar gönderilmeli.
    *   **Implementasyon:**
        *   Firebase Authentication, bu tür logları zaten tutar, ancak bu logların izlenmesi için Cloud Logging veya bir SIEM sistemi ile entegrasyon gerekebilir.
        *   `functions/src/api/auth-api.ts`: Logları daha detaylı yazın.
    *   **İşkili Dosyalar/Kodlar:**
        *   `functions/src/api/auth-api.ts`
        *   `aw-server/aw_server/log.py`
        *   `functions/src/services/ai/` (anomali tespiti için AI modelleri)

100. **Erişim Günlüklerinin Merkezi Denetimi ve Analizi**
    *   **Sorun:** Kim kimin neye ne zaman eriştiği yeterince izlenmiyor veya denetlenmiyor.
    *   **Çözüm:** Tüm erişim olayları (API çağrıları, veri erişimi) merkezi olarak loglanmalı ve düzenli olarak denetlenmeli. Uyumluluk (compliance) gereksinimleri için denetim izleri (audit trails) sağlanmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/log.py`: Erişim loglarını detaylandırın.
        *   Firebase Cloud Logging veya Stackdriver gibi araçlarla entegrasyonu sağlayın.
    *   **İşkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/log.py`
        *   Cloud sağlayıcı yapılandırmaları

---

### 101-150: UI/UX, Frontend, i18n, Accessibility, Plugin/Agent Sistemleri

101. **Kullanıcı Arayüzünde (UI) Tutarlılık ve Standartlaştırma**
    *   **Sorun:** Uygulamanın farklı bölümlerinde UI bileşenleri (butonlar, formlar, kartlar) farklı stillere ve davranışlara sahip, bu da kullanıcı deneyimini bozuyor.
    *   **Çözüm:** Ortak bir tasarım sistemi ve component library (örneğin Vue Material, Vuetify) kullanılarak tüm UI bileşenleri standartlaştırılmalı. Tasarım yönergeleri oluşturulmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/components/` altındaki mevcut bileşenleri gözden geçirin ve tasarım sistemine uygun hale getirin.
        *   Yeni bileşenler oluştururken tasarım sistemini kullanın.
        *   `aw-webui/src/style/_globals.scss` ve `style.scss`: Merkezi stil dosyalarını standardize edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/` (tüm Vue bileşenleri)
        *   `aw-webui/src/style/`

102. **Responsive Tasarımın Tüm Sayfalarda Sağlanması**
    *   **Sorun:** Uygulama farklı ekran boyutlarında (mobil, tablet, masaüstü) düzgün görüntülenmiyor veya kullanılabilirliği azalıyor.
    *   **Çözüm:** Tüm UI sayfaları ve bileşenleri responsive tasarım prensiplerine uygun olarak geliştirilmeli. Media query'ler, esnek layout'lar ve mobil öncelikli (mobile-first) yaklaşım benimsenmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/style/style.scss`: Responsive CSS kuralları ekleyin.
        *   Tüm `aw-webui/src/views/` ve `aw-webui/src/components/` bileşenlerini responsive olacak şekilde güncelleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/style/style.scss`
        *   `aw-webui/src/views/` (tüm görünüm bileşenleri)
        *   `aw-webui/src/components/` (tüm UI bileşenleri)

103. **Erişilebilirlik (Accessibility) Standartlarına Uyumluluk**
    *   **Sorun:** Uygulama, engelli kullanıcılar (görme bozukluğu, motor beceri eksikliği) için erişilebilir değil (örneğin, klavye navigasyonu, ekran okuyucu desteği eksik).
    *   **Çözüm:** WCAG (Web Content Accessibility Guidelines) standartlarına uygunluk sağlanmalı. Semantik HTML, ARIA rolleri, klavye navigasyonu ve kontrast oranları gibi erişilebilirlik prensipleri uygulanmalı.
    *   **Implementasyon:**
        *   Tüm Vue bileşenlerinde semantik HTML etiketleri ve ARIA nitelikleri kullanın.
        *   Klavye ile gezilebilir (focusable) elementlerin doğru çalıştığından emin olun.
        *   Renk kontrast oranlarını kontrol edin ve iyileştirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/` (tüm Vue bileşenleri)
        *   `aw-webui/src/views/`
        *   `aw-webui/src/style/`

104. **Uluslararasılaşma (Internationalization - i18n) ve Yerelleştirme (Localization - l10n)**
    *   **Sorun:** Uygulama sadece İngilizce dilini destekliyor veya yeni diller eklemek zor.
    *   **Çözüm:** Uygulama tamamen uluslararasılaşmaya hazır hale getirilmeli. Tüm metinler yerelleştirme dosyalarına taşınmalı, tarih, saat ve sayı formatları kullanıcıların yerel ayarlarına göre ayarlanmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/locales/`: Yeni dil dosyalarını (örneğin `tr.json`) ekleyin ve tüm UI metinlerini buraya taşıyın (madde 20).
        *   Vue I18n veya benzeri bir kütüphane kullanarak dil değişimini etkinleştirin.
        *   Tarih/saat ve sayı formatlarını kullanıcı ayarına göre ayarlayın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/locales/`
        *   `aw-webui/src/main.js` (i18n kurulumu)
        *   Tüm Vue bileşenleri

105. **Performans Optimizasyonu (Frontend)**
    *   **Sorun:** Frontend uygulaması yavaş yükleniyor veya tarayıcıda takılmalar yaşanıyor.
    *   **Çözüm:** Frontend performans optimizasyonları yapılmalı (kod bölme, tembel yükleme, resim optimizasyonu, kritik CSS/JS'i önceliklendirme). Lighthouse gibi araçlarla performans denetimleri yapılmalı.
    *   **Implementasyon:**
        *   `aw-webui/vite.config.js` veya `vue.config.js`: Kod bölme (code splitting) ve tembel yüklemeyi (lazy loading) yapılandırın.
        *   Resim dosyalarını optimize edin (`aw-webui/media/`).
        *   `aw-webui/src/main.js`: İlk yükleme için gerekli olmayan modülleri async olarak yükleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/vite.config.js`, `aw-webui/vue.config.js`
        *   `aw-webui/src/main.js`
        *   `aw-webui/media/`

106. **Görsel Regresyon Testleri**
    *   **Sorun:** Yeni özellikler veya stil değişiklikleri, mevcut UI'da istenmeyen görsel bozulmalara yol açıyor ve bu manuel olarak tespit ediliyor.
    *   **Çözüm:** Storybook, Percy, Chromatic gibi araçlarla görsel regresyon testleri otomatikleştirilmeli. UI bileşenlerinin ve sayfaların farklı tarayıcı ve cihazlarda tutarlılığı sağlanmalı.
    *   **Implementasyon:**
        *   `aw-webui/test/e2e/screenshot.test.js`: Mevcut screenshot testlerini genişletin veya görsel regresyon testi aracını entegre edin.
        *   Vue Storybook kurulumu (eğer yoksa).
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/test/e2e/screenshot.test.js`
        *   `aw-webui/src/components/` (Storybook için bileşenler)

107. **Frontend Hata Yönetimi ve Takibi**
    *   **Sorun:** Frontend uygulamasında meydana gelen JavaScript hataları veya kullanıcı arayüzü hataları yeterince izlenmiyor veya raporlanmıyor.
    *   **Çözüm:** Sentry, LogRocket, Bugsnag gibi frontend hata izleme araçları entegre edilmeli. Kullanıcı tarafındaki hatalar, stack trace'ler ve kullanıcı bağlamı ile birlikte raporlanmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/main.js`: Hata izleme SDK'sını initialize edin.
        *   `aw-webui/src/mixins/asyncErrorCaptured.js`: Vue hatalarını bu servislere gönderin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/main.js`
        *   `aw-webui/src/mixins/asyncErrorCaptured.js`

108. **Kullanıcı Geri Bildirim ve Destek Mekanizmaları**
    *   **Sorun:** Kullanıcıların uygulama içinde kolayca geri bildirimde bulunabileceği veya destek alabileceği bir mekanizma yok.
    *   **Çözüm:** Uygulama içine geri bildirim formları, "sorun bildir" butonları veya entegre bir destek widget'ı (Intercom, Zendesk) eklenmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/components/` altına bir `FeedbackDialog.vue` bileşeni oluşturun.
        *   Geri bildirimleri alacak bir backend endpoint'i geliştirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/` (yeni bileşen)
        *   `aw-webui/src/views/settings/` (geri bildirim ayarları)
        *   `functions/src/api/` (geri bildirim API'si)

109. **Çevrimdışı Mod ve PWA (Progressive Web App) Desteği**
    *   **Sorun:** Uygulama internet bağlantısı olmadığında çalışmıyor veya çevrimdışı önbellekleme yetenekleri yok.
    *   **Çözüm:** Uygulama, PWA standartlarına uygun hale getirilmeli. Service Worker'lar ile çevrimdışı önbellekleme, bildirimler ve ana ekrana ekleme gibi özellikler sağlanmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/static/service-worker.js`: Mevcut Service Worker'ı optimize edin veya yeniden yazın.
        *   `public/index.html`: PWA manifest dosyasını bağlayın.
        *   `aw-webui/src/main.js`: Service Worker'ı kaydedin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/static/service-worker.js`
        *   `public/index.html`
        *   `aw-webui/src/main.js`

110. **Arama Motoru Optimizasyonu (SEO)**
    *   **Sorun:** Web uygulamasının arama motorları tarafından dizine eklenmesi zor veya sosyal medya paylaşımları için meta etiketleri eksik.
    *   **Çözüm:** Uygulama için SEO iyileştirmeleri yapılmalı. Dinamik meta etiketler, sunucu tarafı renderlama (SSR) veya önceden renderlama (prerendering) çözümleri değerlendirilmeli.
    *   **Implementasyon:**
        *   Vue Router ile her sayfa için dinamik meta etiketleri ayarlayın.
        *   Vue için Nuxt.js gibi bir SSR çerçevesi entegrasyonu araştırılabilir (büyük bir değişiklik).
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/router/index.js` (meta etiketleri)
        *   `public/index.html` (temel meta etiketler)

111. **Çerez (Cookie) Onay Mekanizması (GDPR/KVKK Uyumluluğu)**
    *   **Sorun:** Uygulama çerezleri kullanıyor ancak kullanıcılardan yasal olarak gerekli olan onayı almıyor.
    *   **Çözüm:** GDPR, KVKK gibi regülasyonlara uyumlu bir çerez onay mekanizması (cookie banner) eklenmeli. Kullanıcılara hangi çerezlerin kullanıldığı ve neden kullanıldığı hakkında bilgi verilmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/components/` altına bir `CookieConsent.vue` bileşeni oluşturun.
        *   `aw-webui/src/main.js`: Uygulama başlatıldığında çerezleri kontrol edin ve banner'ı gösterin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/` (yeni bileşen)
        *   `aw-webui/src/main.js`
        *   `PRIVACY.md` (çerez politikası)

112. **Frontend Güvenlik Açıklarının Kapatılması (npm audit)**
    *   **Sorun:** Frontend bağımlılıklarında (npm paketleri) bilinen güvenlik açıkları mevcut.
    *   **Çözüm:** `npm audit` veya `yarn audit` komutları düzenli olarak çalıştırılmalı ve tespit edilen tüm güvenlik açıkları giderilmeli (bağımlılıkları güncelleme veya alternatif paket kullanma).
    *   **Implementasyon:**
        *   `aw-webui/package.json`: Tüm bağımlılıkları güncelleyin.
        *   CI/CD pipeline'ına `npm audit` adımı ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/package.json`
        *   `aw-webui/poetry.lock` (varsa, front-end bağımlılığı için)
        *   CI/CD yapılandırma dosyaları

113. **Kullanıcı Deneyimi Testleri (User Experience - UX)**
    *   **Sorun:** Kullanıcı arayüzünün akıcılığı, kolaylığı ve genel kullanıcı deneyimi yeterince test edilmiyor.
    *   **Çözüm:** Kullanıcı deneyimi (UX) testleri (kullanılabilirlik testleri, A/B testleri, göz izleme) yapılarak kullanıcı davranışları analiz edilmeli ve iyileştirmeler yapılmalı.
    *   **Implementasyon:**
        *   Kullanıcı test oturumları düzenleyin ve geri bildirimleri toplayın.
        *   Frontend'de (Vue) A/B testleri için entegrasyon yapın (örneğin Google Optimize).
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/views/` (test edilecek sayfalar)
        *   `aw-webui/src/components/` (test edilecek bileşenler)

114. **Yapay Zeka (AI) Destekli Özelliklerin Entegrasyonu**
    *   **Sorun:** Uygulamada henüz AI destekli özellikler (örneğin otomatik kategori önerileri, anomali tespiti) yok veya mevcutlar yetersiz.
    *   **Çözüm:** Yapay zeka ve makine öğrenimi modelleri entegre edilerek kullanıcı deneyimi zenginleştirilmeli. Özellikle davranış analizi, zaman yönetimi önerileri gibi alanlarda AI kullanılmalı.
    *   **Implementasyon:**
        *   `functions/src/services/ai/`: Bu dizin altındaki servisleri kullanarak AI modellerini entegre edin.
        *   `aw-webui/src/components/AIInsightsDisplay.vue`, `AnomalyDetectionDisplay.vue`, `AutoCategorizationDisplay.vue`: Bu bileşenleri kullanarak AI sonuçlarını UI'da gösterin.
        *   `functions/src/api/ai-api.ts` (oluşturulabilir): AI servisleri için API endpoint'leri tanımlayın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `functions/src/services/ai/`
        *   `aw-webui/src/components/AIInsightsDisplay.vue`
        *   `functions/src/api/ai-api.ts`
        *   `aw-webui/src/util/ai-feature-service.ts`
        *   `aw-webui/src/util/ai-processing-coordinator.ts`

115. **Plugin/Agent Sistemi için Geliştirici Deneyimi**
    *   **Sorun:** ActiveWatch'a yeni watcher'lar veya eklentiler geliştirmek zor veya geliştirici dokümantasyonu eksik.
    *   **Çözüm:** Plugin/Agent geliştiricileri için kapsamlı SDK'lar, örnek kodlar ve API referansları sağlanmalı. Geliştirici dostu bir ortam oluşturulmalı.
    *   **Implementasyon:**
        *   `aw-core/`: Watcher'lar için ortak bir Python SDK'sı oluşturun.
        *   `aw-server/aw_server/api.py`: Agent API'lerini iyi dokümante edin.
        *   `docs/` klasörüne geliştirici dokümantasyonu ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-core/`
        *   `aw-server/aw_server/api.py`
        *   `docs/` (yeni dokümantasyon)
        *   `aw-watcher-afk/`, `aw-watcher-input/`, `aw-watcher-window/` (örnek watcher'lar)

116. **Tauri Uygulaması için Yerel Entegrasyonlar**
    *   **Sorun:** `aw-qt` (Tauri uygulaması) yerel sistem özellikleriyle (bildirimler, sistem tepsisi, anahtar zinciri) yeterince entegre değil.
    *   **Çözüm:** Tauri'nin sunduğu yerel API'ler (notifications, tray icon, keyring) kullanılarak daha iyi bir kullanıcı deneyimi sağlanmalı.
    *   **Implementasyon:**
        *   `aw-qt/src-tauri/src/notifications.rs`: Yerel bildirimleri kullanın.
        *   `aw-qt/src-tauri/src/tray.rs`: Sistem tepsisi entegrasyonunu iyileştirin.
        *   `aw-qt/src-tauri/src/keyring_service.rs`: Anahtar zinciri servislerini optimize edin.
        *   `aw-qt/aw_qt/trayicon.py`: Python tarafında da sistem tepsisi entegrasyonunu kontrol edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-qt/src-tauri/src/` (Rust dosyaları)
        *   `aw-qt/aw_qt/trayicon.py`

117. **Sistem Tepsisi (Tray Icon) Özelliklerinin Geliştirilmesi**
    *   **Sorun:** Sistem tepsisi simgesi (tray icon) etkileşimleri sınırlı veya kullanıcıya yeterli bilgi sağlamıyor.
    *   **Çözüm:** Sistem tepsisi simgesi üzerinden hızlı eylemler (uygulamayı aç/kapat, aktivite başlat/durdur), anlık durum göstergeleri ve bağlamsal menüler sağlanmalı.
    *   **Implementasyon:**
        *   `aw-qt/aw_qt/trayicon.py`: Sistem tepsisi menüsüne yeni özellikler ekleyin.
        *   `aw-qt/aw_qt/manual_activity_dialog.py`: Hızlı aktivite ekleme/düzenleme pencerelerini entegre edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-qt/aw_qt/trayicon.py`
        *   `aw-qt/aw_qt/manual_activity_dialog.py`

118. **Görsel Temalar ve Özelleştirme**
    *   **Sorun:** Uygulama tek bir tema (karanlık/aydınlık) sunuyor ve kullanıcıların arayüzü özelleştirmesine olanak tanımıyor.
    *   **Çözüm:** Kullanıcılara farklı görsel temalar (aydınlık, karanlık, yüksek kontrast) seçme imkanı sunulmalı. Tema ayarları kaydedilmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/style/dark.css`: Mevcut karanlık temayı geliştirin.
        *   `aw-server/aw_server/static/dark.css`: Statik tema dosyasını kontrol edin.
        *   `aw-webui/src/stores/settings.ts`: Tema seçimini state management'a ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/style/dark.css`, `aw-webui/src/style/style.scss`
        *   `aw-server/aw_server/static/dark.css`
        *   `aw-webui/src/stores/settings.ts`

119. **Animasyon ve Geçişlerin İyileştirilmesi**
    *   **Sorun:** UI'daki animasyonlar ve sayfa geçişleri akıcı değil veya kullanıcı deneyimini zayıflatıyor.
    *   **Çözüm:** Mikro etkileşimler ve animasyonlar eklenerek kullanıcı deneyimi zenginleştirilmeli. CSS transition'ları, Vue transition bileşenleri veya GreenSock gibi kütüphaneler kullanılabilir.
    *   **Implementasyon:**
        *   Vue bileşenlerinde `<transition>` ve `<transition-group>` kullanın.
        *   CSS animasyonları ve transform özellikleri ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/` (tüm Vue bileşenleri)
        *   `aw-webui/src/views/`

120. **Boş Durum (Empty State) Tasarımı**
    *   **Sorun:** Veri olmayan veya ilk kez açılan sayfalarda kullanıcıya yol gösterici mesajlar veya eylem çağrıları eksik.
    *   **Çözüm:** Boş durumlar için (örneğin "veri yok", "henüz aktivite yok") kullanıcıya ne yapması gerektiğini anlatan bilgilendirici mesajlar ve uygun eylem çağrıları (örneğin "aktivite ekle") eklenmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/views/activity/ActivityView.vue`: Aktivite olmadığında gösterilecek bir "empty state" bileşeni ekleyin.
        *   `aw-webui/src/components/` altına genel bir `EmptyState.vue` bileşeni oluşturun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/views/activity/ActivityView.vue`
        *   `aw-webui/src/components/` (yeni bileşen)

121. **Kullanıcı Kayıt ve Giriş Akışlarının İyileştirilmesi**
    *   **Sorun:** Kullanıcı kayıt ve giriş süreçleri karmaşık, hata mesajları yetersiz veya kullanıcıya yeterli rehberlik sağlamıyor.
    *   **Çözüm:** Kayıt ve giriş formları sadeleştirilmeli, gerçek zamanlı doğrulama ve açıklayıcı hata mesajları eklenmeli. Kullanıcıları başarıyla yönlendiren geri bildirimler sağlanmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/views/Login.vue`, `Signup.vue` (varsa): Formları ve doğrulama mantığını iyileştirin.
        *   `functions/src/api/auth-api.ts`: API hata mesajlarını daha kullanıcı dostu hale getirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/views/Login.vue`
        *   `functions/src/api/auth-api.ts`
        *   `aw-webui/src/stores/auth.ts`

122. **Bildirimlerin Yönetimi ve Önceliklendirilmesi**
    *   **Sorun:** Kullanıcılar çok fazla bildirim alıyor veya önemli bildirimler gözden kaçabiliyor.
    *   **Çözüm:** Bildirimler önceliklendirilerek (kritik, önemli, bilgilendirici) kullanıcıya sunulmalı. Kullanıcılara bildirim tercihleri (e-posta, uygulama içi, push) ve sıklığı üzerinde kontrol sağlanmalı.
    *   **Implementasyon:**
        *   `aw-notify/aw_notify/main.py`: Bildirim mantığını önceliklendirmeye göre güncelleyin.
        *   `aw-webui/src/views/settings/AINotificationSettings.vue`: Kullanıcıların bildirim ayarlarını yapılandırabileceği bir arayüz ekleyin.
        *   Firebase Cloud Messaging (FCM) entegrasyonu (madde 159).
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-notify/aw_notify/main.py`
        *   `aw-webui/src/views/settings/AINotificationSettings.vue`
        *   `functions/src/triggers/` (bildirim tetikleyicileri)

123. **Grafikler ve Görselleştirmelerin Etkileşimliliği**
    *   **Sorun:** Mevcut grafikler ve veri görselleştirmeleri (örneğin `Calendar.vue`) etkileşimli değil veya yeterli detay sağlamıyor.
    *   **Çözüm:** Grafiklere tooltipler, zoom, filtreleme, tıklanabilir öğeler gibi etkileşimli özellikler eklenmeli. Kullanıcıların veriyi daha derinlemesine keşfetmesine olanak tanınmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/visualizations/Calendar.vue`, `CategoryTree.vue`, `CustomVisualization.vue`: Bu bileşenleri etkileşimli hale getirin (Chart.js, D3.js gibi kütüphanelerle).
        *   `aw-webui/src/queries.ts`: Görselleştirmeler için daha esnek veri sorguları yazın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/visualizations/` (tüm görselleştirme bileşenleri)
        *   `aw-webui/src/queries.ts`

124. **Klavye Navigasyonu ve Kısayollar**
    *   **Sorun:** Uygulama tamamen klavye ile kullanılamıyor veya klavye kısayolları eksik.
    *   **Çözüm:** Tüm uygulama işlevselliği klavye ile erişilebilir olmalı. Sık kullanılan eylemler için klavye kısayolları tanımlanmalı ve belgelenmeli.
    *   **Implementasyon:**
        *   Vue bileşenlerinde `v-on:keyup` veya benzeri event handler'lar kullanarak kısayolları uygulayın.
        *   `docs/user-privacy-guide.md` (veya yeni bir `docs/shortcuts.md`) klavye kısayollarını belgeleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/App.vue` (genel kısayollar)
        *   Tüm Vue bileşenleri
        *   `docs/` (yeni dokümantasyon)

125. **Form Elemanlarının Kullanılabilirlik İyileştirmeleri**
    *   **Sorun:** Form girdileri (text alanları, select box'lar, checkbox'lar) kullanıcı dostu değil veya hatalı girişlerde yeterli geri bildirim sağlamıyor.
    *   **Çözüm:** Form elemanları için otomatik tamamlama, giriş maskeleri, anında doğrulama geri bildirimleri, varsayılan değerler ve yardımcı metinler gibi kullanılabilirlik iyileştirmeleri yapılmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/components/` altında özel form bileşenleri oluşturun (örneğin `ValidatedInput.vue`).
        *   `aw-webui/src/views/settings/` içindeki ayar formlarını iyileştirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/` (yeni/mevcut form bileşenleri)
        *   `aw-webui/src/views/settings/` (tüm ayar sayfaları)

126. **Kullanıcı Avatarı/Profil Yönetimi**
    *   **Sorun:** Kullanıcılar kendi profillerini (avatar, isim, iletişim bilgileri) düzenleyemiyor veya yönetemiyor.
    *   **Çözüm:** Kullanıcıların profil bilgilerini güncelleyebileceği bir arayüz sağlanmalı. Avatar yükleme, profil bilgilerini düzenleme gibi özellikler eklenmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/views/settings/ProfileSettings.vue` (varsa veya oluşturulmalı): Profil düzenleme sayfasını oluşturun.
        *   `functions/src/api/user-api.ts` (oluşturulabilir): Profil güncelleme API endpoint'leri tanımlayın.
        *   Firebase Storage ile avatar yükleme entegrasyonu.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/views/settings/ProfileSettings.vue`
        *   `functions/src/api/user-api.ts`
        *   `storage.rules` (Firebase Storage güvenlik kuralları)

127. **İlerleme Göstergeleri ve Yükleme Durumları**
    *   **Sorun:** Uzun süren işlemler (veri yükleme, API çağrıları) sırasında kullanıcıya görsel geri bildirim sağlanmıyor, bu da uygulamanın takılmış gibi görünmesine neden oluyor.
    *   **Çözüm:** Yükleme spinner'ları, ilerleme çubukları veya iskelet ekranları (skeleton screens) gibi görsel ilerleme göstergeleri kullanılmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/components/LoadingSpinner.vue` (veya benzeri): Genel bir yükleme bileşeni oluşturun.
        *   API çağrıları veya uzun süren veri yüklemelerinde bu bileşenleri gösterin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/` (yeni bileşen)
        *   `aw-webui/src/awclient.ts` (API yükleme durumları)
        *   `aw-webui/src/stores/` (veri yükleme durumları)

128. **Modüler CSS/SCSS Yaklaşımı**
    *   **Sorun:** CSS/SCSS kodları global scope'u kirletiyor, çakışmalara neden oluyor ve bakımı zorlaştırıyor.
    *   **Çözüm:** CSS modülleri, scoped CSS veya BEM (Block-Element-Modifier) gibi yöntemlerle stil kodları modüler hale getirilmeli. Stil dosyaları bileşen bazlı olmalı.
    *   **Implementasyon:**
        *   Vue bileşenlerinde `<style scoped>` kullanın.
        *   `aw-webui/src/style/` altındaki SCSS dosyalarını daha küçük, bileşen bazlı dosyalara bölün.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/style/`
        *   `aw-webui/src/components/`
        *   `aw-webui/src/views/`

129. **Font ve İkon Yönetimi**
    *   **Sorun:** Uygulamada kullanılan fontlar ve ikonlar verimli bir şekilde yönetilmiyor veya performans sorunlarına yol açıyor.
    *   **Çözüm:** Web fontları (WOFF2) optimize edilmeli ve sadece gerekli karakter setleri yüklenmeli. İkonlar için SVG sprite'lar veya ikon fontları (Font Awesome, Material Icons) kullanılmalı.
    *   **Implementasyon:**
        *   `aw-server/aw_server/static/fonts/`: Font dosyalarını optimize edin.
        *   `aw-qt/media/fonts/`: Qt uygulamasındaki fontları kontrol edin.
        *   SVG ikonları için bir sistem oluşturun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/static/fonts/`
        *   `aw-qt/media/fonts/`
        *   `aw-webui/src/style/_globals.scss` (font tanımları)
        *   `aw-webui/src/assets/icons/` (oluşturulabilir)

130. **Dark Mode / Light Mode Geçişi**
    *   **Sorun:** Uygulama tek bir tema modunda (genellikle açık) çalışıyor ve kullanıcıların tercihine göre karanlık moda geçiş yapma imkanı sunmuyor.
    *   **Çözüm:** Kullanıcının sistem tercihine veya manuel seçimine göre aydınlık ve karanlık mod arasında sorunsuz geçiş yapma özelliği eklenmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/style/dark.css`: Mevcut karanlık temayı geliştirin.
        *   CSS değişkenleri (CSS variables) kullanarak tema yönetimini kolaylaştırın.
        *   Kullanıcının tema tercihini yerel depolama (localStorage) veya backend'de saklayın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/style/dark.css`, `aw-webui/src/style/style.scss`
        *   `aw-webui/src/main.js` (tema yükleme logic'i)
        *   `aw-webui/src/stores/settings.ts` (tema ayarı)

131. **Eski Tarayıcı Desteği ve Polyfill Yönetimi**
    *   **Sorun:** Uygulama modern tarayıcılar dışında eski tarayıcılarda (örneğin IE11) düzgün çalışmıyor veya uyumluluk sorunları yaşıyor.
    *   **Çözüm:** Desteklenecek tarayıcı listesi belirlenmeli. Gerekirse polyfill'ler (örneğin Babel polyfill, core-js) veya tarayıcı uyumluluğu için transpiling ayarları (`babel.config.js`) yapılandırılmalı.
    *   **Implementasyon:**
        *   `aw-webui/babel.config.js`: Tarayıcı hedeflerini ve polyfill ayarlarını kontrol edin.
        *   `aw-webui/vite.config.js`: Üretim çıktısını eski tarayıcılara uyumlu hale getirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/babel.config.js`
        *   `aw-webui/vite.config.js`, `aw-webui/vue.config.js`

132. **Veri Görselleştirmelerinde Ölçeklenebilirlik**
    *   **Sorun:** Büyük veri kümeleri (örneğin binlerce aktivite kaydı) grafiklerde veya tablolarda işlenirken performans sorunları yaşanıyor.
    *   **Çözüm:** Veri görselleştirmelerinde virtualizasyon (görünürdeki veriyi render etme), kümeleme (clustering) veya özetleme (aggregation) teknikleri kullanılmalı. Backend API'leri de sayfalama (pagination) ve filtreleme yetenekleri sunmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/visualizations/`: Büyük veri kümeleri için performanslı kütüphaneler (örneğin ECharts, Plotly) veya özel optimizasyonlar uygulayın.
        *   `aw-server/aw_server/api.py`: `get_events` gibi API endpoint'lerinde daha gelişmiş filtreleme ve sayfalama parametreleri ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/visualizations/`
        *   `aw-server/aw_server/api.py`
        *   `aw-webui/src/queries.ts`

133. **Uygulama İçi Yardım ve Rehberlik (Onboarding)**
    *   **Sorun:** Yeni kullanıcılar uygulamayı ilk kez kullandıklarında veya yeni bir özelliğe eriştiklerinde yeterli rehberlik almıyor.
    *   **Çözüm:** Uygulama içi turlar, ipuçları (tooltips), boş durum mesajları ve bağlamsal yardım balonları (contextual help) gibi onboarding mekanizmaları eklenmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/views/settings/`: Yardım ve ipuçları için yeni ayarlar eklenebilir.
        *   `aw-webui/src/components/` altına `OnboardingTour.vue` veya `Tooltip.vue` bileşenleri oluşturun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/` (yeni bileşenler)
        *   `aw-webui/src/views/` (rehberlik eklenecek sayfalar)

134. **Çekirdek Modül (aw-core) Genişletilebilirliği**
    *   **Sorun:** `aw-core` modülü, projenin diğer parçaları (watcher'lar, server) için merkezi bir kütüphane olmasına rağmen yeterince genişletilebilir veya iyi tanımlanmış bir API'ye sahip değil.
    *   **Çözüm:** `aw-core` modülü, tüm projede ortak kullanılan temel fonksiyonlar, veri yapıları ve yardımcılar için sağlam, iyi belgelenmiş ve genişletilebilir bir API sunmalı. Bağımlılıkları minimumda tutulmalı.
    *   **Implementasyon:**
        *   `aw-core/`: Modülün yapısını gözden geçirin, eksik temel yardımcıları (örneğin tarih/saat yardımcıları, UUID üretimi) ekleyin.
        *   Tüm public API'leri için docstringler/type hinting ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-core/` (tüm dosyalar)
        *   `aw-server/aw_server/`, `aw-qt/aw_qt/`, `aw-watcher-afk/aw_watcher_afk/` (aw-core bağımlılığı olan modüller)

135. **Gelişmiş Filtreleme ve Sıralama Seçenekleri**
    *   **Sorun:** Kullanıcılar etkinlik verilerini veya listeleri (örneğin kategoriler, bucket'lar) yeterince esnek bir şekilde filtreleyemiyor veya sıralayamıyor.
    *   **Çözüm:** Uygulama arayüzünde gelişmiş filtreleme (tarih aralığı, kategori, etiket, metin araması) ve sıralama (artan/azalan, farklı kriterlere göre) seçenekleri sunulmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/views/activity/ActivityView.vue`: Gelişmiş filtreleme/sıralama UI kontrolleri ekleyin.
        *   `aw-server/aw_server/api.py`: API endpoint'lerine daha fazla filtreleme ve sıralama parametresi ekleyin (SQL/Firestore sorgularını optimize ederek).
        *   `aw-webui/src/queries.ts`: Frontend sorgularını bu yeni seçeneklere göre güncelleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/views/activity/ActivityView.vue`
        *   `aw-webui/src/components/BucketList.vue`, `CategoryList.vue`
        *   `aw-server/aw_server/api.py`
        *   `aw-webui/src/queries.ts`

136. **Kullanıcı Etkinliği Günlüğü ve Denetim İzleri**
    *   **Sorun:** Kullanıcıların uygulama içinde yaptığı önemli eylemler (ayar değişiklikleri, veri silme, yönetici işlemleri) detaylı olarak günlüğe kaydedilmiyor.
    *   **Çözüm:** Tüm kritik kullanıcı eylemleri denetim izleri (audit trails) olarak kaydedilmeli. Bu loglar, kimin, neyi, ne zaman, nereden yaptığı bilgilerini içermeli.
    *   **Implementasyon:**
        *   `aw-server/aw_server/api.py`: Kritik API çağrılarında denetim logları yazın.
        *   `functions/src/triggers/firestore-triggers.ts` (oluşturulabilir): Firestore'daki değişiklikleri denetim loglarına kaydedin.
        *   Bu logları ayrı bir "Denetim Günlüğü" sayfasında gösterebilirsiniz.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-server/aw_server/api.py`
        *   `functions/src/triggers/firestore-triggers.ts`
        *   `aw-server/aw_server/log.py`

137. **Bildirim Merkezi ve Geçmişi**
    *   **Sorun:** Uygulama içi bildirimler geçici olarak gösteriliyor ve kullanıcılar kaçırdıkları veya eski bildirimleri görüntüleyemiyor.
    *   **Çözüm:** Kullanıcılara tüm bildirimlerin geçmişini görebilecekleri merkezi bir bildirim merkezi (inbox) sağlanmalı. Okundu/okunmadı durumları ve filtreleme özellikleri olmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/components/NotificationDisplay.vue`: Mevcut bildirimi kalıcı bir bildirim listesine dönüştürün.
        *   Yeni bir `aw-webui/src/views/Notifications.vue` sayfası oluşturun.
        *   Backend'de bildirimleri saklamak için bir veritabanı tablosu veya Firestore koleksiyonu oluşturun.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/NotificationDisplay.vue`
        *   `aw-webui/src/views/Notifications.vue` (yeni sayfa)
        *   `aw-server/aw_server/api.py` (bildirim API'leri)
        *   `functions/src/triggers/` (bildirimleri Firestore'a yazan tetikleyiciler)

138. **Kullanıcı Denetimli Veri İçe/Dışa Aktarma**
    *   **Sorun:** Kullanıcılar kendi etkinlik verilerini uygulamadan kolayca dışa aktaramıyor veya uygulamaya dışarıdan veri aktaramıyor.
    *   **Çözüm:** Kullanıcılara kendi verilerini (örneğin JSON, CSV formatında) dışa aktarma ve içe aktarma imkanı sunulmalı. Bu, veri taşınabilirliği ve yedekleme için önemlidir.
    *   **Implementasyon:**
        *   `aw-webui/src/views/settings/DataSettings.vue` (varsa veya oluşturulmalı): İçe/dışa aktarma butonları ekleyin.
        *   `functions/src/api/data-api.ts` (oluşturulabilir): Veri dışa aktarma (export) ve içe aktarma (import) API endpoint'leri geliştirin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/views/settings/DataSettings.vue`
        *   `functions/src/api/data-api.ts`
        *   `functions/src/services/activity-service.ts` (veri işleme)

139. **Hızlı Eylem Çubukları veya Komut Paleti**
    *   **Sorun:** Sık kullanılan işlevlere erişim karmaşık menüler veya çoklu tıklamalar gerektiriyor.
    *   **Çözüm:** Kullanıcılara hızlı arama, kısayol veya komut paleti (Command Palette) aracılığıyla uygulama içindeki herhangi bir özelliğe veya veriye hızlı erişim imkanı sağlanmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/App.vue`: Ana layout'a bir komut paleti bileşeni entegre edin (örneğin Kbar gibi bir kütüphane).
        *   `aw-webui/src/stores/agent.ts` veya yeni bir store: Erişilebilir komutların listesini yönetin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/App.vue`
        *   `aw-webui/src/stores/agent.ts` (veya yeni bir store)
        *   `aw-webui/src/components/` (yeni bileşen)

140. **Sürükle ve Bırak (Drag-and-Drop) Özelliği**
    *   **Sorun:** Bazı arayüz elementleri (örneğin kategoriler, otomasyon kuralları) sürükle ve bırak ile yeniden düzenlenemiyor.
    *   **Çözüm:** Kategoriler, otomasyon kuralları veya özel paneller gibi ilgili arayüz elementleri için sürükle ve bırak ile yeniden düzenleme özelliği eklenerek kullanıcı deneyimi iyileştirilmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/components/CategoryTree.vue`: Kategori ağacını sürükle-bırak ile yeniden düzenlenebilir hale getirin.
        *   Vue Draggable veya benzeri bir kütüphane kullanın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/CategoryTree.vue`
        *   `aw-webui/src/views/AutomationRules.vue` (varsa)

141. **Uygulama İçi Arama ve Öneriler**
    *   **Sorun:** Uygulama içindeki arama fonksiyonu sadece tam eşleşmeler yapıyor ve akıllı öneriler sunmuyor.
    *   **Çözüm:** Arama kutucuklarına otomatik tamamlama, yazım hatası düzeltme ve semantik arama (yapay zeka destekli) önerileri entegre edilmeli.
    *   **Implementasyon:**
        *   `aw-webui/src/components/SearchBox.vue` (varsa veya oluşturulmalı): Akıllı arama önerileri ekleyin.
        *   `aw-server/aw_server/api.py`: Backend'de daha gelişmiş arama algoritmaları veya AI destekli öneri servisleri kullanın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/` (arama bileşeni)
        *   `aw-server/aw_server/api.py` (arama endpoint'i)
        *   `functions/src/services/ai/` (AI destekli arama)

142. **Kullanıcı Profilinin Zenginleştirilmesi**
    *   **Sorun:** Kullanıcı profilleri (isim, email) temel bilgilerle sınırlı ve kullanıcıya özel deneyimler için yetersiz.
    *   **Çözüm:** Kullanıcı profili, ek demografik bilgiler (isteğe bağlı), ilgi alanları, tercihler veya özgeçmiş gibi bilgilerle zenginleştirilmeli. Bu veriler kişiselleştirilmiş özellikler için kullanılabilir.
    *   **Implementasyon:**
        *   `functions/src/types/user-profile.d.ts` (oluşturulabilir): Kullanıcı profili için ek alanlar tanımlayın.
        *   `aw-webui/src/views/settings/ProfileSettings.vue`: Yeni alanları gösteren ve düzenlenebilen UI ekleyin.
        *   `functions/src/api/user-api.ts`: Profil güncelleme API'sini genişletin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `functions/src/types/user-profile.d.ts`
        *   `aw-webui/src/views/settings/ProfileSettings.vue`
        *   `functions/src/api/user-api.ts`

143. **Çoklu Dil ve Bölgesel Ayarların Yönetimi**
    *   **Sorun:** Uygulama sadece dil ayarını destekliyor ancak bölgesel ayarları (tarih formatı, para birimi, hafta başlangıcı) yönetmiyor.
    *   **Çözüm:** Kullanıcılara sadece dil değil, aynı zamanda bölgesel ayarları (tarih/saat formatı, hafta başlangıcı, sayı formatları) seçme imkanı sunulmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/views/settings/GeneralSettings.vue`: Bölgesel ayarlar için UI kontrolleri ekleyin.
        *   `aw-webui/src/stores/settings.ts`: Bu ayarları state management'a ekleyin ve saklayın.
        *   Vue I18n'ın tarih/saat/sayı formatlama özelliklerini kullanın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/views/settings/GeneralSettings.vue`
        *   `aw-webui/src/stores/settings.ts`
        *   `aw-webui/src/locales/`

144. **Erişilebilir Renk Paleti ve Kontrast Oranları**
    *   **Sorun:** Uygulama renkleri, görme engelli veya renk körü kullanıcılar için yeterli kontrast oranına sahip değil.
    *   **Çözüm:** Renk paleti, WCAG 2.1 yönergelerine uygun olarak, metin ve arka plan arasında yeterli kontrast sağlayacak şekilde yeniden düzenlenmeli. Tema geçişlerinde de kontrast tutarlılığı sağlanmalı.
    *   **Implementasyon:**
        *   `aw-webui/src/style/style.scss`: Tüm renk değişkenlerini ve kullanımlarını gözden geçirin.
        *   Bir renk kontrast denetleyicisi aracı kullanarak renklerin erişilebilirliğini test edin.
        *   Dark mode için de ayrı bir kontrast kontrolü yapın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/style/` (tüm SCSS dosyaları)
        *   `aw-webui/src/components/` (tema renklerini kullanan bileşenler)

145. **Odak Yönetimi (Focus Management) ve Sekme Sırası (Tab Order)**
    *   **Sorun:** Klavye ile gezinirken odak sırası mantıksız veya bazı interaktif elemanlara klavye ile erişilemiyor.
    *   **Çözüm:** Tüm interaktif UI elementleri (butonlar, linkler, form alanları) için mantıksal bir sekme sırası (`tabindex`) belirlenmeli. Modallar, bildirimler gibi durumlarda odak yönetimi doğru yapılmalı.
    *   **Implementasyon:**
        *   Tüm Vue bileşenlerindeki HTML yapısını gözden geçirin ve `tabindex` özniteliğini gerektiğinde kullanın.
        *   JavaScript ile dinamik olarak oluşturulan elementlerde odak yönetimini kontrol edin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/components/` (tüm Vue bileşenleri)
        *   `aw-webui/src/views/` (tüm görünüm bileşenleri)

146. **Uygulama İçi Destek ve SSS Entegrasyonu**
    *   **Sorun:** Kullanıcıların sıkça sorulan sorulara veya temel sorunlara uygulama içinde hızlıca yanıt bulabileceği bir yer yok.
    *   **Çözüm:** Uygulama içine entegre bir SSS (Sıkça Sorulan Sorular) bölümü veya küçük bir bilgi tabanı sağlanmalı. Arama fonksiyonu da içermeli.
    *   **Implementasyon:**
        *   `aw-webui/src/views/Help.vue` (oluşturulabilir): Bir yardım/SSS sayfası oluşturun.
        *   Yardım dokümanlarını markdown dosyaları olarak tutabilir ve bunları UI'da render edebilirsiniz.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-webui/src/views/Help.vue` (yeni sayfa)
        *   `public-md/checklist.md` (veya yeni bir `public-md/faq.md`)

147. **Watcher Uygulamalarının Kurulum ve Yönetim Kolaylığı**
    *   **Sorun:** Yeni watcher'ları (afk, window, input) kurmak ve yönetmek (başlatma, durdurma, yapılandırma) zor.
    *   **Çözüm:** Watcher'lar için daha kolay kurulum ve yönetim arayüzleri veya komut satırı araçları sağlanmalı. Merkezi bir arayüzden watcher durumları izlenebilmeli.
    *   **Implementasyon:**
        *   `aw-qt/aw_qt/main.py` veya `aw-qt/aw_qt/manager.py`: Watcher'ları yönetmek için daha iyi bir UI/logic ekleyin.
        *   `aw-webui/src/views/settings/AgentSettings.vue` (varsa veya oluşturulmalı): Web UI üzerinden watcher'ları yapılandırma yeteneği ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-qt/aw_qt/main.py`, `aw-qt/aw_qt/manager.py`
        *   `aw-webui/src/views/settings/AgentSettings.vue`
        *   `aw-webui/src/stores/agent.ts`

148. **Kullanıcı Geri Bildirimlerinin Analizi ve Önceliklendirilmesi**
    *   **Sorun:** Kullanıcılardan gelen geri bildirimler (hata raporları, özellik istekleri) toplanıyor ancak etkili bir şekilde analiz edilmiyor veya ürün yol haritasına dahil edilmiyor.
    *   **Çözüm:** Geri bildirimler merkezi bir sistemde (Jira, Trello, bir CRM) toplanmalı. Düzenli olarak analiz edilmeli, önceliklendirilmeli ve ürün geliştirme süreçlerine entegre edilmeli.
    *   **Implementasyon:**
        *   `functions/src/api/` (geri bildirim API'si) ile entegre bir backend servisi geliştirin.
        *   Harici bir geri bildirim yönetim aracıyla entegrasyonu araştırın.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `functions/src/api/` (geri bildirim API'si)
        *   `problems.md` (kullanıcı sorunları)

149. **Kullanıcı Davranış Analizi ve Kişiselleştirme**
    *   **Sorun:** Uygulama, kullanıcıların davranışlarını anlamak ve kişiselleştirilmiş deneyimler sunmak için yeterli analiz yapmıyor.
    *   **Çözüm:** Kullanıcıların uygulama içi etkileşimleri, etkinlik verileri ve tercihleri analiz edilerek kişiselleştirilmiş öneriler, içerikler veya özellikler sunulmalı.
    *   **Implementasyon:**
        *   `functions/src/services/ai/` (varsa): Kullanıcı davranış analizi için AI modelleri geliştirin.
        *   `aw-webui/src/stores/user.ts` (varsa): Kullanıcı tercihlerini saklayın.
        *   `aw-webui/src/components/` (kişiselleştirilmiş UI bileşenleri).
    *   **İlişkili Dosyalar/Kodlar:**
        *   `functions/src/services/ai/`
        *   `aw-webui/src/stores/user.ts`
        *   `aw-webui/src/components/AIInsightsDisplay.vue`

150. **Çoklu Platform (Windows, macOS, Linux) Optimizasyonu**
    *   **Sorun:** Uygulama farklı işletim sistemlerinde (Windows, macOS, Linux) performans veya uyumluluk sorunları yaşıyor.
    *   **Çözüm:** Her platforma özgü optimizasyonlar ve testler yapılmalı. Platforma özel modüller (`windows.py`, `macos.py`, `unix.py`) iyi yönetilmeli.
    *   **Implementasyon:**
        *   `aw-watcher-afk/aw_watcher_afk/windows.py`, `macos.py`, `unix.py`: Platforma özgü kodları gözden geçirin ve optimize edin.
        *   Tauri (`aw-qt/src-tauri/`) platformlar arası uyumluluğu zaten sağlar, ancak yerel entegrasyonlar optimize edilmeli (madde 116).
        *   CI/CD'de çoklu platform testleri ekleyin.
    *   **İlişkili Dosyalar/Kodlar:**
        *   `aw-watcher-afk/aw_watcher_afk/`
        *   `aw-watcher-window/aw_watcher_window/`
        *   `aw-qt/src-tauri/`
        *   `scripts/ci/` (platforma özgü scriptler)