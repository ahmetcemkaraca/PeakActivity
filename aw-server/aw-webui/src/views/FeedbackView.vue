<template>
  <div class="feedback-form">
    <h3>Geri Bildirim Gönder</h3>
    <p>Uygulama hakkındaki düşüncelerinizi veya karşılaştığınız sorunları bizimle paylaşın.</p>

    <b-form @submit.prevent="submitFeedback">
      <b-form-group label="Konu" label-for="feedback-subject">
        <b-form-input
          id="feedback-subject"
          v-model="form.subject"
          required
          placeholder="Geri bildiriminizin konusunu girin"
        ></b-form-input>
      </b-form-group>

      <b-form-group label="Mesaj" label-for="feedback-message">
        <b-form-textarea
          id="feedback-message"
          v-model="form.message"
          required
          placeholder="Detaylı mesajınızı buraya yazın"
          rows="5"
        ></b-form-textarea>
      </b-form-group>

      <b-button type="submit" variant="primary" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        <span v-else>Gönder</span>
      </b-button>
    </b-form>

    <b-alert v-if="successMessage" show variant="success" class="mt-3">{{ successMessage }}</b-alert>
    <b-alert v-if="errorMessage" show variant="danger" class="mt-3">{{ errorMessage }}</b-alert>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import axios from 'axios';

export default Vue.extend({
  name: 'FeedbackForm',
  data() {
    return {
      form: {
        subject: '',
        message: '',
      },
      loading: false,
      successMessage: '',
      errorMessage: '',
    };
  },
  methods: {
    async submitFeedback() {
      this.loading = true;
      this.successMessage = '';
      this.errorMessage = '';

      try {
        const response = await axios.post('/api/feedback', this.form);
        if (response.data.success) {
          this.successMessage = 'Geri bildiriminiz başarıyla gönderildi. Teşekkür ederiz!';
          this.form.subject = '';
          this.form.message = '';
        } else {
          this.errorMessage = response.data.message || 'Geri bildirim gönderilirken bir hata oluştu.';
        }
      } catch (error: any) {
        console.error('Geri bildirim gönderilirken hata:', error);
        this.errorMessage = error.message || 'Geri bildirim gönderilirken bir hata oluştu.';
      } finally {
        this.loading = false;
      }
    },
  },
});
</script>

<style scoped lang="scss">
.feedback-form {
  padding: 20px;
  background-color: var(--card-background-color, #fff);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style> 