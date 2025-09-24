<template>
  <div class="two-factor-setup">
    <h2>{{ $t('settings.twoFactor.title') }}</h2>
    <p>{{ $t('settings.twoFactor.description') }}</p>

    <section class="setting-section">
      <h3>{{ $t('settings.twoFactor.totp.title') }}</h3>
      <p>{{ $t('settings.twoFactor.totp.description') }}</p>

      <div v-if="totpSecret && !totpEnabled">
        <p>{{ $t('settings.twoFactor.totp.scanQr') }}</p>
        <div class="qr-code-container">
          <!-- QR kodu buraya gelecek. Örneğin bir kütüphane ile oluşturulabilir -->
          <img :src="qrCodeSvg" alt="QR Code" v-if="qrCodeSvg" />
          <p v-if="qrCodeSvg">QR Kodu burada gösterilecektir. URI: {{ totpUri }}</p>
        </div>
        <p><strong>{{ $t('settings.twoFactor.totp.manualEntry') }}:</strong> {{ totpSecret }}</p>
        
        <label for="totpCode">{{ $t('settings.twoFactor.totp.enterCode') }}</label>
        <input type="text" id="totpCode" v-model="totpVerificationCode" maxlength="6">
        <button @click="verifyTotp">{{ $t('settings.twoFactor.totp.verifyAndEnable') }}</button>
        <div v-if="totpStatus" :class="{ 'status-message': true, 'error': totpStatus.includes('hata') }">{{ totpStatus }}</div>
      </div>
      <div v-else-if="!totpEnabled">
        <button @click="initiateTotpSetup">{{ $t('settings.twoFactor.totp.setupButton') }}</button>
      </div>
      <div v-else>
        <p class="enabled-status">{{ $t('settings.twoFactor.totp.enabled') }}</p>
        <button @click="disableTotp">{{ $t('settings.twoFactor.totp.disableButton') }}</button>
      </div>
    </section>

    <section class="setting-section">
      <h3>{{ $t('settings.twoFactor.backupCodes.title') }}</h3>
      <p>{{ $t('settings.twoFactor.backupCodes.description') }}</p>
      <div v-if="backupCodes.length > 0">
        <p>{{ $t('settings.twoFactor.backupCodes.saveWarning') }}</p>
        <ul class="backup-code-list">
          <li v-for="(code, index) in backupCodes" :key="index">{{ code }}</li>
        </ul>
        <button @click="generateBackupCodes">{{ $t('settings.twoFactor.backupCodes.regenerateButton') }}</button>
      </div>
      <div v-else>
        <button @click="generateBackupCodes">{{ $t('settings.twoFactor.backupCodes.generateButton') }}</button>
      </div>
      <div v-if="backupCodesStatus">{{ backupCodesStatus }}</div>
    </section>

    <div v-if="saveStatus === 'saving'" class="status-message saving">{{ $t('settings.saving') }}</div>
    <div v-if="saveStatus === 'success'" class="status-message success">{{ $t('settings.saveSuccess') }}</div>
    <div v-if="saveStatus === 'error'" class="status-message error">{{ $t('settings.saveError') }}</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
// import axios from 'axios'; // axios import edildi
// import { TwoFactorManager } from '../../../../functions/src/services/encryption/TwoFactorManager'; // Backend servisi olduğu için kaldırıldı
// import { TwoFactorAuthData } from '../../../../functions/src/types/two-factor-auth.d'; // Backend tipi olduğu için kaldırıldı
import QRCode from 'qrcode'; // QR kodu oluşturmak için kütüphane

interface TwoFactorAuthData {
  hasTotp: boolean;
  hasBackupCodes: boolean;
}

