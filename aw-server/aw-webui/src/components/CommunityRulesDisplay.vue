<template>
  <div class="community-rules-display">
    <h2>Topluluk Tabanlı Kural Setleri</h2>
    <div v-if="loading">Yükleniyor...</div>
    <div v-else-if="error" class="error">Hata: {{ error }}</div>
    <div v-else>
      <div v-if="matchedRule">
        <h4>Eşleşen Kural:</h4>
        <ul>
          <li>
            <strong>Desen:</strong>
            {{ matchedRule.pattern }}
            <br />
            <strong>Kategori:</strong>
            {{ matchedRule.category }}
          </li>
        </ul>
        <p>
          Atanan Kategori:
          <strong>{{ category }}</strong>
          (Kaynak: {{ source }})
        </p>
      </div>
      <div v-else>
        <p>Eşleşen kural bulunamadı.</p>
        <p>
          Atanan Kategori:
          <strong>{{ category || 'Yok' }}</strong>
          (Kaynak: {{ source }})
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { applyCommunityRules } from '~/util/awclient';

interface CommunityRule {
  pattern: string;
  category: string;
  popularity?: number;
}

export default defineComponent({
  name: 'CommunityRulesDisplay',
  setup() {
    const loading = ref(true);
    const error = ref<string | null>(null);
    const matchedRule = ref<CommunityRule | null>(null);
    const category = ref<string | null>(null);
    const source = ref<string>('none');

    const fetchCommunityRules = async () => {
      loading.value = true;
      error.value = null;
      try {
        // TODO: Replace with actual event and community_rules data from aw-server/aw-webui
        const mockEvent = { app: 'slack.exe', title: '#general-chat', url: null };
        const mockCommunityRules = [
          { pattern: '*slack.exe', category: 'communication', popularity: 100 },
          { pattern: '*github.com', category: 'coding', popularity: 90 },
          { pattern: '*.google.com/meet', category: 'communication', popularity: 80 },
          { pattern: '*facebook.com', category: 'social', popularity: 70 },
        ];

        const result = await applyCommunityRules(mockEvent, mockCommunityRules);
        matchedRule.value = result.matched_rule;
        category.value = result.category;
        source.value = result.source;
      } catch (e: any) {
        error.value = e.message || 'Veri çekilirken bir hata oluştu.';
        console.error('Topluluk Kuralları çekilirken hata:', e);
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchCommunityRules();
    });

    return {
      loading,
      error,
      matchedRule,
      category,
      source,
    };
  },
});
</script>

<style scoped>
.community-rules-display {
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
