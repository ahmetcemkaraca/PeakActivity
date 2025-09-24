<template lang="pug">
div.report-view
  h3 AI Destekli Raporlar

  b-alert(variant="info" show)
    | Bu bölüm, yapay zeka destekli raporlama ve özetleme yeteneklerini sergilemektedir.

  b-form(@submit.prevent="generateReport")
    b-form-group(label="Rapor Adı" label-for="reportName")
      b-form-input(id="reportName" v-model="reportName" required)
    b-form-group(label="Rapor Açıklaması" label-for="reportDescription")
      b-form-textarea(id="reportDescription" v-model="reportDescription" rows="3" max-rows="6")
    b-form-group(label="Rapor Tipi" label-for="reportType")
      b-form-select(id="reportType" v-model="reportType" :options="reportTypes" required)
    b-form-group(label="Zaman Aralığı" label-for="timeRange")
      b-form-select(id="timeRange" v-model="timeRange" :options="timeRanges" required)
    b-form-group(label="Granülerlik" label-for="granularity")
      b-form-select(id="granularity" v-model="granularity" :options="granularities" required)
    b-form-group(label="Metrikler" label-for="metrics")
      b-form-checkbox-group(v-model="selectedMetrics" :options="availableMetrics" stacked)

    b-button(type="submit" variant="primary" :disabled="loading")
      span(v-if="loading") Rapor Oluşturuluyor...
      span(v-else) Rapor Oluştur

  hr

  div(v-if="generatedReport")
    h4 Oluşturulan Rapor: {{ generatedReport.name }}
    b-card.mt-3
      h5 Özet
      p {{ generatedReport.generated_data.summary }}

      h5 Metrikler
      ul
        li Toplam Harcanan Süre: {{ generatedReport.generated_data.metrics.total_time_spent }} saniye
        li Odak Skoru Ortalaması: {{ generatedReport.generated_data.metrics.focus_score_average }}
        li Anomali Sayısı: {{ generatedReport.generated_data.metrics.anomaly_count }}

      h5 Grafikler
      div
        // Burada grafik bileşenleri entegre edilebilir
        // Örnek: <LineChart :chartData="generatedReport.generated_data.charts.someChartData" />

  b-alert(v-if="error" show variant="danger" class="mt-3")
    | {{ error }}

</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { httpsCallable } from 'firebase/functions';
import { functions } from '~/firebase';

interface ReportDocument {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'report' | 'dashboard';
  configuration: {
    time_range: 'daily' | 'weekly' | 'monthly' | 'custom';
    start_date?: number;
    end_date?: number;
    granularity: 'hourly' | 'daily' | 'weekly';
    metrics: Array<{
      metric_name: string;
      filter_criteria?: {
        app_names?: string[];
        categories?: string[];
        tags?: string[];
      };
    }>;
    layout?: any;
    chart_types?: {
      [metric_name: string]: string;
    };
  };
  generated_data?: any;
  last_generated_at?: number;
  created_at: number;
  updated_at: number;
  version: number;
}

const reportName = ref('');
const reportDescription = ref('');
const reportType = ref('report');
const reportTypes = [
  { text: 'Rapor', value: 'report' },
  { text: 'Kontrol Paneli', value: 'dashboard' },
];
const timeRange = ref('daily');
const timeRanges = [
  { text: 'Günlük', value: 'daily' },
  { text: 'Haftalık', value: 'weekly' },
  { text: 'Aylık', value: 'monthly' },
  { text: 'Özel', value: 'custom' },
];
const granularity = ref('daily');
const granularities = [
  { text: 'Saatlik', value: 'hourly' },
  { text: 'Günlük', value: 'daily' },
  { text: 'Haftalık', value: 'weekly' },
];
const selectedMetrics = ref<string[]>([]);
const availableMetrics = [
  { text: 'Toplam Harcanan Süre', value: 'total_time_spent' },
  { text: 'Odak Skoru Ortalaması', value: 'focus_score_average' },
  { text: 'Anomali Sayısı', value: 'anomaly_count' },
];
const loading = ref(false);
const generatedReport = ref<ReportDocument | null>(null);
const error = ref<string | null>(null);

const generateReport = async () => {
  loading.value = true;
  error.value = null;
  try {
    const createReportCallable = httpsCallable(functions, 'createReport');
    const newReportData = {
      name: reportName.value,
      description: reportDescription.value,
      type: reportType.value,
      configuration: {
        time_range: timeRange.value,
        granularity: granularity.value,
        metrics: selectedMetrics.value.map(metric_name => ({ metric_name })),
      },
    };

    const createResult = await createReportCallable(newReportData);
    const createdReport = createResult.data as ReportDocument;

    const generateReportDataCallable = httpsCallable(functions, 'generateReportData');
    const generateResult = await generateReportDataCallable({ reportId: createdReport.id });
    generatedReport.value = generateResult.data as ReportDocument;
  } catch (err: any) {
    console.error('Rapor oluşturulurken hata oluştu:', err);
    error.value = err.message || 'Rapor oluşturulurken bir hata oluştu.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.report-view {
  padding: 20px;
}
</style>
