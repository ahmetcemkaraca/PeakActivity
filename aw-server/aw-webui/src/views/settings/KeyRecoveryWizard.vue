<template>
  <div class="key-recovery-wizard">
    <h2>{{ $t('settings.keyRecovery.title') }}</h2>
    <p>{{ $t('settings.keyRecovery.description') }}</p>

    <div class="wizard-step" v-if="currentStep === 1">
      <h3>{{ $t('settings.keyRecovery.step1.title') }}</h3>
      <p>{{ $t('settings.keyRecovery.step1.description') }}</p>
      <div class="form-group">
        <label for="recoveryOption">{{ $t('settings.keyRecovery.step1.chooseOption') }}</label>
        <select id="recoveryOption" v-model="recoveryOption">
          <option value="">{{ $t('settings.keyRecovery.step1.select') }}</option>
          <option value="securityQuestions">{{ $t('settings.keyRecovery.step1.securityQuestions') }}</option>
          <option value="backupCode">{{ $t('settings.keyRecovery.step1.backupCode') }}</option>
        </select>
      </div>
      <button @click="nextStep" :disabled="!recoveryOption">{{ $t('settings.keyRecovery.next') }}</button>
    </div>

    <div class="wizard-step" v-if="currentStep === 2">
      <h3>{{ $t('settings.keyRecovery.step2.title') }}</h3>
      <div v-if="recoveryOption === 'securityQuestions'">
        <p>{{ $t('settings.keyRecovery.step2.securityQuestionsDescription') }}</p>
        <div v-for="(qa, index) in enteredSecurityAnswers" :key="index" class="question-item">
          <label :for="'question-verify-' + index">{{ qa.questionText }}</label>
          <input :id="'question-verify-' + index" type="password" v-model="qa.answer" autocomplete="off">
        </div>
        <button @click="addSecurityQuestionField" v-if="enteredSecurityAnswers.length < maxSecurityQuestions">{{ $t('settings.keyRecovery.step2.addQuestion') }}</button>
      </div>
      <div v-else-if="recoveryOption === 'backupCode'">
        <p>{{ $t('settings.keyRecovery.step2.backupCodeDescription') }}</p>
        <div class="form-group">
          <label for="backupCodeInput">{{ $t('settings.keyRecovery.step2.enterBackupCode') }}</label>
          <input type="text" id="backupCodeInput" v-model="enteredBackupCode">
        </div>
      </div>
      <button @click="verifyRecoveryData">{{ $t('settings.keyRecovery.verify') }}</button>
      <button @click="currentStep = 1">{{ $t('settings.keyRecovery.back') }}</button>
    </div>

    <div class="wizard-step" v-if="currentStep === 3">
      <h3>{{ $t('settings.keyRecovery.step3.title') }}</h3>
      <p>{{ $t('settings.keyRecovery.step3.description') }}</p>
      <div class="form-group">
        <label for="newMasterPassword">{{ $t('settings.keyRecovery.step3.newPassword') }}</label>
        <input type="password" id="newMasterPassword" v-model="newMasterPassword" autocomplete="new-password">
      </div>
      <div class="form-group">
        <label for="confirmNewMasterPassword">{{ $t('settings.keyRecovery.step3.confirmNewPassword') }}</label>
        <input type="password" id="confirmNewMasterPassword" v-model="confirmNewMasterPassword" autocomplete="new-password">
      </div>
      <button @click="resetMasterKey">{{ $t('settings.keyRecovery.step3.resetButton') }}</button>
      <button @click="currentStep = 2">{{ $t('settings.keyRecovery.back') }}</button>
    </div>

    <div class="wizard-step" v-if="currentStep === 4">
      <h3>{{ $t('settings.keyRecovery.step4.title') }}</h3>
      <p>{{ $t('settings.keyRecovery.step4.description') }}</p>
      <button @click="closeWizard">{{ $t('settings.keyRecovery.finish') }}</button>
    </div>

    <div v-if="statusMessage" :class="{ 'status-message': true, 'error': statusType === 'error', 'success': statusType === 'success' }">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
// import { KeyRecoveryService } from '../../../../functions/src/services/encryption/KeyRecoveryService'; // Backend servisi olduğu için kaldırıldı
// import { SecurityQuestionService } from '../../../../functions/src/services/encryption/SecurityQuestionService'; // Backend servisi olduğu için kaldırıldı
import { UserConsent } from '../../../../functions/src/types/user-consent.d';

interface EnteredQuestionAnswer {
  questionId: string;
  questionText: string;
  answer: string;
}

