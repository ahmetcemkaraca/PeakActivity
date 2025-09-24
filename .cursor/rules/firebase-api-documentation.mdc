# Firebase API ve Fonksiyon Dokümantasyonu

Bu belge, PeakActivity projesindeki tüm Firebase Cloud Functions API uç noktalarını ve arka plan fonksiyonlarını detaylandırmaktadır. Amaç, mevcut API'lerin ve fonksiyonların kapsamlı bir görünümünü sunmak, giriş/çıkış formatlarını, hata senaryolarını ve işlevlerini açıklamaktır.

## 1. Genel API Yanıt ve Hata Mesajı Standartları

Tüm API uç noktaları, `firebase-md/api-response-standards.md` belgesinde tanımlanan standart `ApiResponse` ve `ErrorResponse` formatlarına uymalıdır.

## 2. Fonksiyon Kaynak Dizini

Firebase fonksiyonları `functions/src/index.ts` dosyasından dışa aktarılır ve `functions/src/api/` altındaki API dosyalarından ile `functions/src/triggers/` altındaki tetikleyici dosyalarından fonksiyonları içe aktarır.

## 3. Core ActivityWatch Veri Modeli Analizi (Firebase Uç Noktaları İçin)

### 3.1 Event Model
```typescript
interface AWEvent {
  id?: string | number;           // Optional, auto-generated
  timestamp: string;              // ISO8601 formatted timestamp
  duration: number;               // Duration in seconds
  data: Record<string, any>;      // Flexible data object
}
```

### 3.2 Bucket Model
```typescript
interface AWBucket {
  id: string;                     // Bucket identifier
  type: string;                   // Event type (afk.status, window.title, etc.)
  client: string;                 // Client identifier
  hostname: string;               // Device hostname
  created: string;                // ISO8601 creation timestamp
  name?: string;                  // Optional bucket name
  data?: Record<string, any>;     // Optional metadata
  last_updated?: string;          // Last event timestamp
}
```

## 4. Firebase Veri Yapısı Tasarımı (Uç Noktaları İçin)

### 4.1 Firestore Collections Yapısı
```
/buckets/{bucketId}
  - metadata: AWBucket
  - events/{eventId}: AWEvent
  - stats/summary: BucketStats
  
/users/{userId}/buckets/{bucketId}  // Multi-tenant support
  - metadata: AWBucket
  - events/{eventId}: AWEvent
  
/devices/{deviceId}
  - hostname: string
  - device_id: string
  - last_seen: timestamp
  - buckets: string[]             // Bucket references
```

### 4.2 Firebase Event Document
```typescript
interface FirebaseEvent {
  // Core fields
  id: string;                     // Firebase auto-generated ID
  timestamp: FirebaseFirestore.Timestamp;
  duration: number;               // Seconds as number
  data: Record<string, any>;
  
  // Firebase-specific fields
  bucket_id: string;              // Parent bucket reference
  device_id: string;              // Device identifier
  created_at: FirebaseFirestore.Timestamp;
  updated_at?: FirebaseFirestore.Timestamp;
  
  // Indexing fields (for query optimization)
  date_key: string;               // YYYY-MM-DD format for daily queries
  hour_key: string;               // YYYY-MM-DD-HH for hourly queries
  type: string;                   // Event type from bucket
}
```

## 5. API Uç Noktaları (`functions/src/api/`)

