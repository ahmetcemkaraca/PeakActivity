---
applyTo: '**'
description: "PeakActivity proje bağlamı ve genel geliştirme yönergeleri"
---

# PeakActivity Proje Bağlamı

Bu dosya, PeakActivity projesinin genel bağlamını ve AI agent'ların takip etmesi gereken temel yönergeleri tanımlar.

## Proje Vizyonu

PeakActivity, ActivityWatch'ın güçlü veri toplama altyapısını kullanarak, kullanıcıların sadece zamanlarını nereye harcadıklarını görmelerini değil, aynı zamanda üretkenliklerini, odaklanma kalitelerini ve dijital refahlarını proaktif olarak artırmalarını sağlayan kapsamlı bir çözümdür.

## Hibrit Mimari Anlayışı

### Yerel-Öncelikli Veri İşleme
- Hassas veriler (pencere başlıkları, uygulama isimleri) yerel olarak işlenir
- Kullanıcı kontrolünde cloud sync
- Privacy-by-design yaklaşımı

### AI-Driven İçgörüler
- Edge AI: TensorFlow.js ile yerel sınıflandırma
- Cloud AI: Gemini/OpenAI ile gelişmiş analizler
- PraisonAI agents ile otomasyon

## Teknoloji Yığını

### Core Stack
- **ActivityWatch**: Veri toplama (Python)
- **Firebase**: Cloud infrastructure (TypeScript)
- **PraisonAI**: Agent framework (Python)
- **Vue.js 3**: Frontend (TypeScript)

### Development Environment
- **Node.js 18+**: JavaScript runtime
- **Python 3.9+**: Backend development
- **Firebase CLI**: Deployment ve emulator
- **Vite**: Frontend build tool

## Geliştirme Prensipleri

### 1. Kullanıcı Gizliliği Öncelikli
```typescript
// Her zaman gizlilik kontrolü yap
if (userSettings.privacyMode) {
  return processLocally(data);
} else {
  return processWithCloud(anonymizeData(data));
}
```

### 2. Progressive Enhancement
```typescript
// Temel özellik her zaman çalışmalı
const basicFeature = provideBasicFunctionality();
try {
  const enhancedFeature = await addAIEnhancement(basicFeature);
  return enhancedFeature;
} catch (error) {
  logger.warn('AI enhancement failed, using basic feature');
  return basicFeature;
}
```

### 3. Çok Dilli Yaklaşım
```vue
<!-- Asla hardcode string kullanma -->
<template>
  <h1>{{ $t('dashboard.welcome', { name: user.name }) }}</h1>
  <p>{{ $t('dashboard.activity_summary', { count: activities.length }) }}</p>
</template>
```

## Veri Akışı Anlayışı

### 1. Veri Toplama
ActivityWatch watchers → aw-server → Buckets/Events

### 2. Veri İşleme
Local processing → Firebase sync → AI analysis

### 3. İçgörü Üretimi
PraisonAI agents → Cloud Functions → User notifications

## Error Handling Standartları

### Graceful Degradation
```typescript
// AI servisi başarısız olursa fallback kullan
try {
  const aiResult = await aiService.analyze(data);
  return createSuccessResponse(aiResult);
} catch (error) {
  logger.error('AI analysis failed', error);
  const fallbackResult = createBasicAnalysis(data);
  return createFallbackResponse(fallbackResult);
}
```

### User-Friendly Messaging
```typescript
// Teknik hataları kullanıcı dostu mesajlara çevir
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'İnternet bağlantınızı kontrol edin',
  AI_SERVICE_DOWN: 'AI analizi geçici olarak kullanılamıyor',
  DATA_SYNC_FAILED: 'Veriler daha sonra senkronize edilecek'
};
```

## Performance Guidelines

### Resource Management
- CPU kullanımı < 5% (background processing)
- RAM kullanımı < 100MB (AI models)
- Network trafiği < 10MB/gün (cloud sync)
- Battery impact < 2% (mobile)

### Caching Strategy
```typescript
// Expensive operations için cache kullan
const cacheKey = `insights_${userId}_${timeRange}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const result = await expensiveOperation();
await cache.set(cacheKey, result, '1h');
return result;
```

## Security Mindset

### Data Classification
- **Public**: Aggregated, anonymized metrics
- **Internal**: User settings, preferences
- **Confidential**: Raw activity data, personal insights
- **Restricted**: Authentication tokens, API keys

### Secure Defaults
```typescript
// Varsayılan olarak en güvenli seçenek
const defaultSettings = {
  dataRetention: '30days',
  cloudSync: false,
  aiAnalysis: 'local-only',
  shareAnalytics: false
};
```

## Quality Assurance

### Code Review Checklist
- [ ] Gizlilik kontrolleri eklendi mi?
- [ ] Error handling uygulandı mı?
- [ ] i18n kullanıldı mı?
- [ ] Performance impact değerlendirildi mi?
- [ ] Tests yazıldı mı?

### Definition of Done
- Unit tests %80+ coverage
- Integration tests geçiyor
- Security review tamamlandı
- Performance benchmarks karşılanıyor
- Documentation güncellendi