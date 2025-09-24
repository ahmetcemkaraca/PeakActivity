# Copyright 2025 PeakActivity
# Licensed under the Mozilla Public License, v. 2.0.
# See LICENSE.txt for more details.
# PraisonAI AI Agent Builder Entegrasyonu

Bu belge, PeakActivityMain uygulamasına PraisonAI AI Agent Builder'ın entegrasyonunu detaylandırmaktadır. Bu entegrasyon, kullanıcının bilgisayar kullanım verilerini kullanarak üretkenliği artıracak ve görevleri otomatikleştirecek ajanların dinamik olarak oluşturulmasını ve yürütülmesini sağlamayı amaçlamaktadır.

## Genel Entegrasyon Mimarisi

Entegrasyon, ActivityWatch'tan toplanan verilerin PraisonAI ajanları tarafından kullanılmasını sağlayarak, bu ajanların belirli kullanıcı ihtiyaçlarına göre uyarlanmasını ve Firebase Fonksiyonları aracılığıyla güvenli API anahtarı yönetimi ile tetiklenmesini içermektedir.

```mermaid
graph TD
    A "[ActivityWatch Watchers]" --> B (aw-server)
    B --> C {Firestore Datastore}
    C --> D [Firebase Functions]
    D -- "Agent Trigger & API Key" --> E[aw-server/praisonai_integration/agent_service.py]
    E -- "LLM Calls (Gemini 2.5 Flash)" --> F[Google AI API]
    E --> G [PraisonAI Agents]
    G --> H [Productivity Actions]
    D --> I [Web UI (PeakActivityMain/aw-server/aw-webui)]
```

## Dosya ve Fonksiyon İlişkileri

### 1. PraisonAI Çekirdek Bileşenlerinin Uyarlanması

*   **`PeakActivityAgent/src/praisonai/praisonai/inc/models.py`**: Bu dosya, PraisonAI'nin çeşitli LLM sağlayıcılarıyla etkileşimini yöneten `PraisonAIModel` sınıfını içeriyordu. Entegrasyonun bir parçası olarak, bu dosya yalnızca Google'ın Gemini 2.5 Flash modeliyle çalışacak şekilde sadeleştirildi. Diğer tüm LLM sağlayıcılarına (OpenAI, Anthropic, Cohere vb.) yönelik içe aktarmalar, bayraklar ve koşullu mantık kaldırıldı. `PraisonAIModel` artık doğrudan yapıcıda sağlanan bir `api_key` beklemektedir, bu da anahtarın Firebase Fonksiyonları'ndan güvenli bir şekilde aktarılmasını sağlamaktadır. Bu değişiklik, gereksiz bağımlılıkları ortadan kaldırırken gizlilik ve güvenlik kurallarına uymaktadır.

### 2. PraisonAI Entegrasyon Modülü (Python)

*   **`PeakActivityMain/aw-server/praisonai_integration/` dizini**: Bu yeni dizin, ActivityWatch sunucusu bağlamında PraisonAI ajan işlevselliğini barındırmak için oluşturuldu.
    *   **`PeakActivityMain/aw-server/praisonai_integration/__init__.py`**: Bu boş dosya, `praisonai_integration` dizinini bir Python paketi olarak işaretler.
    *   **`PeakActivityMain/aw-server/praisonai_integration/agent_service.py`**: Bu dosya, `PraisonAIModel`'in uyarlanmış bir versiyonunu ve PraisonAI ajanlarını yapılandırmak ve çalıştırmaktan sorumlu `AgentsGenerator` sınıfını içerir. `AgentsGenerator`'ın `generate_and_run_agents` metodu, ajan yapılandırmasını (bir YAML dizesi olarak) ve bir konuyu alır. Ayrıca, Firebase Fonksiyonları'ndan güvenli bir şekilde sağlanan Gemini API anahtarını da kabul eder. Bu dosya, `aw-server`'ın PraisonAI çerçevesiyle etkileşime girmesi için ana mantık katmanıdır.

### 3. ActivityWatch Sunucusu API Uç Noktası (Python)

*   **`PeakActivityMain/aw-server/aw_server/rest.py`**: Bu dosya, ActivityWatch sunucusunun REST API uç noktalarını tanımlar. Yeni bir `POST` uç noktası `/api/0/agents/generate` eklendi.
    *   Bu uç nokta, bir JSON yükünde `agent_config_data` (YAML dizesi) ve `topic`'i alır.
    *   Gemini API anahtarı, `X-Gemini-Api-Key` HTTP başlığından alınır ve güvenlik için doğrudan istek gövdesine dahil edilmez.
    *   Gelen `agent_config_data` ayrıştırılır ve bir `AgentsGenerator` örneği oluşturulur. Ardından, ajanlar belirtilen konuyla çalıştırılır.
    *   Bu API uç noktası, Firebase Fonksiyonları'ndan gelen ajan oluşturma istekleri için bir köprü görevi görür ve `aw-server` içinde ajan yürütmeyi tetikler.

