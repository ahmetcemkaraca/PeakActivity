<template>
  <div class="behavioral-trends-view container-fluid">
    <h2 class="mt-4 mb-3">Davranışsal Eğilimler Analizi</h2>
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
        <h4 class="mb-0">Davranışsal Eğilimler Sonuçları</h4>
      </div>
      <div class="card-body">
        <pre class="bg-light p-3 rounded mb-3">{{ JSON.stringify(insight, null, 2) }}</pre>
        <BarChart
          v-if="chartData.datasets.length"
          :chartData="chartData"
          :chartOptions="chartOptions"
        />
      </div>
    </div>

    <!-- Gerçek Zamanlı Davranışsal Örüntüler Bölümü -->
    <div class="card shadow-sm mt-4">
      <div class="card-header bg-success text-white">
        <h4 class="mb-0">Gerçek Zamanlı Davranışsal Örüntüler</h4>
      </div>
      <div class="card-body">
        <div v-if="realtimePatterns.length === 0" class="alert alert-info">
          Şu anda aktif gerçek zamanlı davranışsal örüntü bulunmamaktadır.
        </div>
        <ul class="list-group" v-else>
          <li class="list-group-item" v-for="pattern in realtimePatterns" :key="pattern.timestamp">
            <strong>Tür:</strong>
            {{ pattern.pattern_type_display }}
            <br />
            <strong>Açıklama:</strong>
            {{ pattern.description }}
            <br />
            <strong>Zaman:</strong>
            {{ new Date(pattern.timestamp).toLocaleString('tr-TR') }}
            <br />
            <span v-if="pattern.confidence_score">
              <strong>Güven Skoru:</strong>
              {{ pattern.confidence_score.toFixed(2) }}
              <br />
            </span>
            <span v-if="pattern.model_version">
              <strong>Model Versiyonu:</strong>
              {{ pattern.model_version }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
import { AIFeatureService } from '@/util/ai-feature-service';
import BarChart from '@/components/BarChart.vue';
import { ChartData, ChartOptions } from 'chart.js';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  limit,
} from 'firebase/firestore'; // limit ekledik
import { getAuth } from 'firebase/auth';

interface RealtimeBehavioralPattern {
  user_id: string;
  timestamp: string; // Olayın zaman damgası
  pattern_type:
    | 'idle_detection'
    | 'focus_shift'
    | 'high_activity'
    | 'low_activity'
    | 'unusual_category_use';
  description: string; // Tespit edilen örüntünün açıklaması
  confidence_score?: number; // Güven skoru (0-1 arası, ML entegrasyonu için)
  related_activity_id?: string; // İlgili aktivite olayının ID'si
  metadata?: { [key: string]: any }; // Ek meta veriler
  model_version?: string; // Kullanılan modelin versiyonu
  pattern_type_display?: string; // Ön uçta gösterilecek okunabilir tür adı
}

export default defineComponent({
  name: 'BehavioralTrendsView',
  components: {
    BarChart,
  },
  setup() {
    const userId = ref('test_user'); // Varsayılan değer
    const timeRange = ref('last 7 days'); // Varsayılan değer
    const insight = ref<any>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const realtimePatterns = ref<RealtimeBehavioralPattern[]>([]);
    const realtimeUnsubscribe = ref<Unsubscribe | null>(null);

    const fetchInsight = async () => {
      loading.value = true;
      error.value = null;
      insight.value = null;
      try {
        insight.value = await AIFeatureService.fetchBehavioralTrendsInsight(
          userId.value,
          timeRange.value
        );
      } catch (err: any) {
        error.value = err.message || 'Davranışsal eğilimler içgörüsü getirilirken bir hata oluştu.';
      } finally {
        loading.value = false;
      }
    };

    const chartData = computed<ChartData<'bar'>>(() => {
      if (!insight.value || !insight.value.trends) {
        return { labels: [], datasets: [] };
      }

      const labels = insight.value.trends.map((t: any) => t.category || t.date);
      const data = insight.value.trends.map((t: any) => t.duration || t.value);

      const datasets = [
        {
          label: 'Süre (saat)',
          backgroundColor: '#28a745',
          borderColor: '#28a745',
          data: data.map((d: number) => d / 3600), // Saniyeyi saate çevir
        },
      ];
      return { labels, datasets };
    });

    const chartOptions = computed<ChartOptions<'bar'>>(() => ({
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Kategori / Tarih',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Süre (Saat)',
          },
          beginAtZero: true,
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

    const startRealtimeBehavioralPatternListener = () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.warn(
          'Gerçek zamanlı davranışsal örüntü dinleyicisini başlatmak için kullanıcı oturum açmış olmalıdır.'
        );
        realtimePatterns.value = [];
        return;
      }

      if (realtimeUnsubscribe.value) {
        realtimeUnsubscribe.value();
        realtimeUnsubscribe.value = null;
      }

      const db = getFirestore();
      const patternsRef = collection(db, `users/${user.uid}/realtime_behavioral_patterns`);

      // En yeni örüntüleri almak için sorgu
      const q = query(patternsRef, orderBy('timestamp', 'desc'), limit(10)); // Son 10 örüntüyü getir

      realtimeUnsubscribe.value = onSnapshot(
        q,
        snapshot => {
          const fetchedPatterns: RealtimeBehavioralPattern[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            fetchedPatterns.push({
              ...data,
              timestamp:
                data.timestamp instanceof Date ? data.timestamp.toISOString() : data.timestamp, // Firestore Timestamp'ı ISO string'e çevir
              pattern_type_display: getPatternTypeDisplay(data.pattern_type), // Okunabilir isim
            } as RealtimeBehavioralPattern);
          });
          realtimePatterns.value = fetchedPatterns;
          console.log(
            'Gerçek zamanlı davranışsal örüntüler güncellendi:',
            realtimePatterns.value.length
          );
        },
        err => {
          console.error('Gerçek zamanlı davranışsal örüntü dinlenirken hata oluştu:', err);
          error.value = 'Gerçek zamanlı örüntüler yüklenemedi.';
        }
      );
    };

    // Pattern type'ı okunabilir bir string'e çeviren helper fonksiyon
    const getPatternTypeDisplay = (type: string): string => {
      switch (type) {
        case 'idle_detection':
          return 'Hareketsizlik Tespiti';
        case 'focus_shift':
          return 'Odak Kayması';
        case 'high_activity':
          return 'Yüksek Aktivite';
        case 'low_activity':
          return 'Düşük Aktivite';
        case 'unusual_category_use':
          return 'Alışılmadık Kategori Kullanımı';
        default:
          return type;
      }
    };

    onMounted(() => {
      fetchInsight();
      startRealtimeBehavioralPatternListener(); // Bileşen yüklendiğinde dinleyiciyi başlat
    });

    onUnmounted(() => {
      if (realtimeUnsubscribe.value) {
        realtimeUnsubscribe.value(); // Bileşen kaldırıldığında dinleyiciyi temizle
      }
    });

    return {
      userId,
      timeRange,
      insight,
      loading,
      error,
      fetchInsight,
      chartData,
      chartOptions,
      realtimePatterns,
    };
  },
});
</script>

<style scoped>
.behavioral-trends-view {
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
.card-header.bg-success {
  background-color: #28a745 !important;
}
.list-group-item {
  background-color: var(--background-color-light);
  border-color: var(--light-border-color);
  color: var(--text-color);
}
</style>