export default Vue.extend({
  name: 'KeyRecoveryWizard',
  data() {
    return {
      userId: 'test_user_id', // TODO: Gerçek kullanıcı kimliği ile değiştirilecek
      currentStep: 1,
      recoveryOption: '' as 'securityQuestions' | 'backupCode' | '',
      availableSecurityQuestions: [] as { id: string; question: string }[],
      enteredSecurityAnswers: [] as EnteredQuestionAnswer[],
      maxSecurityQuestions: 3,
      enteredBackupCode: '',
      newMasterPassword: '',
      confirmNewMasterPassword: '',
      statusMessage: '',
      statusType: '' as 'success' | 'error' | '',
      // keyRecoveryService: null as KeyRecoveryService | null, // Kaldırıldı
      // securityQuestionService: null as SecurityQuestionService | null, // Kaldırıldı
    };
  },
  async created() {
    try {
      // Servisleri başlat (gerçek uygulamada API çağrıları olmalı)
      // Vue istemci tarafında bu servisleri doğrudan import etmek yerine, bir API katmanı olmalıdır.
      // Bu yer tutucu implementasyonudur.
      // this.securityQuestionService = new SecurityQuestionService(); // Kaldırıldı
      // this.keyRecoveryService = new KeyRecoveryService(); // Kaldırıldı
      await this.loadAvailableSecurityQuestions();
    } catch (error) {
      console.error('Anahtar kurtarma sihirbazı başlatılırken hata oluştu:', error);
      this.setStatus(this.$t('settings.keyRecovery.initError'), 'error');
    }
  },
  methods: {
    async loadAvailableSecurityQuestions() {
      // if (!this.securityQuestionService) return; // Kaldırıldı
      try {
        const response = await this.$axios.get('/api/security-questions/available?lang=tr');
        if (response.data.success && response.data.data) {
          this.availableSecurityQuestions = response.data.data;
        }
      } catch (error) {
        console.error('Mevcut güvenlik soruları yüklenirken hata oluştu:', error);
        this.setStatus(this.$t('settings.keyRecovery.loadQuestionsError'), 'error');
      }
    },
    addSecurityQuestionField() {
      if (this.enteredSecurityAnswers.length < this.maxSecurityQuestions) {
        this.enteredSecurityAnswers.push({
          questionId: '',
          questionText: this.$t('settings.keyRecovery.step2.newQuestionPlaceholder'), // Placeholder metin
          answer: '',
        });
      }
    },
    nextStep() {
      this.setStatus('', '');
      if (this.recoveryOption) {
        this.currentStep = 2;
        // Güvenlik soruları seçildiyse, boş alanları ekle
        if (this.recoveryOption === 'securityQuestions' && this.enteredSecurityAnswers.length === 0) {
          this.addSecurityQuestionField();
        }
      } else {
        this.setStatus(this.$t('settings.keyRecovery.step1.selectOptionError'), 'error');
      }
    },
    async verifyRecoveryData() {
      // if (!this.keyRecoveryService) return; // Kaldırıldı
      this.setStatus(this.$t('settings.keyRecovery.verifying'), '');
      try {
        let verificationData: any = {};
        if (this.recoveryOption === 'securityQuestions') {
          if (this.enteredSecurityAnswers.some(qa => !qa.questionId || !qa.answer)) {
            this.setStatus(this.$t('settings.keyRecovery.step2.fillAllQuestions'), 'error');
            return;
          }
          verificationData.securityAnswers = this.enteredSecurityAnswers.map(qa => ({
            questionId: qa.questionId,
            answer: qa.answer,
          }));
        } else if (this.recoveryOption === 'backupCode') {
          if (!this.enteredBackupCode) {
            this.setStatus(this.$t('settings.keyRecovery.step2.enterBackupCodeError'), 'error');
            return;
          }
          verificationData.recoveryCode = this.enteredBackupCode;
        }

        // TODO: Kullanıcı rızasını burada uygun şekilde topla
        const userConsent: UserConsent = {
          allowAnonymousSystemData: true,
          allowAnonymizedUsageData: true,
          allowSensitivePersonalData: true, // Kurtarma işlemi için hassas verilere erişim izni gerekli olabilir.
          lastUpdated: new Date().toISOString(),
        };

        const response = await this.$axios.post('/api/encryption/initiate-key-recovery', {
          userId: this.userId,
          verificationData: verificationData,
          userConsent: userConsent,
        });

        if (response.data.success) {
          this.setStatus(this.$t('settings.keyRecovery.verificationSuccess'), 'success');
          this.currentStep = 3;
        } else {
          this.setStatus(this.$t('settings.keyRecovery.verificationFailed'), 'error');
        }
      } catch (error) {
        console.error('Veri doğrulanırken hata oluştu:', error);
        this.setStatus(this.$t('settings.keyRecovery.verificationError') + `: ${error.message}`, 'error');
      }
    },
    async resetMasterKey() {
      // if (!this.keyRecoveryService) return; // Kaldırıldı
      this.setStatus(this.$t('settings.keyRecovery.resettingKey'), '');
      if (this.newMasterPassword !== this.confirmNewMasterPassword) {
        this.setStatus(this.$t('settings.keyRecovery.step3.passwordMismatch'), 'error');
        return;
      }
      if (this.newMasterPassword.length < 8) {
        this.setStatus(this.$t('settings.keyRecovery.step3.passwordTooShort'), 'error');
        return;
      }
      try {
        // TODO: Burada, anahtar rotasyonu için `dataToReEncrypt` parametresi boş bırakılmıştır.
        // Gerçek uygulamada kullanıcının tüm şifreli verileri çekilip yeni anahtarla yeniden şifrelenmelidir.
        const response = await this.$axios.post('/api/encryption/reset-master-key', {
          userId: this.userId,
          newMasterPassword: this.newMasterPassword,
        });

        if (response.data.success) {
          this.setStatus(this.$t('settings.keyRecovery.resetSuccess'), 'success');
          this.currentStep = 4;
        } else {
          this.setStatus(this.$t('settings.keyRecovery.resetError'), 'error');
        }
      } catch (error) {
        console.error('Ana anahtar sıfırlanırken hata oluştu:', error);
        this.setStatus(this.$t('settings.keyRecovery.resetError') + `: ${error.message}`, 'error');
      }
    },
    closeWizard() {
      console.log('Anahtar kurtarma sihirbazı kapatılıyor.');
      // TODO: Sihirbazı kapatmak için uygun eylemi tetikle (örn. bir olay yayma)
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
.key-recovery-wizard {
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

.wizard-step {
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

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input[type="password"],
.form-group input[type="text"],
.form-group select {
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

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.question-item {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
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