<template lang="pug">
.llm-provider-settings
  .settings-header
    h2 🤖 AI Sağlayıcı Ayarları
    p.subtitle Kendi API anahtarınızı kullanarak gizliliğinizi ve maliyetlerinizi kontrol edin

  .privacy-notice
    .notice-icon ⚠️
    .notice-content
      strong Gizlilik Öncelikli
      p
        | Kendi API anahtarınızı kullandığınızda, tüm analizler
        strong cihazınızda
        |  işlenir. Verileriniz sunucularımıza gönderilmez.

  .provider-selection
    h3 AI Sağlayıcı Seçimi
    .provider-cards
      .provider-card(
        v-for="provider in providers"
        :key="provider.id"
        :class="{ active: selectedProvider === provider.id, 'has-key': hasApiKey(provider.id) }"
        @click="selectProvider(provider.id)"
      )
        .provider-header
          .provider-icon {{ getProviderIcon(provider.id) }}
          .provider-name {{ provider.name }}
          .provider-badge(v-if="hasApiKey(provider.id)") ✓

        .provider-privacy
          .privacy-badge(:class="'privacy-' + provider.privacyLevel")
            | {{ getPrivacyLabel(provider.privacyLevel) }}

        .provider-models
          small {{ provider.models.length }} model mevcut

  template(v-if="selectedProvider")
    .provider-config
      h3 {{ selectedProviderInfo?.name }} Yapılandırması

      // API Key configuration
      template(v-if="selectedProviderInfo?.requiresApiKey")
        .form-group
          label API Anahtarı
          .api-key-input
            input(
              type="password"
              v-model="apiKeyInput"
              :placeholder="'API anahtarınızı girin'"
              @input="validateApiKey"
            )
            button.btn-visibility(@click="toggleApiKeyVisibility")
              | {{ showApiKey ? '👁️' : '👁️‍🗨️' }}

          .api-key-status(v-if="hasApiKey(selectedProvider)")
            .status-indicator.saved
              | ✓ Kaydedildi: {{ maskedApiKey }}
            button.btn-remove(@click="removeApiKey") Kaldır

          .setup-instructions
            small
              | 📝 {{ selectedProviderInfo.setupInstructions }}

      // Model selection
      .form-group
        label Model Seçimi
        select(v-model="selectedModel")
          option(
            v-for="model in selectedProviderInfo?.models"
            :key="model.id"
            :value="model.id"
          )
            | {{ model.name }} ({{ formatContextWindow(model.contextWindow) }})

        .model-info(v-if="selectedModelInfo")
          .info-row
            span Context Window:
            strong {{ formatContextWindow(selectedModelInfo.contextWindow) }}
          .info-row(v-if="selectedModelInfo.costPer1kTokens")
            span Maliyet:
            strong ${{ selectedModelInfo.costPer1kTokens.toFixed(4) }}/1K token

      // Advanced settings
      .form-group
        label Temperature
        input(
          type="range"
          v-model.number="temperature"
          min="0"
          max="2"
          step="0.1"
        )
        .value-display {{ temperature.toFixed(1) }}

      .form-group
        label Max Tokens
        input(
          type="number"
          v-model.number="maxTokens"
          min="100"
          max="8000"
          step="100"
        )

      .form-group
        label
          input(type="checkbox" v-model="useServerFallback")
          |  Sunucu yedekleme kullan (başarısız olursa)

      .actions
        button.btn-primary(@click="saveConfiguration" :disabled="!canSave")
          | 💾 Yapılandırmayı Kaydet
        button.btn-test(@click="testConfiguration" :disabled="!canTest")
          | 🧪 Test Et

  .usage-stats(v-if="usageStats")
    h3 📊 Kullanım İstatistikleri
    .stats-grid
      .stat-card
        .stat-value {{ usageStats.totalAnalyses }}
        .stat-label Toplam Analiz
      .stat-card
        .stat-value {{ formatTokens(usageStats.totalTokens) }}
        .stat-label Kullanılan Token
      .stat-card
        .stat-value ${{ usageStats.totalCost.toFixed(4) }}
        .stat-label Toplam Maliyet

  .testing-result(v-if="testResult")
    .result-header(:class="{ success: testResult.success, error: !testResult.success }")
      | {{ testResult.success ? '✅ Test Başarılı' : '❌ Test Başarısız' }}
    .result-content
      pre {{ testResult.message }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { LLMProviderManager, LLMProvider, LLMProviderInfo, LLMConfig } from '../../services/llm/llm-providers';
import { UserApiKeyService } from '../../services/llm/user-api-key-service';
import { ClientLLMService } from '../../services/llm/client-llm-service';

// Services
const apiKeyService = new UserApiKeyService();
const llmService = ref<ClientLLMService | null>(null);

// State
const providers = ref<LLMProviderInfo[]>([]);
const selectedProvider = ref<LLMProvider>('server');
const selectedModel = ref<string>('');
const apiKeyInput = ref<string>('');
const showApiKey = ref(false);
const temperature = ref(0.7);
const maxTokens = ref(2000);
const useServerFallback = ref(true);
const testResult = ref<{ success: boolean; message: string } | null>(null);
const usageStats = ref<any>(null);

// Computed
const selectedProviderInfo = computed(() => {
  return LLMProviderManager.getProvider(selectedProvider.value);
});

const selectedModelInfo = computed(() => {
  return selectedProviderInfo.value?.models.find(m => m.id === selectedModel.value);
});

const maskedApiKey = computed(() => {
  const key = apiKeyService.maskApiKey(apiKeyInput.value);
  return key;
});

const canSave = computed(() => {
  if (!selectedProvider.value) return false;

  if (selectedProviderInfo.value?.requiresApiKey) {
    return apiKeyInput.value.length > 0 && selectedModel.value.length > 0;
  }

  return selectedModel.value.length > 0;
});

const canTest = computed(() => canSave.value);

// Methods
function selectProvider(provider: LLMProvider) {
  selectedProvider.value = provider;

  // Load saved API key if exists
  apiKeyService.getApiKey(provider).then(key => {
    if (key) {
      apiKeyInput.value = key;
    } else {
      apiKeyInput.value = '';
    }
  });

  // Set recommended model
  selectedModel.value = LLMProviderManager.getRecommendedModel(provider);
}

function hasApiKey(provider: LLMProvider): boolean {
  return apiKeyService.hasApiKey(provider) || provider === 'server' || provider === 'local';
}

function validateApiKey() {
  // Real-time validation would go here
}

function toggleApiKeyVisibility() {
  showApiKey.value = !showApiKey.value;
  const input = document.querySelector('.api-key-input input') as HTMLInputElement;
  if (input) {
    input.type = showApiKey.value ? 'text' : 'password';
  }
}

async function removeApiKey() {
  if (confirm('API anahtarını kaldırmak istediğinizden emin misiniz?')) {
    await apiKeyService.removeApiKey(selectedProvider.value);
    apiKeyInput.value = '';
  }
}

async function saveConfiguration() {
  try {
    // Save API key if needed
    if (selectedProviderInfo.value?.requiresApiKey && apiKeyInput.value) {
      await apiKeyService.saveApiKey(selectedProvider.value, apiKeyInput.value);
    }

    // Save LLM config
    const config: LLMConfig = {
      provider: selectedProvider.value,
      model: selectedModel.value,
      temperature: temperature.value,
      maxTokens: maxTokens.value,
      useServerFallback: useServerFallback.value
    };

    apiKeyService.saveLLMConfig(config);

    // Update LLM service
    if (llmService.value) {
      llmService.value.updateConfig(config);
    }

    alert('✅ Yapılandırma başarıyla kaydedildi!');
  } catch (error: any) {
    alert('❌ Hata: ' + error.message);
  }
}

async function testConfiguration() {
  testResult.value = null;

  try {
    // Create test LLM service with current config
    const testService = new ClientLLMService({
      provider: selectedProvider.value,
      model: selectedModel.value,
      temperature: temperature.value,
      maxTokens: maxTokens.value,
      useServerFallback: false // Don't fallback during test
    });

    // Simple test analysis
    const result = await testService.analyze({
      type: 'custom',
      data: {},
      userPrompt: 'Say "Hello from PeakActivity!" and nothing else.',
      systemPrompt: 'You are a helpful assistant.',
      temperature: 0.1,
      maxTokens: 50
    });

    if (result.success) {
      testResult.value = {
        success: true,
        message: `Test başarılı!\n\nYanıt: ${result.result}\n\nMetadata:\n${JSON.stringify(result.metadata, null, 2)}`
      };
    } else {
      testResult.value = {
        success: false,
        message: `Test başarısız: ${result.error}`
      };
    }
  } catch (error: any) {
    testResult.value = {
      success: false,
      message: `Test hatası: ${error.message}`
    };
  }
}

function getProviderIcon(provider: LLMProvider): string {
  const icons: Record<LLMProvider, string> = {
    openai: '🤖',
    anthropic: '🧠',
    google: '🔮',
    local: '💻',
    server: '☁️'
  };
  return icons[provider] || '🤖';
}

function getPrivacyLabel(level: 'full' | 'partial' | 'server'): string {
  const labels = {
    full: '🔒 Tam Gizlilik',
    partial: '🔓 Kısmi Gizlilik',
    server: '☁️ Sunucu İşleme'
  };
  return labels[level];
}

function formatContextWindow(tokens: number): string {
  if (tokens === 0) return 'Custom';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return tokens.toString();
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

// Initialize
onMounted(() => {
  providers.value = LLMProviderManager.getProviders();

  // Load saved configuration
  const savedConfig = apiKeyService.getLLMConfig();
  if (savedConfig) {
    selectedProvider.value = savedConfig.provider;
    selectedModel.value = savedConfig.model;
    temperature.value = savedConfig.temperature ?? 0.7;
    maxTokens.value = savedConfig.maxTokens ?? 2000;
    useServerFallback.value = savedConfig.useServerFallback ?? true;

    // Load API key for selected provider
    if (selectedProviderInfo.value?.requiresApiKey) {
      apiKeyService.getApiKey(savedConfig.provider).then(key => {
        if (key) apiKeyInput.value = key;
      });
    }
  }

  // Initialize LLM service
  llmService.value = new ClientLLMService();

  // Load usage stats (placeholder)
  usageStats.value = {
    totalAnalyses: 0,
    totalTokens: 0,
    totalCost: 0
  };
});
</script>

<style scoped lang="scss">
.llm-provider-settings {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;

  .settings-header {
    margin-bottom: 2rem;

    h2 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #666;
      font-size: 1.1rem;
    }
  }

  .privacy-notice {
    display: flex;
    align-items: start;
    gap: 1rem;
    padding: 1rem;
    background: #e3f2fd;
    border-radius: 8px;
    margin-bottom: 2rem;

    .notice-icon {
      font-size: 2rem;
    }

    .notice-content {
      flex: 1;

      strong {
        display: block;
        margin-bottom: 0.5rem;
        color: #1976d2;
      }

      p {
        margin: 0;
        line-height: 1.5;
      }
    }
  }

  .provider-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .provider-card {
    padding: 1.5rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #1976d2;
      transform: translateY(-2px);
    }

    &.active {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    &.has-key {
      border-color: #4caf50;
    }

    .provider-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;

      .provider-icon {
        font-size: 1.5rem;
      }

      .provider-name {
        flex: 1;
        font-weight: bold;
        font-size: 0.9rem;
      }

      .provider-badge {
        color: #4caf50;
        font-size: 1.2rem;
      }
    }

    .privacy-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-bottom: 0.5rem;

      &.privacy-full {
        background: #4caf50;
        color: white;
      }

      &.privacy-partial {
        background: #ff9800;
        color: white;
      }

      &.privacy-server {
        background: #2196f3;
        color: white;
      }
    }

    .provider-models {
      small {
        color: #666;
      }
    }
  }

  .provider-config {
    margin-top: 2rem;
    padding: 2rem;
    background: #f5f5f5;
    border-radius: 8px;

    h3 {
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
      }

      input[type="password"],
      input[type="text"],
      input[type="number"],
      select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }

      input[type="range"] {
        width: 100%;
      }

      .value-display {
        text-align: center;
        font-weight: bold;
        color: #1976d2;
      }
    }

    .api-key-input {
      display: flex;
      gap: 0.5rem;

      input {
        flex: 1;
      }

      .btn-visibility {
        padding: 0.75rem 1rem;
        background: #e0e0e0;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1.2rem;

        &:hover {
          background: #d0d0d0;
        }
      }
    }

    .api-key-status {
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;

      .status-indicator {
        flex: 1;
        padding: 0.5rem;
        border-radius: 4px;

        &.saved {
          background: #4caf50;
          color: white;
        }
      }

      .btn-remove {
        padding: 0.5rem 1rem;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
          background: #d32f2f;
        }
      }
    }

    .setup-instructions {
      margin-top: 0.5rem;
      color: #666;
    }

    .model-info {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: white;
      border-radius: 4px;

      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.25rem;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;

      button {
        flex: 1;
        padding: 1rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;

        &.btn-primary {
          background: #1976d2;
          color: white;

          &:hover:not(:disabled) {
            background: #1565c0;
          }
        }

        &.btn-test {
          background: #4caf50;
          color: white;

          &:hover:not(:disabled) {
            background: #388e3c;
          }
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }

  .usage-stats {
    margin-top: 2rem;
    padding: 2rem;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);

    h3 {
      margin-bottom: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;

      .stat-card {
        text-align: center;
        padding: 1rem;
        background: #f5f5f5;
        border-radius: 8px;

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1976d2;
        }

        .stat-label {
          margin-top: 0.5rem;
          color: #666;
          font-size: 0.9rem;
        }
      }
    }
  }

  .testing-result {
    margin-top: 2rem;
    padding: 1.5rem;
    border-radius: 8px;

    .result-header {
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 1rem;

      &.success {
        color: #4caf50;
      }

      &.error {
        color: #f44336;
      }
    }

    .result-content {
      pre {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre-wrap;
      }
    }
  }
}
</style>
