<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, ref, watch, PropType } from 'vue';
import { Chart, registerables, ChartData, ChartOptions } from 'chart.js';

Chart.register(...registerables);

export default defineComponent({
  name: 'BarChart',
  props: {
    chartData: {
      type: Object as PropType<ChartData<'bar'>>,
      required: true,
    },
    chartOptions: {
      type: Object as PropType<ChartOptions<'bar'>>,
      default: () => ({}),
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
          type: 'bar',
          data: props.chartData as ChartData<'bar'>,
          options: props.chartOptions as ChartOptions<'bar'>,
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
