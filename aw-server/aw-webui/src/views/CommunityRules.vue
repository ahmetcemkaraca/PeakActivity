<template>
  <div class="community-rules-view aw-container">
    <h3 class="text-center mb-4">Topluluk Kuralları Yönetimi</h3>

    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Yeni Kural Ekle</h5>
        <b-form @submit.prevent="addRule">
          <b-form-group label="Desen:" label-for="input-pattern">
            <b-form-input
              id="input-pattern"
              v-model="newRule.pattern"
              placeholder="*chrome.exe*stackoverflow.com*"
              required
            ></b-form-input>
          </b-form-group>

          <b-form-group label="Kategori:" label-for="input-category" class="mt-3">
            <b-form-input
              id="input-category"
              v-model="newRule.category"
              placeholder="Yazılım Geliştirme"
              required
            ></b-form-input>
          </b-form-group>

          <b-form-group label="Popülerlik (Opsiyonel):" label-for="input-popularity" class="mt-3">
            <b-form-input
              id="input-popularity"
              v-model.number="newRule.popularity"
              type="number"
              placeholder="100"
            ></b-form-input>
          </b-form-group>

          <b-button type="submit" variant="primary" class="mt-4" :disabled="addingRule">
            <span v-if="addingRule">Ekleniyor...</span>
            <span v-else>Kural Ekle</span>
          </b-button>
          <b-alert v-if="addRuleSuccess" show variant="success" class="mt-3">
            Kural başarıyla eklendi!
          </b-alert>
          <b-alert v-if="addRuleError" show variant="danger" class="mt-3">
            Hata: {{ addRuleError }}
          </b-alert>
        </b-form>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Mevcut Topluluk Kuralları</h5>
        <div v-if="loadingRules">Kurallar yükleniyor...</div>
        <div v-else-if="rulesError" class="error">Hata: {{ rulesError }}</div>
        <div v-else-if="communityRules.length === 0">
          <p>
            Henüz topluluk kuralı bulunamadı. Yukarıdaki formu kullanarak yeni bir kural ekleyin.
          </p>
        </div>
        <div v-else>
          <ul class="list-group">
            <li
              v-for="rule in communityRules"
              :key="rule.pattern + rule.category"
              class="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <strong>Desen:</strong>
                {{ rule.pattern }}
                <br />
                <strong>Kategori:</strong>
                {{ rule.category }}
                <span v-if="rule.popularity">(Popülerlik: {{ rule.popularity }})</span>
              </div>
              <b-button variant="danger" size="sm" @click="deleteRule(rule.pattern, rule.category)">
                Sil
              </b-button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-body">
        <h5 class="card-title">Olayı Kural ile Eşleştir</h5>
        <b-form @submit.prevent="matchEvent">
          <b-form-group label="Uygulama:" label-for="match-app">
            <b-form-input
              id="match-app"
              v-model="eventToMatch.app"
              placeholder="chrome.exe"
            ></b-form-input>
          </b-form-group>

          <b-form-group label="Başlık:" label-for="match-title" class="mt-3">
            <b-form-input
              id="match-title"
              v-model="eventToMatch.title"
              placeholder="Stack Overflow - Vue.js Lifecycle Hooks"
            ></b-form-input>
          </b-form-group>

          <b-form-group label="URL:" label-for="match-url" class="mt-3">
            <b-form-input
              id="match-url"
              v-model="eventToMatch.url"
              placeholder="https://stackoverflow.com/questions/123/vue-lifecycle"
            ></b-form-input>
          </b-form-group>

          <b-button type="submit" variant="info" class="mt-4" :disabled="matchingEvent">
            <span v-if="matchingEvent">Eşleştiriliyor...</span>
            <span v-else>Eşleştir</span>
          </b-button>

          <div v-if="matchResult" class="mt-3">
            <p v-if="matchResult.matched_rule">
              <strong>Eşleşen Kural:</strong>
              {{ matchResult.matched_rule.pattern }} (Kategori: {{ matchResult.category }})
            </p>
            <p v-else>
              <strong class="text-danger">Hiçbir kural eşleşmedi.</strong>
            </p>
          </div>
          <b-alert v-if="matchError" show variant="danger" class="mt-3">
            Hata: {{ matchError }}
          </b-alert>
        </b-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { httpsCallable } from 'firebase/functions';
import { functions } from '~/firebase';

interface CommunityRule {
  pattern: string;
  category: string;
  popularity?: number;
}

interface ActivityEvent {
  app: string;
  title: string;
  url: string | null;
}

interface CommunityRuleMatchOutput {
  matched_rule: CommunityRule | null;
  category: string | null;
  source: string;
}

