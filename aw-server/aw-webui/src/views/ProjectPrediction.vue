<template>
  <div class="project-prediction-container">
    <h2>Proje Tamamlama Tahmini</h2>

    <div class="input-section">
      <div class="form-group">
        <label for="projectId">Proje ID:</label>
        <input type="text" id="projectId" v-model="projectIdInput" placeholder="Proje ID giriniz" />
      </div>
      <button @click="fetchPrediction" class="btn btn-primary" :disabled="loading">
        Tahmini Getir
      </button>
    </div>

    <p v-if="loading" class="loading-message">Tahmin yükleniyor...</p>
    <p v-if="error" class="error-message">{{ error }}</p>

    <div v-if="prediction" class="prediction-results">
      <h3>Tahmin Sonuçları</h3>
      <div class="prediction-card">
        <p>
          <strong>Tahmini Tamamlama Tarihi:</strong>
          {{ prediction.estimatedCompletionDate }}
        </p>
        <p>
          <strong>Güven Seviyesi:</strong>
          %{{ (prediction.confidenceLevel * 100).toFixed(2) }}
        </p>
        <p>
          <strong>Mevcut İlerleme:</strong>
          %{{ (prediction.currentProgress * 100).toFixed(2) }}
        </p>
        <p>
          <strong>Gereken Kalan Efor:</strong>
          {{ (prediction.remainingEffort / 3600).toFixed(2) }} saat
        </p>
        <p><strong>Benzer Projelerden Alınan İçgörüler:</strong></p>
        <ul>
          <li v-for="insight in prediction.insightsFromSimilarProjects" :key="insight.id">
            {{ insight.description }} (Ortalama Tamamlama:
            {{ (insight.averageCompletionTime / 3600).toFixed(2) }} saat)
          </li>
        </ul>
      </div>
    </div>
    <p v-else-if="!loading && !error && projectIdInput.length > 0">
      Lütfen bir Proje ID girin ve tahmini getirin.
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuthStore } from '../stores/auth';

export default defineComponent({
  name: 'ProjectPrediction',
  data() {
    return {
      projectIdInput: '',
      prediction: null as any,
      loading: false,
      error: null as string | null,
      functionsInstance: functions,
      authStore: useAuthStore(),
    };
  },
  methods: {
    async fetchPrediction() {
      if (!this.authStore.user) {
        alert('Proje tahmini almak için giriş yapmalısınız.');
        return;
      }
      if (!this.projectIdInput) {
        alert('Lütfen bir proje ID girin.');
        return;
      }

      this.loading = true;
      this.error = null;
      this.prediction = null;

      try {
        const predictProjectCompletionCallable = httpsCallable(
          this.functionsInstance,
          'predictProjectCompletion'
        );
        const response = await predictProjectCompletionCallable({ projectId: this.projectIdInput });
        if (response.data.status === 'success') {
          this.prediction = response.data.data;
        } else {
          this.error = response.data.message || 'Tahmin alınamadı.';
        }
      } catch (err: any) {
        console.error('Proje tahmini getirilirken hata:', err);
        this.error = `Proje tahmini yüklenirken bir hata oluştu: ${err.message}`;
      } finally {
        this.loading = false;
      }
    },
  },
  created() {
    this.authStore.initAuthService();
  },
  mounted() {
    // fetchPrediction burada çağrılmıyor çünkü kullanıcının bir proje ID girmesi bekleniyor.
  },
});
</script>

<style scoped lang="scss">
.project-prediction-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
  color: #333;
}

h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

.input-section {
  display: flex;
  align-items: flex-end;
  gap: 15px;
  margin-bottom: 30px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  flex-grow: 1;
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.loading-message {
  text-align: center;
  color: #007bff;
  font-style: italic;
}

.error-message {
  color: #dc3545;
  font-weight: bold;
  text-align: center;
}

.prediction-results {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.prediction-results h3 {
  color: #34495e;
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
}

.prediction-card {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
}

.prediction-card p {
  margin-bottom: 10px;
}

.prediction-card ul {
  list-style-type: disc;
  padding-left: 20px;
}

.prediction-card li {
  margin-bottom: 5px;
}
</style>
