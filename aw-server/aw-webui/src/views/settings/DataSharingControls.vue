<template>
  <div class="data-sharing-controls">
    <h2>{{ $t('settings.dataSharing.title') }}</h2>
    <p>{{ $t('settings.dataSharing.description') }}</p>

    <div class="setting-item">
      <input
        type="checkbox"
        id="allowAnonymousSystemData"
        v-model="settings.allowAnonymousSystemData"
        @change="saveSettings"
      />
      <label for="allowAnonymousSystemData">
        {{ $t('settings.dataSharing.allowAnonymousSystemData') }}
      </label>
      <p class="hint">{{ $t('settings.dataSharing.allowAnonymousSystemDataHint') }}</p>
    </div>

    <div class="setting-item">
      <input
        type="checkbox"
        id="allowAnonymizedUsageData"
        v-model="settings.allowAnonymizedUsageData"
        @change="saveSettings"
      />
      <label for="allowAnonymizedUsageData">
        {{ $t('settings.dataSharing.allowAnonymizedUsageData') }}
      </label>
      <p class="hint">{{ $t('settings.dataSharing.allowAnonymizedUsageDataHint') }}</p>
    </div>

    <div class="setting-item">
      <input
        type="checkbox"
        id="allowSensitivePersonalData"
        v-model="settings.allowSensitivePersonalData"
        @change="saveSettings"
      />
      <label for="allowSensitivePersonalData">
        {{ $t('settings.dataSharing.allowSensitivePersonalData') }}
      </label>
      <p class="hint">{{ $t('settings.dataSharing.allowSensitivePersonalDataHint') }}</p>
    </div>

    <p class="last-updated">{{ $t('settings.lastUpdated') }}: {{ lastUpdatedDisplay }}</p>

    <div v-if="saveStatus === 'saving'" class="status-message saving">
      {{ $t('settings.saving') }}
    </div>
    <div v-if="saveStatus === 'success'" class="status-message success">
      {{ $t('settings.saveSuccess') }}
    </div>
    <div v-if="saveStatus === 'error'" class="status-message error">
      {{ $t('settings.saveError') }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
// import axios from 'axios'; // Axios importu kaldırıldı

interface UserConsent {
  allowAnonymousSystemData: boolean;
  allowAnonymizedUsageData: boolean;
  allowSensitivePersonalData: boolean;
  lastUpdated: string;
}

export default Vue.extend({
  name: 'DataSharingControls',
  data() {
    return {
      settings: {
        allowAnonymousSystemData: false,
        allowAnonymizedUsageData: false,
        allowSensitivePersonalData: false,
        lastUpdated: new Date().toISOString(),
      } as UserConsent,
      saveStatus: '' as 'saving' | 'success' | 'error' | '',
      userId: 'test_user_id', // TODO: Gerçek kullanıcı kimliği ile değiştirilecek
    };
  },
  computed: {
    lastUpdatedDisplay(): string {
      const date = new Date(this.settings.lastUpdated);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
  },
  async created() {
    try {
      await this.loadSettings();
    } catch (error) {
      console.error('Veri paylaşım ayarları başlatılırken hata oluştu:', error);
      this.saveStatus = 'error';
    }
  },
  methods: {
    async loadSettings() {
      try {
        const response = await this.$axios.get(`/api/user-consent/${this.userId}`);
        if (response.data.success && response.data.data) {
          this.settings = response.data.data;
        }
      } catch (error) {
        console.error('Veri paylaşım ayarları yüklenirken hata oluştu:', error);
        this.saveStatus = 'error';
      }
    },
    async saveSettings() {
      this.saveStatus = 'saving';
      try {
        this.settings.lastUpdated = new Date().toISOString();
        const response = await this.$axios.post('/api/user-consent', {
          userId: this.userId,
          consent: this.settings,
        });
        if (response.data.success) {
          this.saveStatus = 'success';
        } else {
          this.saveStatus = 'error';
        }
      } catch (error) {
        console.error('Veri paylaşım ayarları kaydedilirken hata oluştu:', error);
        this.saveStatus = 'error';
      } finally {
        setTimeout(() => {
          this.saveStatus = '';
        }, 3000);
      }
    },
  },
});
</script>

<style scoped>
.data-sharing-controls {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

p {
  color: #666;
  margin-bottom: 15px;
}

.setting-item {
  display: flex;
  flex-direction: column; /* Checkbox ve açıklamayı alt alta getir */
  margin-bottom: 15px;
  align-items: flex-start; /* Elemanları sola hizala */
}

.setting-item input[type='checkbox'] {
  margin-right: 10px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  align-self: flex-start; /* Checkbox'ı sola hizala */
}

.setting-item label {
  font-size: 1.1em;
  color: #555;
  cursor: pointer;
  margin-bottom: 5px; /* Etiket ile hint arasında boşluk */
}

.setting-item .hint {
  font-size: 0.9em;
  color: #888;
  margin-top: 5px;
  margin-left: 30px; /* Checkbox'ın genişliği kadar içeriden başla */
}

.last-updated {
  font-size: 0.9em;
  color: #777;
  margin-top: 20px;
}

.status-message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 5px;
  font-weight: bold;
}

.status-message.saving {
  background-color: #e0f7fa;
  color: #00796b;
}

.status-message.success {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-message.error {
  background-color: #ffebee;
  color: #c62828;
}
</style>
