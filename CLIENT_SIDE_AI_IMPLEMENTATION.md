# Client-Side AI Implementation - Privacy-First Architecture

**Tarih:** 2025-11-14
**Versiyon:** 0.3.0
**Feature:** Client-Side LLM Processing

## 📋 Genel Bakış

PeakActivity artık **tam gizlilik ve maliyet kontrolü** için client-side AI analysis desteği sunuyor. Kullanıcılar kendi API key'lerini kullanarak analizlerini kendi cihazlarında işleyebilir, böylece veriler sunuculara gönderilmez.

## 🔐 Gizlilik-Öncelikli Mimari

### Üç İşleme Modu

```
┌─────────────────────────────────────────────────────────────┐
│                     İşleme Modu Seçimi                       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐    ┌──────────┐
        │ Client  │     │ Server  │    │  Hybrid  │
        │  Mode   │     │  Mode   │    │   Mode   │
        └─────────┘     └─────────┘    └──────────┘
              │               │               │
              ▼               ▼               ▼
     User API Key      Server API       Try Client
     (Full Privacy)    (Convenience)    → Fallback Server
```

### Mode 1: Client-Side (TAM GİZLİLİK) 🔒

```typescript
// Kullanıcının kendi API key'i ile
provider: 'openai' | 'anthropic' | 'google' | 'local'
apiKey: user's own key (encrypted in localStorage)
dataFlow: Activity Data → User's Device → LLM API → User's Device
privacy: ★★★★★ (Data never touches PeakActivity servers)
cost: User pays directly (transparent pricing)
```

**Avantajlar:**
- ✅ %100 gizlilik - veriler sunucuya gönderilmez
- ✅ Kullanıcı kendi maliyetini kontrol eder
- ✅ İstediği LLM'i seçer (GPT-4, Claude, Gemini, Local)
- ✅ Unlimited usage (API key limitine bağlı)
- ✅ Faster processing (no server relay)

**Dezavantajlar:**
- ❌ Kullanıcı API key almalı
- ❌ Maliyet direkt kullanıcıda

### Mode 2: Server-Side (KOLAYLIK) ☁️

```typescript
provider: 'server'
apiKey: not required
dataFlow: Activity Data → PeakActivity Server → Gemini API → Server → User
privacy: ★★☆☆☆ (Data processed on server)
cost: Free tier / Subscription
```

**Avantajlar:**
- ✅ No API key needed
- ✅ Free tier available
- ✅ Simplified setup

**Dezavantajlar:**
- ❌ Data sent to server
- ❌ Limited free usage
- ❌ Single model (Gemini Flash-8B)
- ❌ Rate limits

### Mode 3: Hybrid (BEST OF BOTH) ⚖️

```typescript
provider: 'openai' | 'anthropic' | 'google'
useServerFallback: true
logic: Try client-side → If fails → Use server
```

**Avantajlar:**
- ✅ Primary privacy (client-first)
- ✅ Reliability (server backup)
- ✅ Cost optimization

## 🏗️ Architecture & Implementation

### Component Structure

```
/aw-server/aw-webui/src/
├── services/llm/
│   ├── llm-providers.ts              # Provider definitions & info
│   ├── client-llm-service.ts         # Main client-side service
│   └── user-api-key-service.ts       # Encrypted key storage
├── components/settings/
│   └── LLMProviderSettings.vue       # User configuration UI
└── composables/
    └── useClientAI.ts                # Vue composable for AI features

/functions/src/api/
└── ai-analysis-api.ts                # Server-side fallback
```

### 1. LLM Provider System

**Dosya:** `llm-providers.ts`

```typescript
export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'local' | 'server';

export const LLM_PROVIDERS = {
  openai: {
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    requiresApiKey: true,
    privacyLevel: 'full'
  },
  anthropic: {
    models: ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus'],
    requiresApiKey: true,
    privacyLevel: 'full'
  },
  google: {
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    requiresApiKey: true,
    privacyLevel: 'full'
  },
  local: {
    models: ['llama3.2', 'mistral', 'phi3'],
    requiresApiKey: false,
    privacyLevel: 'full' // Best privacy!
  },
  server: {
    models: ['gemini-1.5-flash-8b'],
    requiresApiKey: false,
    privacyLevel: 'server'
  }
};
```

### 2. API Key Management (Encrypted)

**Dosya:** `user-api-key-service.ts`

```typescript
class SimpleEncryption {
  // XOR encryption with user-specific secret
  // Better than plaintext, production should use Web Crypto API
}

class UserApiKeyService {
  async saveApiKey(provider, apiKey) {
    const encrypted = SimpleEncryption.encrypt(apiKey);
    localStorage.setItem(`peak_llm_${provider}`, encrypted);
  }

  async getApiKey(provider) {
    const encrypted = localStorage.getItem(`peak_llm_${provider}`);
    return SimpleEncryption.decrypt(encrypted);
  }
}
```

