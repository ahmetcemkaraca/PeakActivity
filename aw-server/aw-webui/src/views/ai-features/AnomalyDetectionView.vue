<template>
  <div class="anomaly-detection-view container-fluid">
    <h2 class="mt-4 mb-3">Anomali Tespiti</h2>
    <div class="card shadow-sm mb-4">
      <div class="card-body">
        <h5 class="card-title">İçgörü Parametreleri</h5>
        <div class="row g-3 align-items-center">
          <div class="col-md-4">
            <label for="userId" class="form-label">Kullanıcı ID:</label>
            <input
              type="text"
              class="form-control"
              id="userId"
              v-model="userId"
              placeholder="Kullanıcı ID girin"
            />
          </div>
          <div class="col-md-4">
            <label for="timeRange" class="form-label">Zaman Aralığı:</label>
            <input
              type="text"
              class="form-control"
              id="timeRange"
              v-model="timeRange"
              placeholder="Örn: last 7 days"
            />
          </div>
          <div class="col-md-auto">
            <button class="btn btn-primary mt-4" @click="fetchInsight" :disabled="loading">
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <span v-else>İçgörü Getir</span>
            </button>
          </div>
        </div>
        <div v-if="error" class="alert alert-danger mt-3" role="alert">Hata: {{ error }}</div>
      </div>
    </div>

    <div v-if="insight" class="card shadow-sm mt-4">
      <div class="card-header bg-primary text-white">
        <h4 class="mb-0">Anomali Tespiti Sonuçları</h4>
      </div>
      <div class="card-body">
        <pre class="bg-light p-3 rounded mb-3">{{ JSON.stringify(insight, null, 2) }}</pre>
        <LineChart
          v-if="chartData.datasets.length"
          :chartData="chartData"
          :chartOptions="chartOptions"
          chartType="scatter"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { AIFeatureService } from '@/util/ai-feature-service';
import LineChart from '@/components/LineChart.vue';
import { ChartData, ChartOptions, ScatterDataPoint } from 'chart.js';
import 'chartjs-adapter-luxon';

export default defineComponent({
  name: 'AnomalyDetectionView',
  components: {
    LineChart,
  },
  setup() {
    const userId = ref('test_user'); // Varsayılan değer
    const timeRange = ref('last 7 days'); // Varsayılan değer
    const insight = ref<any>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const fetchInsight = async () => {
      loading.value = true;
      error.value = null;
      insight.value = null;
      try {
        insight.value = await AIFeatureService.fetchAnomalyDetectionInsight(
          userId.value,
          timeRange.value
        );
      } catch (err: any) {
        error.value = err.message || 'Anomali tespiti içgörüsü getirilirken bir hata oluştu.';
      } finally {
        loading.value = false;
      }
    };

    const chartData = computed<ChartData<'line' | 'scatter', (number | ScatterDataPoint)[]>>(() => {
      if (!insight.value || !insight.value.anomalies) {
        return { labels: [], datasets: [] };
      }

      const labels = insight.value.anomalies.map(
        (a: any) => new Date(a.timestamp).toISOString().split('T')[0]
      );
      const data = insight.value.anomalies.map((a: any) => a.value);
      const anomalyPoints = insight.value.anomalies.filter((a: any) => a.isAnomaly);

      const datasets = [
        {
          label: 'Veri',
          backgroundColor: '#007bff',
          borderColor: '#007bff',
          data: data,
          fill: false,
          type: 'line' as const,
        },
        {
          label: 'Anomali',
          backgroundColor: '#dc3545',
          borderColor: '#dc3545',
          data: anomalyPoints.map((a: any) => ({
            x: new Date(a.timestamp).toISOString().split('T')[0],
            y: a.value,
          })),
          pointRadius: 5,
          pointHoverRadius: 7,
          showLine: false,
          type: 'scatter' as const,
        },
      ];
      return { labels, datasets };
    });

    const chartOptions = computed<ChartOptions<'line' | 'scatter'>>(() => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'yyyy-MM-dd',
            displayFormats: {
              day: 'MMM D',
            },
          },
          title: {
            display: true,
            text: 'Tarih',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Değer',
          },
        },
      },
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
    }));

    return {
      userId,
      timeRange,
      insight,
      loading,
      error,
      fetchInsight,
      chartData,
      chartOptions,
    };
  },
});
</script>

<style scoped>
/* Bileşene özgü stil eklemeleri */
.anomaly-detection-view {
  padding: 20px;
}
.card-header.bg-primary {
  background-color: #007bff !important;
}
.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
}
.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}
pre {
  white-space: pre-wrap; /* Uzun metinleri sar */
  word-wrap: break-word; /* Uzun kelimeleri böl */
}
</style>
