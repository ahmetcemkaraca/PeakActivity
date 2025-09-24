<template>
  <div class="security-question-setup">
    <h2>{{ $t('settings.securityQuestions.title') }}</h2>
    <p>{{ $t('settings.securityQuestions.description') }}</p>

    <div v-for="(qa, index) in securityQuestionsAndAnswers" :key="index" class="question-item">
      <label :for="'question-' + index">
        {{ $t('settings.securityQuestions.selectQuestion') }}
      </label>
      <select :id="'question-' + index" v-model="qa.questionId">
        <option value="">{{ $t('settings.securityQuestions.choose') }}</option>
        <option v-for="q in availableQuestions" :key="q.id" :value="q.id">{{ q.question }}</option>
      </select>

      <label :for="'answer-' + index">{{ $t('settings.securityQuestions.yourAnswer') }}</label>
      <input :id="'answer-' + index" type="password" v-model="qa.answer" autocomplete="off" />
    </div>

    <button @click="addQuestion" :disabled="securityQuestionsAndAnswers.length >= maxQuestions">
      {{ $t('settings.securityQuestions.addQuestion') }}
    </button>
    <button @click="saveSettings">{{ $t('settings.securityQuestions.saveButton') }}</button>

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
import Vue from 'vue'; // Vue importu geri eklendi
// import axios from 'axios'; // Axios importu kaldırıldı

interface SecurityQuestion {
  id: string;
  question: string;
}

interface SecurityAnswer {
  questionId: string;
  hashedAnswer: string;
  timestamp: string;
}

interface QuestionAnswerPair {
  questionId: string;
  answer: string;
}

export default Vue.extend({
  name: 'SecurityQuestionSetup',
  data() {
    return {
      userId: 'test_user_id', // TODO: Gerçek kullanıcı kimliği ile değiştirilecek
      availableQuestions: [] as SecurityQuestion[],
      securityQuestionsAndAnswers: [] as QuestionAnswerPair[],
      maxQuestions: 3, // Maksimum güvenlik sorusu sayısı
      saveStatus: '' as 'saving' | 'success' | 'error' | '',
    };
  },
  async created() {
    try {
      await this.loadQuestions();
      await this.loadUserAnswers();
    } catch (error) {
      console.error('Güvenlik soruları ayarları başlatılırken hata oluştu:', error);
      this.saveStatus = 'error';
    }
  },
  methods: {
    async loadQuestions() {
      try {
        const response = await this.$axios.get('/api/security-questions/available?lang=tr'); // Dil parametresi eklendi
        if (response.data.success && response.data.data) {
          this.availableQuestions = response.data.data;
        }
      } catch (error) {
        console.error('Mevcut güvenlik soruları yüklenirken hata oluştu:', error);
        this.saveStatus = 'error';
      }
    },
    async loadUserAnswers() {
      try {
        const response = await this.$axios.get(`/api/security-questions/answers/${this.userId}`);
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          const storedAnswers = response.data.data;
          this.securityQuestionsAndAnswers = storedAnswers.map((ans: SecurityAnswer) => ({
            questionId: ans.questionId,
            answer: '', // Cevaplar yüklenmez, sadece soru ID'leri
          }));
        } else {
          this.addQuestion(); // Henüz ayarlanmamışsa bir boş soru ekle
        }
      } catch (error) {
        console.error('Kullanıcı cevapları yüklenirken hata oluştu:', error);
        this.saveStatus = 'error';
      }
    },
    addQuestion() {
      if (this.securityQuestionsAndAnswers.length < this.maxQuestions) {
        this.securityQuestionsAndAnswers.push({ questionId: '', answer: '' });
      }
    },
    async saveSettings() {
      this.saveStatus = 'saving';
      try {
        const answersToSave: QuestionAnswerPair[] = [];
        for (const qa of this.securityQuestionsAndAnswers) {
          if (qa.questionId && qa.answer) {
            answersToSave.push({
              questionId: qa.questionId,
              answer: qa.answer,
            });
          }
        }

        if (answersToSave.length === 0) {
          alert(this.$t('settings.securityQuestions.noAnswersProvided'));
          this.saveStatus = '';
          return;
        }

        const response = await this.$axios.post('/api/security-questions/answers', {
          userId: this.userId,
          answers: answersToSave,
        });

        if (response.data.success) {
          this.saveStatus = 'success';
          this.securityQuestionsAndAnswers = this.securityQuestionsAndAnswers.map(qa => ({
            ...qa,
            answer: '',
            questionId: qa.questionId,
          }));
        } else {
          this.saveStatus = 'error';
        }
      } catch (error) {
        console.error('Güvenlik soruları kaydedilirken hata oluştu:', error);
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
.security-question-setup {
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

.question-item {
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.question-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
}

.question-item select,
.question-item input[type='password'] {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
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
  margin-right: 10px; /* Butonlar arasında boşluk */
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
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
