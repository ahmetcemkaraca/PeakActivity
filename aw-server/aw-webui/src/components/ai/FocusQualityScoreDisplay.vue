<template>
  <div class="focus-quality-score-display">
    <h2>Odaklanma Kalitesi Skoru</h2>
    <div v-if="loading">Yükleniyor...</div>
    <div v-else-if="error" class="error">Hata: {{ error }}</div>
    <div v-else>
      <div v-if="dailyAverage !== null" class="daily-average">
        <h3>Günlük Ortalama: {{ dailyAverage }}</h3>
        <p>{{ explanations }}</p>
      </div>
      <div v-else>
        <p>Hesaplanacak uygun oturum bulunamadı.</p>
      </div>

      <div v-if="sessionScores.length">
        <h4>Oturum Detayları:</h4>
        <ul>
          <li v-for="session in sessionScores" :key="session.session_id">
            <strong>Oturum ID:</strong> {{ session.session_id }} <br/>
            <strong>Skor:</strong> {{ session.focus_quality_score }} <br/>
            <strong>Dikkat Dağınıklığı:</strong> {{ session.distractions }} <br/>
            <strong>Bağlam Değiştirme Cezası:</strong> {{ session.context_switch_penalty }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { getFocusQualityScore } from '~/util/awclient';

interface SessionScore {
  session_id: string;
  focus_quality_score: number;
  distractions: number;
  context_switch_penalty: number;
}

export default defineComponent({
  name: 'FocusQualityScoreDisplay',
  setup() {
    const loading = ref(true);
    const error = ref<string | null>(null);
    const sessionScores = ref<SessionScore[]>([]);
    const dailyAverage = ref<number | null>(null);
    const explanations = ref<string>('');

    const fetchFocusQualityScore = async () => {
      loading.value = true;
      error.value = null;
      try {
        // TODO: Replace with actual event data from aw-server/aw-webui
        // For now, using mock data or fetching from a placeholder.
        // You would typically get this from your Vuex store or pass as props.
        const mockEvents = [
          {
            timestamp_start: new Date(Date.now() - 3600 * 1000).toISOString(),
            timestamp_end: new Date().toISOString(),
            duration_sec: 3600,
            app: "Visual Studio Code",
            title: "index.ts",
            category: "coding",
            window_change_count: 5,
            input_frequency: 0.9,
            is_afk: false,
          },
          {
            timestamp_start: new Date(Date.now() - 7200 * 1000).toISOString(),
            timestamp_end: new Date(Date.now() - 3600 * 1000).toISOString(),
            duration_sec: 200,
            app: "Facebook",
            title: "News Feed",
            category: "social",
            window_change_count: 2,
            input_frequency: 0.5,
            is_afk: false,
          }
        ];
        const user_tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // Get user's current timezone

        const result = await getFocusQualityScore(mockEvents, user_tz);
        sessionScores.value = result.session_scores;
        dailyAverage.value = result.daily_average;
        explanations.value = result.explanations;
      } catch (e: any) {
        error.value = e.message || 'Veri çekilirken bir hata oluştu.';
        console.error('Odaklanma Kalitesi Skoru çekilirken hata:', e);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchFocusQualityScore();
    });

    return {
      loading,
      error,
      sessionScores,
      dailyAverage,
      explanations,
    };
  },
});
</script>

<style scoped>
.focus-quality-score-display {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.daily-average {
  margin-bottom: 20px;
  font-size: 1.2em;
  font-weight: bold;
}

.error {
  color: red;
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
</style> 