<template>
  <div class="privacy-settings">
    <h2>{{ $t('settings.privacy.title') }}</h2>
    <p>{{ $t('settings.privacy.description') }}</p>

    <div class="setting-item">
      <input type="checkbox" id="allowAnonymousSystemData" v-model="settings.allowAnonymousSystemData" @change="saveSettings">
      <label for="allowAnonymousSystemData">{{ $t('settings.privacy.allowAnonymousSystemData') }}</label>
    </div>

    <div class="setting-item">
      <input type="checkbox" id="allowAnonymizedUsageData" v-model="settings.allowAnonymizedUsageData" @change="saveSettings">
      <label for="allowAnonymizedUsageData">{{ $t('settings.privacy.allowAnonymizedUsageData') }}</label>
    </div>

    <div class="setting-item">
      <input type="checkbox" id="allowSensitivePersonalData" v-model="settings.allowSensitivePersonalData" @change="saveSettings">
      <label for="allowSensitivePersonalData">{{ $t('settings.privacy.allowSensitivePersonalData') }}</label>
    </div>

    <p class="last-updated">{{ $t('settings.privacy.lastUpdated') }}: {{ lastUpdatedDisplay }}</p>

    <div v-if="saveStatus === 'saving'" class="status-message saving">{{ $t('settings.privacy.saving') }}</div>
    <div v-if="saveStatus === 'success'" class="status-message success">{{ $t('settings.privacy.saveSuccess') }}</div>
    <div v-if="saveStatus === 'error'" class="status-message error">{{ $t('settings.privacy.saveError') }}</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { UserConsent } from '../../../../functions/src/types/user-consent.d';
import { UserConsentManager } from '../../../../functions/src/services/UserConsentManager'; // Assuming this can be imported client-side or via API

export default Vue.extend({
  name: 'PrivacySettings',
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
      userConsentManager: null as UserConsentManager | null, // UserConsentManager instance
    };
  },
  computed: {
    lastUpdatedDisplay(): string {
      const date = new Date(this.settings.lastUpdated);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },
  },
  async created() {
    // TODO: UserConsentManager'ı API üzerinden veya direkt import ile (eğer mümkünse) başlat
    // Şimdilik doğrudan import varsayımıyla devam ediyorum.
    // Gerçek uygulamada bu bir API çağrısı ile yapılmalıdır.
    try {
      this.userConsentManager = new UserConsentManager(); // Backend servisini doğrudan import etmek istemci tarafında doğru değil, API üzerinden çağrılmalı.
                                                        // Bu bir yer tutucudur.
      await this.loadSettings();
    } catch (error) {
      console.error('UserConsentManager başlatılırken hata oluştu:', error);
      this.saveStatus = 'error';
    }
  },
  methods: {
    async loadSettings() {
      if (!this.userConsentManager) return;
      try {
        const userConsent = await this.userConsentManager.getUserConsent(this.userId);
        if (userConsent) {
          this.settings = userConsent;
        }
      } catch (error) {
        console.error('Gizlilik ayarları yüklenirken hata oluştu:', error);
        this.saveStatus = 'error';
      }
    },
    async saveSettings() {
      if (!this.userConsentManager) return;
      this.saveStatus = 'saving';
      try {
        this.settings.lastUpdated = new Date().toISOString();
        const success = await this.userConsentManager.saveUserConsent(this.userId, this.settings);
        if (success) {
          this.saveStatus = 'success';
        } else {
          this.saveStatus = 'error';
        }
      } catch (error) {
        console.error('Gizlilik ayarları kaydedilirken hata oluştu:', error);
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
.privacy-settings {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.setting-item input[type="checkbox"] {
  margin-right: 10px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.setting-item label {
  font-size: 1.1em;
  color: #555;
  cursor: pointer;
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