### `activity-api.ts`
- **Uç Noktası**: `saveActivity`
  - **Tanım**: Kullanıcı aktivite verilerini (uygulama kullanımı, pencere başlıkları vb.) Firebase Firestore'a kaydeder.
  - **HTTP Metodu**: `onCall` (Firebase Callable Function)
  - **Giriş Parametreleri**:
    - `activityData`: `ActivityEvent` (Bkz. `functions/src/types/activity-event.d.ts` dosyasındaki tanım).
      - `id`: `string` (Firebase Firestore belge ID'si)
      - `timestamp_start`: `string` (ISO 8601 formatında başlangıç zamanı)
      - `timestamp_end`: `string` (ISO 8601 formatında bitiş zamanı)
      - `duration_sec`: `number` (Aktivite süresi saniye cinsinden)
      - `app`: `string` (Uygulama adı)
      - `title`: `string` (Pencere başlığı veya aktivite açıklaması)
      - `category?`: `string` (Kategori her zaman mevcut olmayabilir)
      - `window_change_count`: `number` (Pencere değişim sayısı, Odak Kalitesi Skoru için)
      - `input_frequency`: `number` (Giriş sıklığı, Odak Kalitesi Skoru için)
      - `is_afk`: `boolean` (AFK (Away From Keyboard) durumu)
      - `url?`: `string` (URL özelliği eklendi)
  - **Çıkış Formatı**:
    ```json
    {
      "status": "success",
      "data": { /* Kaydedilen aktivite belgesinin verileri veya ID'si */ }
    }
    ```
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `getActivities`
  - **Tanım**: Kullanıcının aktivite etkinliklerini belirli kriterlere göre alır.
  - **HTTP Metodu**: HTTP GET (muhtemelen `onCall` içinde simüle edilmiştir)
  - **Giriş Parametreleri**: `userId`, `startDate`, `endDate`, `category` gibi filtreleme parametreleri.
  - **Çıkış Formatı**: Filtrelenen aktivite etkinliklerinin listesi.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

- **Uç Noktası**: `createActivity`
  - **Tanım**: Yeni bir aktivite etkinliği oluşturur.
  - **HTTP Metodu**: HTTP POST (muhtemelen `onCall` içinde simüle edilmiştir)
  - **Giriş Parametreleri**: Yeni aktivite verileri.
  - **Çıkış Formatı**: Oluşturulan aktivite ID'si.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

- **Uç Noktası**: `updateActivity`
  - **Tanım**: Mevcut bir aktivite etkinliğini günceller.
  - **HTTP Metodu**: HTTP PUT (muhtemelen `onCall` içinde simüle edilmiştir)
  - **Giriş Parametreleri**: `activityId` ve güncellenecek aktivite verileri.
  - **Çıkış Formatı**: Güncelleme durumu.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `deleteActivity`
  - **Tanım**: Bir aktivite etkinliğini siler.
  - **HTTP Metodu**: HTTP DELETE (muhtemelen `onCall` içinde simüle edilmiştir)
  - **Giriş Parametreleri**: `activityId`.
  - **Çıkış Formatı**: Silme durumu.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

### `anomaly-detection-api.ts`
- **Uç Noktası**: `detectAnomalies`
  - **Tanım**: Kullanıcının günlük aktivite verilerindeki anormal kalıpları tespit eder ve bir anomali tespit edildiğinde bildirim gönderir.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**:
    - `dailyTotals`: `Array<DailyTotal>` (Günlük toplam aktivite verileri)
      - `date`: `string` (YYYY-MM-DD formatında tarih)
      - `total_seconds`: `number` (O güne ait toplam aktivite süresi saniye cinsinden)
  - **Çıkış Formatı**: Tespit edilen anomaliler, temel ortalama ve standart sapma, açıklama.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `getAnomalyAlerts`
  - **Tanım**: Belirli bir kullanıcı için geçmiş anomali uyarılarını getirir.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**: Yok (Kullanıcı ID'si `context.auth.uid` üzerinden alınır.)
  - **Çıkış Formatı**: Anomali uyarılarının listesi.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

- **Uç Noktası**: `detectAnomaly` (functions/src/api/anomaly-detection-api.ts içindeki farklı bir tanım, `detectAnomalies` ile aynı amaca hizmet ediyor olabilir. Tekrar incelenmeli.)
  - **Tanım**: Kullanıcı aktivite verilerindeki anormal kalıpları tespit eder.
  - **Tetikleyici**: HTTP POST isteği.
  - **Giriş**: Belirli bir zaman aralığındaki kullanıcı aktivite verileri.
  - **Çıkış**: Tespit edilen anormalliklerin listesi veya bir anormallik puanı.
  - **İşlev**: Kullanıcı aktivite verilerindeki anormal kalıpları tespit eder.

### `activity-query-api.ts`
- **Uç Noktası**: `queryActivities`
  - **Tanım**: Kullanıcı etkinlik verilerini gelişmiş filtreleme ve arama seçenekleriyle sorgular.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**:
    - `data`: `QueryOptions` (Sorgulama seçenekleri)
      - `userId`: `string` (Kullanıcı ID'si, otomatik olarak `context.auth.uid`'den eklenir)
      - `keywords?`: `string` (Anahtar kelime araması)
      - `startDate?`: `number` (Başlangıç Unix zaman damgası)
      - `endDate?`: `number` (Bitiş Unix zaman damgası)
      - `categories?`: `string[]` (Kategori filtrelemesi)
      - `appNames?`: `string[]` (Uygulama adı filtrelemesi)
      - `minDuration?`: `number` (Minimum aktivite süresi saniye cinsinden)
      - `maxDuration?`: `number` (Maksimum aktivite süresi saniye cinsinden)
      - `limit?`: `number` (Dönen sonuç sayısı limiti)
      - `offset?`: `number` (Atlanacak sonuç sayısı)
      - `sortBy?`: `string` (Sıralama alanı, örn: "timestamp_start")
      - `sortOrder?`: `'asc' | 'desc'` (Sıralama yönü)
  - **Çıkış Formatı**: Filtrelenen aktivite etkinlikleri ve toplam sonuç sayısı.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

### `behavioral-analysis-api.ts`
- **Uç Noktası**: `analyzeRealtimeBehavioralPattern`
  - **Tanım**: Tek bir aktivite olayını (`ActivityEvent`) kullanarak gerçek zamanlı davranışsal örüntü analizi yapar.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**: `activityEvent` (Tekil aktivite olayı).
  - **Çıkış Formatı**: Tespit edilen örüntü türü, açıklaması, güven skoru ve model versiyonu.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `analyzeBehavioralPatterns` (functions/src/api/behavioral-analysis-api.ts içindeki farklı bir tanım, `analyzeRealtimeBehavioralPattern` ile aynı amaca hizmet ediyor olabilir. Tekrar incelenmeli.)
  - **Tanım**: Kullanıcı aktivite verilerindeki davranışsal kalıpları ve eğilimleri analiz eder.
  - **Tetikleyici**: HTTP POST isteği.
  - **Giriş**: Belirli bir zaman aralığındaki kullanıcı aktivite verileri.
  - **Çıkış**: Tespit edilen davranışsal kalıpların ve eğilimlerin analizi.

### `goal-management-api.ts`
- **Uç Noktası**: `createGoal`
  - **Tanım**: Yeni bir kullanıcı hedefi oluşturur.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**: `name`, `description`, `targetValue`, `currentValue`, `startDate`, `endDate`, `category`.
  - **Çıkış Formatı**: Oluşturulan hedef nesnesi.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `getGoal`
  - **Tanım**: Belirli bir hedefi getirir.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**: `goalId`.
  - **Çıkış Formatı**: Hedef nesnesi.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `updateGoal`
  - **Tanım**: Mevcut bir hedefi günceller.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**: `goalId`, `updates`.
  - **Çıkış Formatı**: Güncellenmiş hedef nesnesi.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `deleteGoal`
  - **Tanım**: Bir hedefi siler.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**: `goalId`.
  - **Çıkış Formatı**: Başarı durumu.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `listGoals`
  - **Tanım**: Tüm kullanıcı hedeflerini listeler.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**: Yok (Kullanıcı ID'si `context.auth.uid` üzerinden alınır.)
  - **Çıkış Formatı**: Hedef nesnelerinin listesi.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

- **Uç Noktası**: `manageGoalProgress` (functions/src/api/goal-management-api.ts içindeki ek bir tanım)
  - **Tanım**: Kullanıcı hedeflerinin ilerlemesini yönetir ve günceller.
  - **Tetikleyici**: HTTP POST isteği.
  - **Giriş**: `goalId`, `progressUpdate`, `timestamp`.
  - **Çıkış**: Güncellenmiş hedef durumu.

### `google-calendar-api.ts`
- **Uç Noktası**: `getGoogleCalendarEvents`
  - **Tanım**: Kullanıcının Google Takvim etkinliklerini belirli bir zaman aralığı için çeker.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**: `timeMin`, `timeMax`, `calendarId?`.
  - **Çıkış Formatı**: Google Takvim etkinliklerinin listesi.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `createGoogleCalendarEvent`
  - **Tanım**: Google Takvim'de yeni bir etkinlik oluşturur.
  - **HTTP Metodu**: `onCall`
  - **Giriş Parametreleri**: `event`, `calendarId?`.
  - **Çıkış Formatı**: Oluşturulan etkinlik nesnesi.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

### `ai-insight-api.ts`
- **Uç Noktası**: `generateInsight`
  - **Tanım**: Kullanıcı aktivite verilerine dayanarak yapay zeka içgörüleri oluşturur.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: Kullanıcının aktivite verileri veya özetleri, `insightType` (örneğin, "productivity", "focus").
  - **Çıkış**: Oluşturulan yapay zeka tabanlı içgörü metni veya yapılandırılmış veri.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

### `ai-notification-api.ts`
- **Uç Noktası**: `sendAINotification`
  - **Tanım**: Yapay zeka tarafından tetiklenen bildirimleri kullanıcılara gönderir.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: `userId`, `message`, `notificationType` (örneğin, "focus_reminder", "break_suggestion").
  - **Çıkış**: Bildirim gönderme durumu.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

### `auto-categorization-api.ts`
- **Uç Noktası**: `categorizeActivity`
  - **Tanım**: Verilen aktivite verilerini kullanarak otomatik olarak bir kategori atar.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: `activityData` (örneğin, URL, uygulama adı, pencere başlığı).
  - **Çıkış**: Otomatik olarak atanan kategori.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

- **Uç Noktası**: `getCategorySuggestions`
  - **Tanım**: Kullanıcı girişine veya geçmiş aktivitelere göre kategori önerileri sunar.
  - **HTTP Metodu**: HTTP GET isteği.
  - **Giriş**: `query` (kullanıcının arama sorgusu).
  - **Çıkış**: Olası kategori önerilerinin listesi.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

### `automatic-event-api.ts`
- **Uç Noktası**: `processAutomaticEvent`
  - **Tanım**: Otomatik olarak toplanan ham etkinlik verilerini işler ve kaydeder.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: Otomatik olarak toplanan etkinlik verileri (örneğin, uygulama kullanımı, pencere değişimi).
  - **Çıkış**: İşleme durumu.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

### `automation-rule-api.ts`
- **Uç Noktası**: `createAutomationRule`
  - **Tanım**: Yeni bir otomasyon kuralı oluşturur.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: `ruleName`, `conditions`, `actions`, `userId` gibi otomasyon kuralı tanımlarını içeren bir JSON nesnesi.
  - **Çıkış**: Oluşturulan kuralın ID'si.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `getAutomationRules`
  - **Tanım**: Kullanıcının otomasyon kurallarını alır.
  - **HTTP Metodu**: HTTP GET isteği.
  - **Giriş**: `userId` (isteğe bağlı).
  - **Çıkış Formatı**: Otomasyon kurallarının listesi.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

- **Uç Noktası**: `updateAutomationRule`
  - **Tanım**: Mevcut bir otomasyon kuralını günceller.
  - **HTTP Metodu**: HTTP PUT isteği.
  - **Giriş**: `ruleId`, `updates`.
  - **Çıkış**: Güncelleme durumu.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `deleteAutomationRule`
  - **Tanım**: Bir otomasyon kuralını siler.
  - **HTTP Metodu**: HTTP DELETE isteği.
  - **Giriş**: `ruleId`.
  - **Çıkış**: Silme durumu.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

### `community-rules-api.ts`
- **Uç Noktası**: `getCommunityRules`
  - **Tanım**: Topluluk tarafından oluşturulan kategori ve otomasyon kurallarını alır.
  - **HTTP Metodu**: HTTP GET isteği.
  - **Giriş**: `category` (isteğe bağlı), `searchQuery` (isteğe bağlı).
  - **Çıkış**: Topluluk tarafından oluşturulan kuralların listesi.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

- **Uç Noktası**: `submitCommunityRule`
  - **Tanım**: Kullanıcıların yeni topluluk kuralları göndermesine izin verir.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: Yeni topluluk kuralı verileri (örneğin, `ruleDefinition`, `suggestedCategory`).
  - **Çıkış**: Gönderme durumu.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

### `contextual-categorization-api.ts`
- **Uç Noktası**: `categorizeByContext`
  - **Tanım**: Aktivite verilerini ek bağlamsal bilgilerle birlikte kullanarak daha doğru kategorizasyon sağlar.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: `activityData`, `contextualInfo` (örneğin, günün saati, konum, takvim etkinlikleri).
  - **Çıkış**: Bağlama göre atanmış kategori.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

### `custom-event-api.ts`
- **Uç Noktası**: `createCustomEvent`
  - **Tanım**: Kullanıcıların manuel olarak özel etkinlikler oluşturmasına izin verir.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: `eventName`, `details`, `timestamp`, `userId` gibi özel etkinlik verileri.
  - **Çıkış**: Oluşturulan özel etkinliğin ID'si.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `getCustomEvents`
  - **Tanım**: Kullanıcı tarafından oluşturulan özel etkinlikleri alır.
  - **HTTP Metodu**: HTTP GET isteği.
  - **Giriş**: `userId`, `startDate`, `endDate`, `eventName` gibi filtreleme parametreleri.
  - **Çıkış**: Özel etkinliklerin listesi.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

### `focus-mode-api.ts`
- **Uç Noktası**: `startFocusMode`
  - **Tanım**: Kullanıcı için odaklanma modunu başlatır, dikkat dağıtıcıları engeller.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: `userId`, `duration`, `blockedApps`, `blockedWebsites`.
  - **Çıkış**: Odaklanma modunun başlangıç durumu.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

- **Uç Noktası**: `endFocusMode`
  - **Tanım**: Odaklanma modunu sonlandırır.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: `userId`.
  - **Çıkış**: Odaklanma modunun bitiş durumu.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

### `focus-quality-score-api.ts`
- **Uç Noktası**: `calculateFocusQualityScore`
  - **Tanım**: Kullanıcının odaklanma seviyesini ve kalitesini değerlendiren bir puan hesaplar.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: Belirli bir zaman aralığındaki kullanıcı aktivite verileri.
  - **Çıkış**: Odaklanma kalitesi puanı (sayısal değer).
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

### `insight-generation-api.ts`
- **Uç Noktası**: `generateComprehensiveInsight`
  - **Tanım**: Çeşitli veri noktalarını birleştirerek kapsamlı yapay zeka içgörüleri oluşturur.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: Çok çeşitli kullanıcı aktivite verileri, hedef ilerlemesi ve davranışsal analiz sonuçları.
  - **Çıkış**: Birden fazla kaynaktan toplanan verilere dayalı kapsamlı bir içgörü raporu.
  - **Hata Senaryoları**: `unauthenticated`, `internal`.

### `ml-data-api.ts`
- **Uç Noktası**: `submitMLData`
  - **Tanım**: Makine öğrenimi modellerini eğitmek için veri toplar.
  - **HTTP Metodu**: HTTP POST isteği.
  - **Giriş**: Makine öğrenimi modellerini eğitmek için ham veya işlenmiş veri noktaları (örneğin, etiketli aktivite verileri).
  - **Çıkış**: Veri gönderme durumu.
  - **Hata Senaryoları**: `unauthenticated`, `invalid-argument`, `internal`.

### 6. Cloud Functions Endpoints (Yeniden Tasarım Detayları)

Bu bölümde, ActivityWatch API'sinin Firebase Cloud Functions üzerindeki yeniden tasarlanmış uç noktaları ve bunların işleyişi hakkında daha derinlemesine bilgi bulunmaktadır.

#### 6.1 Server Info Endpoint
```typescript
// api/info.ts
import { onCall } from 'firebase-functions/v2/https';
import { requireAuth } from '../utils/auth'; // Varsayımsal auth middleware

export const getServerInfo = onCall(requireAuth(async (data, context, user) => {
  const serverInfo = {
    version: '0.13.0-firebase',
    hostname: 'firebase-cloud',
    testing: false,
    device_id: await getOrCreateDeviceId(user.uid, data.deviceId),
    userId: user.uid,
    features: {
      realtime: true,
      multiDevice: true,
      cloudSync: true,
      analytics: true
    },
    limits: {
      events_per_day: user.customClaims?.premium ? 100000 : 10000,
      buckets_per_user: user.customClaims?.premium ? 50 : 10,
      queries_per_day: user.customClaims?.premium ? 1000 : 100
    }
  };
  
  return serverInfo;
}));

// getOrCreateDeviceId ve checkDeviceLimit fonksiyonları auth.ts veya benzeri bir utils dosyasında olmalıdır.
async function getOrCreateDeviceId(userId: string, clientDeviceId?: string): Promise<string> {
  // ... implementasyon (Firebase Server Integration belgesinden alınabilir) ...
  return clientDeviceId || `firebase-${userId}-${Date.now()}`;
}
```

#### 6.2 Bucket Management

##### GET /api/0/buckets
```typescript
export const getBuckets = functions.https.onRequest(async (req, res) => {
  // ... mevcut firebase-endpoints-redesign.md içeriği ...
  // Firestore'dan bucket'ları çekme, last_updated hesaplama vb.
});
```

##### POST /api/0/buckets/{bucketId}
```typescript
export const createBucket = functions.https.onRequest(async (req, res) => {
  // ... mevcut firebase-endpoints-redesign.md içeriği ...
  // Yeni bucket oluşturma, "!local" hostname handling vb.
});
```

#### 6.3 Event Management

##### GET /api/0/buckets/{bucketId}/events
```typescript
export const getEvents = functions.https.onRequest(async (req, res) => {
  // ... mevcut firebase-endpoints-redesign.md içeriği ...
  // Event'ları filtreleme, sıralama, limit uygulama vb.
});
```

##### POST /api/0/buckets/{bucketId}/events
```typescript
export const createEvents = functions.https.onRequest(async (req, res) => {
  // ... mevcut firebase-endpoints-redesign.md içeriği ...
  // Event'ları toplu olarak oluşturma, FirebaseEvent dönüşümü vb.
});
```
<!-- Daha fazla uç nokta ve detay buraya eklenecek -->

## 7. Firestore Tetikleyicileri (`functions/src/triggers/firestore-triggers.ts`)

- **`onActivityCreate`**:
    *   **Tetikleyici**: Firestore'da `activities` koleksiyonuna yeni bir belge eklendiğinde.
    *   **Giriş**: Yeni aktivite belgesinin verileri.
    *   **Çıkış**: Yok (arka plan işlemi).
    *   **İşlev**: Yeni aktivite oluşturulduğunda belirli işlemleri tetikler (örneğin, AI analizi).

- **`onActivityUpdate`**:
    *   **Tetikleyici**: Firestore'da `activities` koleksiyonundaki bir belge güncellendiğinde.
    *   **Giriş**: Güncellenen aktivite belgesinin eski ve yeni verileri.
    *   **Çıkış**: Yok (arka plan işlemi).
    *   **İşlev**: Mevcut bir aktivite güncellendiğinde belirli işlemleri tetikler.

- **`onUserCreate`**:
    *   **Tetikleyici**: Yeni bir kullanıcı Auth'ta oluşturulduğunda.
    *   **Giriş**: Yeni kullanıcının verileri.
    *   **Çıkış**: Yok (arka plan işlemi).
    *   **İşlev**: Yeni kullanıcı kaydolduğunda varsayılan ayarları veya profilleri oluşturur.

- **`onUserDelete`**:
    *   **Tetikleyici**: Bir kullanıcı Auth'ta silindiğinde.
    *   **Giriş**: Silinen kullanıcının verileri.
    *   **Çıkış**: Yok (arka plan işlemi).
    *   **İşlev**: Bir kullanıcı silindiğinde ilgili tüm verileri temizler.

## 8. Uygulama Talimatları

Bu dokümanda açıklanan tüm API uç noktaları ve Firebase fonksiyonları, belirlenen giriş/çıkış formatlarına ve hata senaryolarına uygun olarak geliştirilmelidir. Özellikle API yanıt standartlarına (`firebase-md/api-response-standards.md`) tam uyum sağlanmalıdır. 