export default Vue.extend({
  name: 'TwoFactorSetup',
  data() {
    return {
      userId: 'test_user_id', // TODO: Gerçek kullanıcı kimliği ile değiştirilecek
      // twoFactorManager: null as TwoFactorManager | null, // Kaldırıldı
      totpSecret: '',
      totpVerificationCode: '',
      qrCodeSvg: '',
      totpUri: '', // URI'yi tutmak için yeni alan
      totpEnabled: false,
      totpStatus: '',
      backupCodes: [] as string[],
      backupCodesStatus: '',
      saveStatus: '' as 'saving' | 'success' | 'error' | '',
    };
  },
  async created() {
    try {
      // this.twoFactorManager = new TwoFactorManager(); // Backend servisi olduğu için kaldırıldı
      await this.loadTwoFactorStatus();
    } catch (error) {
      console.error('TwoFactorManager başlatılırken hata oluştu:', error);
      this.saveStatus = 'error';
    }
  },
  methods: {
    async loadTwoFactorStatus() {
      // if (!this.twoFactorManager) return; // Kaldırıldı
      try {
        const response = await this.$axios.get(`/api/two-factor/status/${this.userId}`);
        if (response.data.success && response.data.data) {
          const status: TwoFactorAuthData = response.data.data;
          this.totpEnabled = status.hasTotp || false;
          this.backupCodes = status.hasBackupCodes ? [this.$t('settings.twoFactor.backupCodes.alreadyGenerated')] : [];
        }
      } catch (error) {
        console.error('2FA durumu yüklenirken hata oluştu:', error);
        this.saveStatus = 'error';
      }
    },
    async initiateTotpSetup() {
      // if (!this.twoFactorManager) return; // Kaldırıldı
      this.totpStatus = '';
      try {
        const response = await this.$axios.post('/api/two-factor/initiate-totp', { userId: this.userId });
        if (response.data.success && response.data.data) {
          const { secret, uri } = response.data.data;
          this.totpSecret = secret;
          this.totpUri = uri;
          this.qrCodeSvg = await QRCode.toDataURL(uri); // QR kodu SVG olarak oluşturuldu
        } else {
          this.totpStatus = this.$t('settings.twoFactor.totp.setupError') + `: ${response.data.message}`;
        }
      } catch (error) {
        console.error('TOTP kurulumu başlatılırken hata oluştu:', error);
        this.totpStatus = this.$t('settings.twoFactor.totp.setupError') + `: ${error.message}`;
      }
    },
    async verifyTotp() {
      // if (!this.twoFactorManager || !this.totpSecret) return; // Kaldırıldı
      this.totpStatus = '';
      try {
        const response = await this.$axios.post('/api/two-factor/verify-totp', {
          userId: this.userId,
          secret: this.totpSecret,
          code: this.totpVerificationCode
        });

        if (response.data.success) {
          this.totpEnabled = true;
          this.totpSecret = '';
          this.qrCodeSvg = '';
          this.totpUri = '';
          this.totpStatus = this.$t('settings.twoFactor.totp.verifySuccess');
        } else {
          this.totpStatus = this.$t('settings.twoFactor.totp.verifyError') + `: ${response.data.message}`;
        }
      } catch (error) {
        console.error('TOTP doğrulanırken hata oluştu:', error);
        this.totpStatus = this.$t('settings.twoFactor.totp.verifyError') + `: ${error.message}`;
      }
    },
    async disableTotp() {
      // if (!this.twoFactorManager) return; // Kaldırıldı
      this.totpStatus = '';
      try {
        const response = await this.$axios.post('/api/two-factor/disable', { userId: this.userId });
        if (response.data.success) {
          this.totpEnabled = false;
          this.totpStatus = this.$t('settings.twoFactor.totp.disableSuccess');
          await this.loadTwoFactorStatus();
        } else {
          this.totpStatus = this.$t('settings.twoFactor.totp.disableError') + `: ${response.data.message}`;
        }
      } catch (error) {
        console.error('TOTP devre dışı bırakılırken hata oluştu:', error);
        this.totpStatus = this.$t('settings.twoFactor.totp.disableError') + `: ${error.message}`;
      }
    },
    async generateBackupCodes() {
      // if (!this.twoFactorManager) return; // Kaldırıldı
      this.backupCodesStatus = '';
      try {
        const response = await this.$axios.post('/api/two-factor/generate-backup-codes', { userId: this.userId });
        if (response.data.success && response.data.data) {
          this.backupCodes = response.data.data.codes;
          this.backupCodesStatus = this.$t('settings.twoFactor.backupCodes.generateSuccess');
        } else {
          this.backupCodesStatus = this.$t('settings.twoFactor.backupCodes.generateError') + `: ${response.data.message}`;
        }
      } catch (error) {
        console.error('Yedek kodlar oluşturulurken hata oluştu:', error);
        this.backupCodesStatus = this.$t('settings.twoFactor.backupCodes.generateError') + `: ${error.message}`;
      }
    },
  },
});
</script>

<style scoped>
.two-factor-setup {
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

.setting-section {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

h3 {
  color: #0056b3;
  margin-top: 0;
  margin-bottom: 15px;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
  margin-top: 10px; /* Butonların üstünde boşluk */
  margin-right: 10px; /* Butonlar arasında boşluk */
}

button:hover {
  background-color: #0056b3;
}

input[type="text"] {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background-color: white;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 20px;
}

.qr-code-container img {
  max-width: 200px;
  height: auto;
}

.enabled-status {
  color: #2e7d32;
  font-weight: bold;
}

.backup-code-list {
  list-style-type: none;
  padding: 0;
  margin-top: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  padding: 15px;
}

.backup-code-list li {
  font-family: 'Courier New', Courier, monospace;
  font-size: 1.1em;
  color: #333;
  margin-bottom: 5px;
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