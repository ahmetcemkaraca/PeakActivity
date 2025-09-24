<template>
  <div class="auto-categorization-display">
    <h2>Otomatik Kategorizasyon ve Etiketleme</h2>
    <div v-if="loading">Yükleniyor...</div>
    <div v-else-if="error" class="error">Hata: {{ error }}</div>
    <div v-else>
      <div v-if="labels.length">
        <h4>Etiketlenen Olaylar:</h4>
        <ul>
          <li v-for="label in labels" :key="label.index">
            <strong>Olay Numarası:</strong>
            {{ label.index }}
            <br />
            <strong>Kategori:</strong>
            {{ label.category }}
            <br />
            <strong>Güven:</strong>
            {{ (label.confidence * 100).toFixed(2) }}%
          </li>
        </ul>
      </div>
      <div v-else>
        <p>Etiketlenecek olay bulunamadı.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { httpsCallable } from 'firebase/functions';
import { functions } from '~/firebase'; // Firebase app instance'ınızın burada olduğundan emin olun
import { useActivityStore } from '~/stores/activity'; // Activity store'u içe aktarın

interface LabelResult {
  index: number;
  category: string;
  confidence: number;
}

export default defineComponent({
  name: 'AutoCategorizationDisplay',
  setup() {
    const loading = ref(true);
    const error = ref<string | null>(null);
    const labels = ref<LabelResult[]>([]);
    const activityStore = useActivityStore(); // Activity store örneğini alın

    // autoCategorize Firebase Cloud Function'ı için çağrılabilir bir referans oluşturun
    const callAutoCategorize = httpsCallable(functions, 'autoCategorize');

    const fetchAutoCategorization = async () => {
      loading.value = true;
      error.value = null;
      try {
        // Activity Store'dan etkinlik verilerini alın
        // Not: activityStore.events'in doğru formatta olduğundan veya uygun şekilde dönüştürüldüğünden emin olun
        // Activity Store'daki getEvents() veya events property'si doğrudan kullanılabilir.
        // Eğer events property'si yoksa veya boşsa, Activity Store'daki bir fetch metodunu çağırmak gerekebilir.
        // Varsayım: activityStore.events, { app: string, title: string, url?: string }[] formatında olayları içeriyor.
        const eventsToCategorize = activityStore.active.events.map(event => ({
          app: event.data.app,
          title: event.data.title,
          url: event.data.url,
        }));

        if (!eventsToCategorize.length) {
          console.log('Kategorize edilecek etkinlik bulunamadı.');
          labels.value = [];
          return;
        }

        const result = await callAutoCategorize({ events: eventsToCategorize });
        // Firebase Cloud Function'dan dönen verinin yapısına göre güncelleyin
        // Varsayım: result.data, { labels: LabelResult[] } şeklinde bir nesnedir.
        labels.value = (result.data as { data: { labels: LabelResult[] } }).data.labels;
      } catch (e: any) {
        error.value = e.message || 'Veri çekilirken bir hata oluştu.';
        console.error('Otomatik Kategorizasyon çekilirken hata:', e);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      // Bileşen yüklendiğinde Activity Store'un olayları yüklemesini bekleyin
      // veya events property'si zaten doluysa doğrudan çağırın
      if (activityStore.active.events.length) {
        fetchAutoCategorization();
      } else {
        // Eğer events henüz yüklenmemişse, Activity Store'daki fetchEvents metodunu çağırın.
        // Bu kısım Activity Store'unuzun nasıl çalıştığına bağlıdır.
        // Örneğin: activityStore.fetchEvents().then(() => fetchAutoCategorization());
        // Şimdilik, Activity Store'da events'in otomatik olarak yüklendiğini varsayıyorum.
        // Eğer yüklenmiyorsa, buraya olayları çekecek uygun bir mekanizma eklenmelidir.
        fetchAutoCategorization();
      }
    });

    return {
      loading,
      error,
      labels,
    };
  },
});
</script>

<style scoped>
.auto-categorization-display {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin-top: 20px;
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
