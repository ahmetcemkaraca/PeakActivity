<template>
  <div class="behavioral-trends-display">
    <h2>Davranışsal Desenler ve Trend Analizi</h2>
    <div v-if="loading">Yükleniyor...</div>
    <div v-else-if="error" class="error">Hata: {{ error }}</div>
    <div v-else>
      <div v-if="trendingCategories.length">
        <h4>Trend Olan Kategoriler:</h4>
        <ul>
          <li v-for="trend in trendingCategories" :key="trend.category">
            <strong>Kategori:</strong> {{ trend.category }} <br/>
            <strong>Trend:</strong> {{ trend.trend }} <br/>
            <strong>Günlük Eğim:</strong> {{ trend.slope_per_day }}
          </li>
        </ul>
      </div>
      <div v-else>
        <p>Trend olan kategori bulunamadı.</p>
      </div>

      <div v-if="seasonality.length">
        <h4>Mevsimsellik Desenleri:</h4>
        <ul>
          <li v-for="season in seasonality" :key="season.period">
            <strong>Dönem:</strong> {{ season.period }} <br/>
            <strong>Desen:</strong> {{ season.pattern }}
          </li>
        </ul>
      </div>
      <div v-else>
        <p>Mevsimsellik deseni bulunamadı.</p>
      </div>

      <div class="summary">
        <h3>Özet:</h3>
        <p>{{ summary }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { getBehavioralTrends } from '~/util/awclient';

interface TrendingCategory {
  category: string;
  trend: "rising" | "falling" | "stable";
  slope_per_day: number;
}

interface SeasonalityPattern {
  period: string;
  pattern: string;
}

export default defineComponent({
  name: 'BehavioralTrendsDisplay',
  setup() {
    const loading = ref(true);
    const error = ref<string | null>(null);
    const trendingCategories = ref<TrendingCategory[]>([]);
    const seasonality = ref<SeasonalityPattern[]>([]);
    const summary = ref<string>('');

    const fetchBehavioralTrends = async () => {
      loading.value = true;
      error.value = null;
      try {
        // TODO: Replace with actual daily_totals data from aw-server/aw-webui
        const mockDailyTotals = [
          { "date": "2024-06-01", "categories": { "coding": 20000, "browsing": 5000, "social": 1000 } },
          { "date": "2024-06-02", "categories": { "coding": 21000, "browsing": 5500, "social": 1100 } },
          { "date": "2024-06-03", "categories": { "coding": 22000, "browsing": 5200, "social": 900 } },
          { "date": "2024-06-04", "categories": { "coding": 23000, "browsing": 6000, "social": 1200 } },
          { "date": "2024-06-05", "categories": { "coding": 24000, "browsing": 6500, "social": 1300 } },
          { "date": "2024-06-06", "categories": { "coding": 15000, "browsing": 7000, "social": 2000 } }, // Possible Friday dip
          { "date": "2024-06-07", "categories": { "coding": 10000, "browsing": 8000, "social": 2500 } },
          { "date": "2024-06-08", "categories": { "coding": 25000, "browsing": 5000, "social": 800 } },
          { "date": "2024-06-09", "categories": { "coding": 26000, "browsing": 5300, "social": 900 } },
          { "date": "2024-06-10", "categories": { "coding": 27000, "browsing": 5800, "social": 1000 } },
          { "date": "2024-06-11", "categories": { "coding": 28000, "browsing": 6100, "social": 1100 } },
          { "date": "2024-06-12", "categories": { "coding": 29000, "browsing": 6600, "social": 1200 } },
          { "date": "2024-06-13", "categories": { "coding": 16000, "browsing": 7200, "social": 2100 } }, // Possible Friday dip
          { "date": "2024-06-14", "categories": { "coding": 11000, "browsing": 8200, "social": 2600 } },
          { "date": "2024-06-15", "categories": { "coding": 30000, "browsing": 5100, "social": 700 } },
        ];
        const window = 14; // Son 14 gün için analiz

        const result = await getBehavioralTrends(mockDailyTotals, window);
        trendingCategories.value = result.trending_categories;
        seasonality.value = result.seasonality;
        summary.value = result.summary;
      } catch (e: any) {
        error.value = e.message || 'Veri çekilirken bir hata oluştu.';
        console.error('Davranışsal Desenler çekilirken hata:', e);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchBehavioralTrends();
    });

    return {
      loading,
      error,
      trendingCategories,
      seasonality,
      summary,
    };
  },
});
</script>

<style scoped>
.behavioral-trends-display {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin-top: 20px;
}

.summary {
  margin-top: 20px;
  font-style: italic;
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