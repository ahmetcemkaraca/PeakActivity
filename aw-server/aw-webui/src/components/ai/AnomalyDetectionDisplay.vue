<template>
  <div class="anomaly-detection-display">
    <h2>Anomali Tespiti</h2>
    <div v-if="loading">Yükleniyor...</div>
    <div v-else-if="error" class="error">Hata: {{ error }}</div>
    <div v-else>
      <div v-if="anomalies.length">
        <h4>Tespit Edilen Anomaliler:</h4>
        <ul>
          <li v-for="anomaly in anomalies" :key="anomaly.date">
            <strong>Tarih:</strong> {{ anomaly.date }} <br/>
            <strong>Z-Skoru:</strong> {{ anomaly.z_score }} <br/>
            <strong>Sapma Yüzdesi:</strong> {{ anomaly.deviation_percent }}%
          </li>
        </ul>
      </div>
      <div v-else>
        <p>Anomali bulunamadı.</p>
      </div>

      <div class="baseline-info">
        <h3>Temel Çizgi Bilgisi:</h3>
        <p>Ortalama Günlük Aktivite: {{ baselineMean }} saniye</p>
        <p>Standart Sapma: {{ baselineStdDev }} saniye</p>
        <p>{{ explanation }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { getAnomalyDetection } from '~/util/awclient';

interface Anomaly {
  date: string;
  z_score: number;
  deviation_percent: number;
}

export default defineComponent({
  name: 'AnomalyDetectionDisplay',
  setup() {
    const loading = ref(true);
    const error = ref<string | null>(null);
    const anomalies = ref<Anomaly[]>([]);
    const baselineMean = ref<number | null>(null);
    const baselineStdDev = ref<number | null>(null);
    const explanation = ref<string>('');

    const fetchAnomalyDetection = async () => {
      loading.value = true;
      error.value = null;
      try {
        // TODO: Replace with actual daily_totals data from aw-server/aw-webui
        const mockDailyTotals = [
          { "date": "2024-06-01", "total_seconds": 28000 },
          { "date": "2024-06-02", "total_seconds": 29000 },
          { "date": "2024-06-03", "total_seconds": 28500 },
          { "date": "2024-06-04", "total_seconds": 35000 }, // Anomaly
          { "date": "2024-06-05", "total_seconds": 27000 },
          { "date": "2024-06-06", "total_seconds": 26000 },
          { "date": "2024-06-07", "total_seconds": 10000 }, // Anomaly
          { "date": "2024-06-08", "total_seconds": 29500 },
          { "date": "2024-06-09", "total_seconds": 28200 },
          { "date": "2024-06-10", "total_seconds": 27800 },
          { "date": "2024-06-11", "total_seconds": 34000 }, // Anomaly
          { "date": "2024-06-12", "total_seconds": 26500 },
          { "date": "2024-06-13", "total_seconds": 25500 },
          { "date": "2024-06-14", "total_seconds": 12000 }, // Anomaly
          { "date": "2024-06-15", "total_seconds": 29000 },
        ];

        const result = await getAnomalyDetection(mockDailyTotals);
        anomalies.value = result.anomalies;
        baselineMean.value = result.baseline_mean;
        baselineStdDev.value = result.baseline_stddev;
        explanation.value = result.explanation;
      } catch (e: any) {
        error.value = e.message || 'Veri çekilirken bir hata oluştu.';
        console.error('Anomali Tespiti çekilirken hata:', e);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchAnomalyDetection();
    });

    return {
      loading,
      error,
      anomalies,
      baselineMean,
      baselineStdDev,
      explanation,
    };
  },
});
</script>

<style scoped>
.anomaly-detection-display {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin-top: 20px;
}

.baseline-info {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #fff;
}

.error {
  color: red;
}
</style> 