<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, ref, watch, PropType } from 'vue';
import { Chart, registerables, ChartData, ChartOptions, ChartTypeRegistry } from 'chart.js';

Chart.register(...registerables);

export default defineComponent({
  name: 'LineChart',
  props: {
    chartData: {
      type: Object as PropType<ChartData<keyof ChartTypeRegistry>>,
      required: true,
    },
    chartOptions: {
      type: Object as PropType<ChartOptions<keyof ChartTypeRegistry>>,
      default: () => ({}),
    },
    chartType: {
      type: String as PropType<keyof ChartTypeRegistry>,
      default: 'line',
    },
  },
  setup(props) {
    const chartCanvas = ref<HTMLCanvasElement | null>(null);
    let chartInstance: Chart | null = null;

    const renderChart = () => {
      if (chartCanvas.value) {
        if (chartInstance) {
          chartInstance.destroy();
        }
        chartInstance = new Chart(chartCanvas.value, {
          type: props.chartType,
          data: props.chartData as ChartData<keyof ChartTypeRegistry>,
          options: props.chartOptions as ChartOptions<keyof ChartTypeRegistry>,
        });
      }
    };

    onMounted(() => {
      renderChart();
    });

    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    });

    watch(
      () => props.chartData,
      () => {
        renderChart();
      },
      { deep: true }
    );

    watch(
      () => props.chartOptions,
      () => {
        renderChart();
      },
      { deep: true }
    );

    watch(
      () => props.chartType,
      () => {
        renderChart();
      }
    );

    return {
      chartCanvas,
    };
  },
});
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
</style>
