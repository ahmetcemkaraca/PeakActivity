<template>
  <div class="focus-quality-score-view container-fluid">
    <h2 class="mt-4 mb-3">Odak Kalitesi Skoru Analizi</h2>
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
        <h4 class="mb-0">Odak Kalitesi Skoru Sonuçları</h4>
      </div>
      <div class="card-body">
        <pre class="bg-light p-3 rounded mb-3">{{ JSON.stringify(insight, null, 2) }}</pre>
        <LineChart
          v-if="chartData.datasets.length"
          :chartData="chartData"
          :chartOptions="chartOptions"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { AIFeatureService } from '@/util/ai-feature-service';
import LineChart from '@/components/LineChart.vue';
import { ChartData, ChartOptions } from 'chart.js';
import 'chartjs-adapter-luxon';

export default defineComponent({
  name: 'FocusQualityScoreView',
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
        insight.value = await AIFeatureService.fetchFocusQualityScoreInsight(
          userId.value,
          timeRange.value
        );
      } catch (err: any) {
        error.value = err.message || 'Odak kalitesi skoru içgörüsü getirilirken bir hata oluştu.';
      } finally {
        loading.value = false;
      }
    };

    const chartData = computed<ChartData<'line'>>(() => {
      if (!insight.value || !insight.value.scores) {
        return { labels: [], datasets: [] };
      }

      const labels = insight.value.scores.map(
        (s: any) => new Date(s.date).toISOString().split('T')[0]
      );
      const data = insight.value.scores.map((s: any) => s.score);

      const datasets = [
        {
          label: 'Odak Skoru',
          backgroundColor: '#6f42c1',
          borderColor: '#6f42c1',
          data: data,
          fill: false,
        },
      ];
      return { labels, datasets };
    });

    const chartOptions = computed<ChartOptions<'line'>>(() => ({
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
            text: 'Skor',
          },
          min: 0,
          max: 1,
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
.focus-quality-score-view {
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
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
