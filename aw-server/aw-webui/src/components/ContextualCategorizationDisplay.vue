<template>
  <div class="contextual-categorization-display">
    <h2>Bağlamsal Kategorizasyon (Başlık/İçerik Analizi)</h2>
    <div v-if="loading">Yükleniyor...</div>
    <div v-else-if="error" class="error">Hata: {{ error }}</div>
    <div v-else>
      <div v-if="category">
        <p>
          <strong>Kategori:</strong>
          {{ category }}
          <br />
          <strong>Güven:</strong>
          {{ (confidence * 100).toFixed(2) }}%
          <br />
          <strong>Gerekçe:</strong>
          {{ rationale }}
        </p>
      </div>
      <div v-else>
        <p>Kategori bulunamadı.</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { getContextualCategorization } from '~/util/awclient';

export default defineComponent({
  name: 'ContextualCategorizationDisplay',
  setup() {
    const loading = ref(true);
    const error = ref<string | null>(null);
    const category = ref<string | null>(null);
    const confidence = ref<number | null>(null);
    const rationale = ref<string>('');

    const fetchContextualCategorization = async () => {
      loading.value = true;
      error.value = null;
      try {
        // TODO: Replace with actual context data from aw-server/aw-webui
        const mockContext =
          'How to implement a responsive navigation bar in pure CSS and JavaScript';
        const mockLanguage = 'en';

        const result = await getContextualCategorization(mockContext, mockLanguage);
        category.value = result.category;
        confidence.value = result.confidence;
        rationale.value = result.rationale;
      } catch (e: any) {
        error.value = e.message || 'Veri çekilirken bir hata oluştu.';
        console.error('Bağlamsal Kategorizasyon çekilirken hata:', e);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchContextualCategorization();
    });

    return {
      loading,
      error,
      category,
      confidence,
      rationale,
    };
  },
});
</script>

<style scoped>
.contextual-categorization-display {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
  margin-top: 20px;
}

.error {
  color: red;
}
</style>