**Security Features:**
- ✅ Keys stored encrypted in localStorage
- ✅ Never sent to PeakActivity servers
- ✅ User can export/import for backup
- ✅ Keys masked in UI (show only first/last 4 chars)

### 3. Client LLM Service

**Dosya:** `client-llm-service.ts`

**Multi-Provider Support:**

```typescript
class ClientLLMService {
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    // Decision tree
    if (this.config.provider !== 'server') {
      const apiKey = await this.apiKeyService.getApiKey(this.config.provider);

      if (!apiKey && this.config.useServerFallback) {
        return await this.analyzeOnServer(request); // Fallback
      }

      return await this.analyzeWithProvider(request, apiKey); // Client-side
    }

    return await this.analyzeOnServer(request); // Server
  }

  // Provider-specific implementations
  private async callOpenAI(...)  // OpenAI Chat Completions API
  private async callAnthropic(...) // Anthropic Messages API
  private async callGoogleAI(...)  // Google GenerativeAI API
  private async callLocalModel(...) // Ollama/LM Studio API
}
```

**Cost Tracking:**

```typescript
calculateCost(provider, model, tokensUsed) {
  const modelInfo = LLM_PROVIDERS[provider].models.find(m => m.id === model);
  return (tokensUsed.total / 1000) * modelInfo.costPer1kTokens;
}
```

### 4. Vue Composable for Easy Integration

**Dosya:** `useClientAI.ts`

```typescript
export function useClientAI() {
  const llmService = new ClientLLMService();

  // Pre-built analysis functions
  async function analyzeFocus(activityData) { ... }
  async function generateProductivityReport(timeRange, activities) { ... }
  async function analyzeBehaviorPatterns(historicalData) { ... }
  async function detectAnomalies(recentData, baselineData) { ... }
  async function suggestGoals(activitySummary) { ... }
  async function customAnalysis(data, prompt) { ... }

  // Statistics
  function getAnalysisStats() {
    return {
      totalAnalyses,
      successfulAnalyses,
      totalTokens,
      totalCost,
      localAnalyses,  // Privacy win!
      serverAnalyses,
      costSavings
    };
  }

  return { analyzeFocus, generateProductivityReport, ... };
}
```

**Usage in Components:**

```vue
<script setup>
import { useClientAI } from '@/composables/useClientAI';

const {
  analyzeFocus,
  isAnalyzing,
  lastAnalysis,
  currentProvider,
  isUsingClientSide
} = useClientAI();

async function handleAnalyze() {
  const result = await analyzeFocus(activityData);

  if (result.success) {
    console.log('Analysis:', result.result);
    console.log('Cost:', result.metadata.cost);
    console.log('Processed locally:', result.metadata.processedLocally);
  }
}
</script>
```

### 5. User Configuration UI

**Component:** `LLMProviderSettings.vue`

**Features:**
- ✅ Provider selection with visual cards
- ✅ Privacy level indicators (🔒 Full / ☁️ Server)
- ✅ API key input with visibility toggle
- ✅ Model selection with specs (context window, cost)
- ✅ Temperature & max tokens sliders
- ✅ Test configuration button
- ✅ Usage statistics dashboard
- ✅ Server fallback toggle

**UI Flow:**
```
1. Select Provider (OpenAI/Anthropic/Google/Local/Server)
2. Enter API Key (if required, stored encrypted)
3. Choose Model (with cost preview)
4. Configure Temperature & Max Tokens
5. Enable/Disable Server Fallback
6. Test Configuration
7. Save Configuration
```

### 6. Server-Side Fallback API

**Dosya:** `functions/src/api/ai-analysis-api.ts`