### 4. Firebase Fonksiyonları Entegrasyonu (TypeScript)

*   **`PeakActivityMain/functions/src/api/agent-api.ts`**: Bu yeni dosya, `aw-server`'daki `/api/0/agents/generate` uç noktasını çağırmaktan sorumlu bir Firebase Çağrılabilir Fonksiyonu olan `generateAgent`'ı içerir.
    *   `generateAgent` fonksiyonu, bir `agent_config_data` ve `topic` alır.
    *   **API Anahtar Güvenliği**: Gemini API anahtarı, Firebase Fonksiyonları Ortam Değişkenleri'nden (örneğin, `functions.config().gemini?.api_key`) güvenli bir şekilde alınır ve `aw-server`'a yapılan HTTP isteğinin `X-Gemini-Api-Key` başlığında iletilir. Bu, API anahtarının istemci tarafında açığa çıkmamasını sağlar.
    *   `requireAuth` middleware'i kullanılarak kimlik doğrulama zorunluluğu getirilir, bu da yalnızca doğrulanmış kullanıcıların bu fonksiyonu çağırmasına izin verir.
*   **`PeakActivityMain/functions/src/index.ts`**: Bu ana Firebase Fonksiyonları giriş dosyası, yeni `generateAgent` çağrılabilir fonksiyonunu içe aktaracak ve dışa aktaracak şekilde güncellendi, böylece Firebase projesinde dağıtılabilir hale geldi.

## Veri Akışı ve Gizlilik Notları

*   **ActivityWatch Verileri**: ActivityWatch tarafından toplanan yerel veriler (örneğin, pencere başlıkları, uygulama adları) `aw-server` tarafından işlenir ve kullanıcının tercihine göre yerel olarak veya Firestore'a senkronize edilerek depolanabilir. Bu veriler, ajanlar için bağlam sağlamak üzere kullanılabilir.
*   **Ajan Girişi**: Ajanlara beslenecek verilerin, kullanıcının gizlilik tercihleri dikkate alınarak toplandığından ve işlendiğinden emin olunmalıdır. Hassas veriler, cihaz üzerinde işlenmeli ve yalnızca gerekli olan toplanmış veya anonimleştirilmiş veriler buluta gönderilmelidir.
*   **API Anahtarı Yönetimi**: Gemini API anahtarı doğrudan istemci tarafında veya Python arka ucunda (ActivityWatch sunucusu) saklanmaz. Bunun yerine, Firebase Fonksiyonları Ortam Değişkenleri aracılığıyla güvenli bir şekilde yönetilir ve yalnızca `aw-server`'daki güvenli API uç noktasına gönderilir.
*   **Gizlilik Fonksiyonları**: Henüz tam olarak uygulanmamış olsa da, sistemin gelecekteki gelişiminde kullanıcı veri toplama ve işleme üzerinde ayrıntılı kontrol sağlayan gizlilikle ilgili fonksiyonlar (örneğin, veri saklama politikaları, veri anonimleştirme hizmetleri, kullanıcı onayı yönetimi) entegre edilecektir. Bu entegrasyon, bu tür mekanizmaların uygulanması için gerekli altyapıyı sağlar.

## Kullanıcı Arayüzü Entegrasyonu (Gelecek Adımlar)

*   **`PeakActivityMain/aw-server/aw-webui/src/`**: Kullanıcı arayüzü (Vue.js tabanlı), ajanları yapılandırmak, tetiklemek ve çıktılarını görüntülemek için yeni bileşenler içerecek şekilde yeniden tasarlanacak veya genişletilecektir. Bu, şunları içerebilir:
    *   Ajan yapılandırmalarını (YAML/JSON) girmek için bir form.
    *   Bir ajanı belirli bir konuyla tetiklemek için bir düğme.
    *   Ajanın ilerlemesini ve çıktılarını görüntülemek için bir günlük veya gösterge tablosu.
    *   Ücretli abonelik seviyelerine göre ajan tetikleme sıklığını yapılandırma seçenekleri.

## Sonuç

Bu entegrasyon, PraisonAI AI Agent Builder'ı PeakActivityMain uygulamasına dahil etmek için temel altyapıyı oluşturmaktadır. Gizliliğe ve güvenli API anahtarı yönetimine odaklanarak, sistemin kullanıcı verilerini kullanarak akıllı ajanlar oluşturmasını ve çalıştırmasını sağlamaktadır. Gelecekteki geliştirmeler, kullanıcı arayüzü etkileşimini iyileştirecek ve gizlilikle ilgili daha gelişmiş işlevler sunacaktır. 