<template lang="pug">
div.ai-insights-display
  h3 AI Destekli İçgörüler

  b-card(v-if="loading")
    b-spinner(small, label="Yükleniyor...")
    |  İçgörüler yükleniyor...

  b-alert(v-if="error", show, variant="danger")
    | İçgörüler yüklenirken hata oluştu: {{ error }}

  b-card(v-if="!loading && insights")
    p {{ insights.summary }}

    div(v-if="insights.trends && insights.trends.length > 0")
      h5 Trendler:
      ul
        li(v-for="trend in insights.trends") {{ trend }}

    div(v-if="insights.anomalies && insights.anomalies.length > 0")
      h5 Anormallikler:
      ul
        li(v-for="anomaly in insights.anomalies") {{ anomaly }}

    div(v-if="insights.recommendations && insights.recommendations.length > 0")
      h5 Öneriler:
      ul
        li(v-for="recommendation in insights.recommendations") {{ recommendation }}

  b-alert(v-if="!loading && !insights", show, variant="info")
    | Gösterilecek içgörü bulunamadı. Lütfen zaman aralığını ayarlayın veya daha fazla aktivite verisi girin.

  div.controls.mt-3
    b-form-group(label="İçgörü Tipi:")
      b-form-select(v-model="insightType", :options="insightTypes")
    b-form-group(label="Başlangıç Tarihi:")
      b-form-datepicker(v-model="startDate", :max="endDate", locale="tr")
    b-form-group(label="Bitiş Tarihi:")
      b-form-datepicker(v-model="endDate", :min="startDate", :max="today", locale="tr")
    b-button(@click="fetchInsights", variant="primary", :disabled="loading") İçgörüleri Getir

</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, onMounted } from 'vue';
import { usePredictionStore } from '~/stores/prediction';
import moment from 'moment';

export default defineComponent({
  name: 'AIInsightsDisplay',
  setup() {
    const predictionStore = usePredictionStore();

    const startDate = ref(moment().subtract(7, 'days').format('YYYY-MM-DD'));
    const endDate = ref(moment().format('YYYY-MM-DD'));
    const today = ref(moment().format('YYYY-MM-DD'));
    const insightType = ref('productivity'); // Varsayılan içgörü tipi
    const insightTypes = ref([
      { value: 'productivity', text: 'Üretkenlik İçgörüleri' },
      { value: 'focus', text: 'Odaklanma İçgörüleri' },
      { value: 'behavioral', text: 'Davranışsal İçgörüler' },
      { value: 'anomaly', text: 'Anormallik Tespitleri' },
    ]);

    const insights = computed(() => predictionStore.prediction);
    const loading = computed(() => predictionStore.loading);
    const error = computed(() => predictionStore.error);

    const fetchInsights = async () => {
      await predictionStore.fetchAIInsight(insightType.value, startDate.value, endDate.value);
      console.log(`İçgörüler getiriliyor: ${insightType.value} ${startDate.value} - ${endDate.value}`);
    };

    onMounted(() => {
      fetchInsights();
    });

    watch([startDate, endDate, insightType], () => {
      fetchInsights();
    });

    return {
      startDate,
      endDate,
      today,
      insightType,
      insightTypes,
      insights,
      loading,
      error,
      fetchInsights,
    };
  },
});
</script>

<style scoped lang="scss">
.ai-insights-display {
  padding: 20px;
  background-color: var(--background-color);
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

h3 {
  color: var(--text-color);
  margin-bottom: 20px;
  text-align: center;
}

.b-card {
  margin-bottom: 20px;
  background-color: var(--card-background-color, #fff);
  border: 1px solid var(--light-border-color);
  color: var(--text-color);
}

p {
  color: var(--text-color);
}

h5 {
  color: var(--active-highlight-color);
  font-weight: bold;
}

ul {
  list-style-type: disc;
  padding-left: 20px;
  color: var(--text-color);
}

li {
  margin-bottom: 5px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: stretch;
}

.form-group {
  margin-bottom: 0;
}

.form-label {
  color: var(--text-color);
}

.form-control,
.b-form-datepicker,
.b-form-select {
  background-color: var(--background-color);
  color: var(--text-color);
  border-color: var(--light-border-color);

  &:focus {
    border-color: var(--active-highlight-color);
    box-shadow: 0 0 0 0.2rem rgba(var(--active-highlight-color), 0.25);
  }
}

.btn-primary {
  background-color: var(--active-highlight-color);
  border-color: var(--active-highlight-color);
  color: white;
  &:hover {
    background-color: darken(var(--active-highlight-color), 10%);
    border-color: darken(var(--active-highlight-color), 10%);
  }
}
</style> 