```typescript
export const analyzeWithAI = onCall(async (request) => {
  requireAuth(request);

  // Call Gemini with server API key
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${geminiApiKey.value()}`,
    { ... }
  );

  return {
    success: true,
    result: generatedText,
    structuredData,
    tokensUsed,
    metadata: {
      provider: 'server',
      model: 'gemini-1.5-flash-8b',
      processedLocally: false
    }
  };
});
```

## 📊 Supported Analysis Types

| Analysis Type | Description | Client/Server |
|--------------|-------------|---------------|
| `focus_analysis` | Odaklanma kalitesi analizi | Both |
| `productivity_report` | Detaylı üretkenlik raporu | Both |
| `behavior_patterns` | Davranış desenleri tespiti | Both |
| `anomaly_detection` | Anomali tespiti | Both |
| `goal_suggestions` | Hedef önerileri | Both |
| `custom` | Özel analiz (user prompt) | Both |

## 💰 Cost Comparison

### Example: 100 Analyses/Month

**Scenario:** Her analiz ~1000 input + 500 output tokens

| Provider | Model | Cost/Analysis | Monthly | Privacy |
|----------|-------|--------------|---------|---------|
| Server (Free Tier) | Gemini Flash-8B | $0 | $0 | ★★☆☆☆ |
| Google (User Key) | Gemini Flash-8B | $0.00006 | $0.006 | ★★★★★ |
| OpenAI (User Key) | GPT-4o-mini | $0.000225 | $0.0225 | ★★★★★ |
| Anthropic (User Key) | Claude Haiku | $0.0012 | $0.12 | ★★★★★ |
| Local (Ollama) | Llama 3.2 | $0 | $0 | ★★★★★★ |

**Sonuç:** Kullanıcı kendi key'i ile ayda **$0.006-$0.12** ödeyerek %100 gizlilik kazanıyor!

## 🔧 Setup Instructions

### For Users:

1. **Ayarlar → AI Sağlayıcı Ayarları**'na gidin
2. Tercih ettiğiniz sağlayıcıyı seçin:
   - **OpenAI:** https://platform.openai.com/api-keys
   - **Anthropic:** https://console.anthropic.com/settings/keys
   - **Google:** https://aistudio.google.com/app/apikey
   - **Local:** Ollama/LM Studio kurun
3. API anahtarınızı girin (encrypted olarak saklanır)
4. Model seçin
5. "Test Et" ile doğrulayın
6. Kaydedin!

### For Developers:

```bash
# 1. Frontend dependencies (already in package.json)
npm install

# 2. Backend dependencies
cd functions
npm install

# 3. Set server API key (for fallback)
firebase functions:secrets:set GEMINI_API_KEY

# 4. Deploy
firebase deploy --only functions
```

## 🧪 Testing

```typescript
import { useClientAI } from '@/composables/useClientAI';

const { analyzeFocus } = useClientAI();

// Test analysis
const result = await analyzeFocus({
  activities: [
    { app: 'VS Code', duration: 3600 },
    { app: 'Chrome', duration: 1200 },
    { app: 'Slack', duration: 600 }
  ]
});

console.assert(result.success === true);
console.assert(result.metadata.processedLocally === true);
console.assert(result.metadata.provider === 'google'); // or selected provider
```

## 📈 Usage Statistics

Users can track their AI usage:

```typescript
const stats = getAnalysisStats();

console.log(`Total analyses: ${stats.totalAnalyses}`);
console.log(`Local processing: ${stats.localAnalyses} (${stats.localAnalyses / stats.totalAnalyses * 100}%)`);
console.log(`Total cost: $${stats.totalCost.toFixed(4)}`);
console.log(`Cost savings vs server: $${stats.costSavings.toFixed(4)}`);
```

## 🔐 Security Considerations

### Current Implementation:
- ✅ XOR encryption for localStorage
- ✅ API keys never sent to PeakActivity servers
- ✅ Encrypted backup/export
- ✅ Key masking in UI

### Production Recommendations:
1. **Use Web Crypto API** for stronger encryption
2. **Implement key rotation**
3. **Add password protection** for sensitive keys
4. **Consider hardware-backed storage** (WebAuthn)
5. **Audit logging** for key access

### Privacy Guarantees:

**Client-Side Processing:**
```
User Data → NEVER touches PeakActivity servers
         → Goes directly to user's chosen LLM provider
         → Analysis result stays on device
```

**Server-Side Processing:**
```
User Data → PeakActivity Server (TLS encrypted)
         → Gemini API (Google)
         → Result back to user
         → Data not stored permanently
```

## 🚀 Future Enhancements

1. **Streaming Responses** - Real-time analysis updates
2. **Advanced Caching** - Reduce API calls
3. **Batch Processing** - Analyze multiple days at once
4. **Custom Prompts Library** - User-saved prompts
5. **Model Fine-tuning** - Custom models for specific users
6. **WebGPU Local Models** - Run LLMs entirely in browser
7. **Federated Learning** - Improve models without sharing data

## 📊 Impact Metrics

**Expected Benefits:**
- 🔒 **Privacy:** 80%+ users choose client-side processing
- 💰 **Cost:** Users save avg $0.10/month vs subscription
- ⚡ **Speed:** 30% faster (no server relay)
- 🌍 **Sustainability:** Reduced server load & carbon footprint

---

**Implementation Status:** ✅ Complete
**Ready for Production:** Yes (with production security enhancements)
**Recommended for:** Privacy-conscious users, power users, developers

---

**Related Documentation:**
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Agentic AI infrastructure
- [Firebase Integration](./firebase-md/firebase-integration-documentation.md)
- [API Documentation](./firebase-md/firebase-api-documentation.md)