export default defineComponent({
  name: 'CommunityRules',
  setup() {
    const newRule = ref<CommunityRule>({ pattern: '', category: '', popularity: 0 });
    const communityRules = ref<CommunityRule[]>([]);
    const loadingRules = ref(true);
    const rulesError = ref<string | null>(null);
    const addingRule = ref(false);
    const addRuleSuccess = ref(false);
    const addRuleError = ref<string | null>(null);

    const eventToMatch = ref<ActivityEvent>({ app: '', title: '', url: null });
    const matchingEvent = ref(false);
    const matchResult = ref<CommunityRuleMatchOutput | null>(null);
    const matchError = ref<string | null>(null);

    // Firebase Cloud Functions references
    const addCommunityRuleCallable = httpsCallable(functions, 'addCommunityRule');
    const getCommunityRulesCallable = httpsCallable(functions, 'getCommunityRules');
    const deleteCommunityRuleCallable = httpsCallable(functions, 'deleteCommunityRule');
    const matchCommunityRuleCallable = httpsCallable(functions, 'matchCommunityRule');

    const fetchCommunityRules = async () => {
      loadingRules.value = true;
      rulesError.value = null;
      try {
        const result = await getCommunityRulesCallable();
        communityRules.value = (result.data as { data: CommunityRule[] }).data;
      } catch (e: any) {
        rulesError.value = e.message || 'Topluluk kuralları çekilirken bir hata oluştu.';
        console.error('Topluluk kuralları çekilirken hata:', e);
      } finally {
        loadingRules.value = false;
      }
    };

    const addRule = async () => {
      addingRule.value = true;
      addRuleSuccess.value = false;
      addRuleError.value = null;
      try {
        // Popülerlik boşsa null olarak ayarla veya varsayılan değer ver
        const ruleToAdd = {
          ...newRule.value,
          popularity: newRule.value.popularity === 0 ? null : newRule.value.popularity, // 0 ise null yap
        };
        await addCommunityRuleCallable(ruleToAdd);
        addRuleSuccess.value = true;
        newRule.value = { pattern: '', category: '', popularity: 0 }; // Formu temizle
        fetchCommunityRules(); // Kuralları yenile
      } catch (e: any) {
        addRuleError.value = e.message || 'Kural eklenirken bir hata oluştu.';
        console.error('Kural eklenirken hata:', e);
      } finally {
        addingRule.value = false;
      }
    };

    const deleteRule = async (pattern: string, category: string) => {
      if (!confirm('Bu kuralı silmek istediğinizden emin misiniz?')) {
        return;
      }
      try {
        await deleteCommunityRuleCallable({ pattern, category });
        fetchCommunityRules(); // Kuralları yenile
      } catch (e: any) {
        alert('Kural silinirken bir hata oluştu: ' + (e.message || 'Bilinmeyen Hata'));
        console.error('Kural silinirken hata:', e);
      }
    };

    const matchEvent = async () => {
      matchingEvent.value = true;
      matchResult.value = null;
      matchError.value = null;
      try {
        const result = await matchCommunityRuleCallable({
          event: eventToMatch.value,
          communityRules: communityRules.value,
        });
        matchResult.value = (result.data as { data: CommunityRuleMatchOutput }).data;
      } catch (e: any) {
        matchError.value = e.message || 'Olay eşleştirilirken bir hata oluştu.';
        console.error('Olay eşleştirilirken hata:', e);
      } finally {
        matchingEvent.value = false;
      }
    };

    onMounted(() => {
      fetchCommunityRules();
    });

    return {
      newRule,
      communityRules,
      loadingRules,
      rulesError,
      addingRule,
      addRuleSuccess,
      addRuleError,
      eventToMatch,
      matchingEvent,
      matchResult,
      matchError,
      addRule,
      deleteRule,
      matchEvent,
    };
  },
});
</script>

<style scoped lang="scss">
@import '../../style/globals';

.community-rules-view {
  padding: 30px;
  max-width: 900px;
  margin: 0 auto;
}

.card {
  background-color: var(--background-color);
  border: 1px solid var(--light-border-color);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.card-title {
  color: var(--active-highlight-color);
  font-size: 1.4em;
  font-weight: bold;
}

.form-group label {
  color: var(--text-color);
}

.form-control,
.b-form-input {
  border-color: var(--light-border-color);
  background-color: var(--input-bg-color);
  color: var(--text-color);
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

.btn-info {
  background-color: var(--info-color);
  border-color: var(--info-color);
  color: white;
  &:hover {
    background-color: darken(var(--info-color), 10%);
    border-color: darken(var(--info-color), 10%);
  }
}

.btn-danger {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
  color: white;
  &:hover {
    background-color: darken(var(--danger-color), 10%);
    border-color: darken(var(--danger-color), 10%);
  }
}

.list-group-item {
  background-color: var(--background-color);
  border-color: var(--light-border-color);
  color: var(--text-color);
}

.error {
  color: red;
}
</style>
