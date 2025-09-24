<template>
  <div class="master-password-setup">
    <h2>{{ $t('settings.masterPassword.title') }}</h2>
    <p>{{ $t('settings.masterPassword.description') }}</p>

    <div v-if="!hasMasterPassword">
      <div class="form-group">
        <label for="newPassword">{{ $t('settings.masterPassword.newPassword') }}</label>
        <input type="password" id="newPassword" v-model="newPassword" autocomplete="new-password" />
      </div>
      <div class="form-group">
        <label for="confirmNewPassword">{{ $t('settings.masterPassword.confirmNewPassword') }}</label>
        <input type="password" id="confirmNewPassword" v-model="confirmNewPassword" autocomplete="new-password" />
      </div>
      <button @click="setupMasterPassword">{{ $t('settings.masterPassword.setupButton') }}</button>
    </div>
    <div v-else>
      <div class="form-group">
        <label for="currentPassword">{{ $t('settings.masterPassword.currentPassword') }}</label>
        <input type="password" id="currentPassword" v-model="currentPassword" autocomplete="current-password" />
      </div>
      <div class="form-group">
        <label for="changeNewPassword">{{ $t('settings.masterPassword.newPassword') }}</label>
        <input type="password" id="changeNewPassword" v-model="newPassword" autocomplete="new-password" />
      </div>
      <div class="form-group">
        <label for="changeConfirmNewPassword">{{ $t('settings.masterPassword.confirmNewPassword') }}</label>
        <input type="password" id="changeConfirmNewPassword" v-model="confirmNewPassword" autocomplete="new-password" />
      </div>
      <button @click="changeMasterPassword">{{ $t('settings.masterPassword.changeButton') }}</button>
      <button @click="removeMasterPassword" class="remove-button">{{ $t('settings.masterPassword.removeButton') }}</button>
    </div>

    <div v-if="statusMessage" :class="{ 'status-message': true, 'error': statusType === 'error', 'success': statusType === 'success' }">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
// import axios from 'axios'; // Axios importu kaldırıldı

export default Vue.extend({
  name: 'MasterPasswordSetup',
  data() {
    return {
      userId: 'test_user_id', // TODO: Gerçek kullanıcı kimliği ile değiştirilecek
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      hasMasterPassword: false,
      statusMessage: '',
      statusType: '' as 'success' | 'error' | '',
    };
  },
  async created() {
    try {
      await this.checkMasterPasswordStatus();
    } catch (error) {
      console.error('MasterPasswordSetup başlatılırken hata oluştu:', error);
      this.setStatus('Başlatılırken hata oluştu.', 'error');
    }
  },
  methods: {
    async checkMasterPasswordStatus() {
      try {
        const response = await this.$axios.get(`/api/encryption/master-password-status/${this.userId}`);
        if (response.data.success && typeof response.data.data === 'boolean') {
          this.hasMasterPassword = response.data.data;
        } else {
          this.hasMasterPassword = false;
        }
      } catch (error) {
        console.error('Ana parola durumu kontrol edilirken hata oluştu:', error);
        this.setStatus('Ana parola durumu kontrol edilirken hata oluştu.', 'error');
        this.hasMasterPassword = false;
      }
    },
    async setupMasterPassword() {
      if (this.newPassword !== this.confirmNewPassword) {
        this.setStatus(this.$t('settings.masterPassword.passwordMismatch'), 'error');
        return;
      }
      if (this.newPassword.length < 8) {
        this.setStatus(this.$t('settings.masterPassword.passwordTooShort'), 'error');
        return;
      }
      this.setStatus(this.$t('settings.masterPassword.settingUp'), '');
      try {
        const response = await this.$axios.post('/api/encryption/master-password-setup', {
          userId: this.userId,
          password: this.newPassword,
        });

        if (response.data.success) {
          this.setStatus(this.$t('settings.masterPassword.setupSuccess'), 'success');
          this.hasMasterPassword = true;
          this.clearPasswords();
        } else {
          this.setStatus(this.$t('settings.masterPassword.setupError') + `: ${response.data.message}`, 'error');
        }
      } catch (error) {
        console.error('Ana parola ayarlanırken hata oluştu:', error);
        this.setStatus(this.$t('settings.masterPassword.setupError') + `: ${error.message}`, 'error');
      }
    },
    async changeMasterPassword() {
      if (this.newPassword !== this.confirmNewPassword) {
        this.setStatus(this.$t('settings.masterPassword.passwordMismatch'), 'error');
        return;
      }
      if (this.newPassword.length < 8) {
        this.setStatus(this.$t('settings.masterPassword.passwordTooShort'), 'error');
        return;
      }
      this.setStatus(this.$t('settings.masterPassword.changing'), '');
      try {
        const response = await this.$axios.post('/api/encryption/rotate-keys', {
          userId: this.userId,
          oldPassword: this.currentPassword,
          newPassword: this.newPassword,
        });

        if (response.data.success) {
          this.setStatus(this.$t('settings.masterPassword.changeSuccess'), 'success');
          this.clearPasswords();
        } else {
          this.setStatus(this.$t('settings.masterPassword.changeError') + `: ${response.data.message}`, 'error');
        }
      } catch (error) {
        console.error('Ana parola değiştirilirken hata oluştu:', error);
        this.setStatus(this.$t('settings.masterPassword.changeError') + `: ${error.message}`, 'error');
      }
    },
    async removeMasterPassword() {
      this.setStatus(this.$t('settings.masterPassword.removing'), '');
      // TODO: Onay mekanizması ekle
      try {
        const response = await this.$axios.post('/api/encryption/remove-master-password', { userId: this.userId });

        if (response.data.success) {
          this.setStatus(this.$t('settings.masterPassword.removeSuccess'), 'success');
          this.hasMasterPassword = false;
          this.clearPasswords();
        } else {
          this.setStatus(this.$t('settings.masterPassword.removeError') + `: ${response.data.message}`, 'error');
        }
      } catch (error) {
        console.error('Ana parola kaldırılırken hata oluştu:', error);
        this.setStatus(this.$t('settings.masterPassword.removeError') + `: ${error.message}`, 'error');
      }
    },
    clearPasswords() {
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmNewPassword = '';
    },
    setStatus(message: string, type: 'success' | 'error' | '') {
      this.statusMessage = message;
      this.statusType = type;
      if (type !== '') {
        setTimeout(() => {
          this.statusMessage = '';
          this.statusType = '';
        }, 5000);
      }
    },
  },
});
</script>

<style scoped>
.master-password-setup {
  padding: 20px;
  max-width: 600px;
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

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input[type="password"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
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
  margin-right: 10px;
  margin-top: 10px;
}

button:hover {
  background-color: #0056b3;
}

button.remove-button {
  background-color: #dc3545;
}

button.remove-button:hover {
  background-color: #c82333;
}

.status-message {
  margin-top: 20px;
  padding: 10px;
  border-radius: 5px;
  font-weight: bold;
}

.status-message.success {
  background-color: #d4edda;
  color: #155724;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
}
</style> 