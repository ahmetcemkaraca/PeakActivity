<template>
  <div class="contextual-categorization-container aw-container">
    <h3 class="text-center mb-4">Bağlamsal Kategorizasyon Yönetimi</h3>

    <!-- Yeni Kural Ekle Formu -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Yeni Bağlamsal Kural Ekle</h5>
        <b-form @submit.prevent="addRule">
          <b-form-group label="Kural Adı:" label-for="input-ruleName">
            <b-form-input
              id="input-ruleName"
              v-model="newRule.name"
              placeholder="Toplantı Notları Kategorizasyonu"
              required
            ></b-form-input>
          </b-form-group>
          <b-form-group
            label="Bağlam Deseni (Regex):"
            label-for="input-contextPattern"
            class="mt-3"
          >
            <b-form-input
              id="input-contextPattern"
              v-model="newRule.contextPattern"
              placeholder=".*toplantı notları.*|.*meeting notes.*"
              required
            ></b-form-input>
            <small class="form-text text-muted">
              Örnek: `.*toplantı notları.*` veya `.*raporlama.*`
            </small>
          </b-form-group>
          <b-form-group label="Hedef Kategori:" label-for="input-category" class="mt-3">
            <b-form-input
              id="input-category"
              v-model="newRule.category"
              placeholder="İş / Toplantı"
              required
            ></b-form-input>
            <small class="form-text text-muted">Örnek: `İş`, `Eğitim`, `Geliştirme`</small>
          </b-form-group>
          <b-form-group
            label="Güven Seviyesi (0.0 - 1.0):"
            label-for="input-confidence"
            class="mt-3"
          >
            <b-form-input
              id="input-confidence"
              v-model.number="newRule.confidence"
              type="number"
              step="0.01"
              min="0"
              max="1"
              required
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

    <!-- Mevcut Kurallar Listesi -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Mevcut Bağlamsal Kurallar</h5>
        <div v-if="loadingRules">Kurallar yükleniyor...</div>
        <div v-else-if="rulesError" class="error">Hata: {{ rulesError }}</div>
        <div v-else-if="rules.length === 0">
          <p>Henüz hiç bağlamsal kural yok. Yukarıdaki formu kullanarak yeni bir kural ekleyin.</p>
        </div>
        <ul v-else class="list-group">
          <li v-for="rule in rules" :key="rule.id" class="list-group-item">
            <div v-if="editingRuleId !== rule.id">
              <h6>{{ rule.name }}</h6>
              <p>
                <strong>Desen:</strong>
                <code>{{ rule.contextPattern }}</code>
              </p>
              <p>
                <strong>Kategori:</strong>
                {{ rule.category }}
              </p>
              <p>
                <strong>Güven:</strong>
                %{{ (rule.confidence * 100).toFixed(2) }}
              </p>
              <div class="d-flex justify-content-end">
                <b-button size="sm" variant="secondary" class="mr-2" @click="startEdit(rule)">
                  Düzenle
                </b-button>
                <b-button size="sm" variant="danger" @click="deleteRule(rule.id)">Sil</b-button>
              </div>
            </div>
            <div v-else>
              <h6>Kuralı Düzenle: {{ editingRule.name }}</h6>
              <b-form-group label="Kural Adı:" label-for="edit-ruleName">
                <b-form-input id="edit-ruleName" v-model="editingRule.name" required></b-form-input>
              </b-form-group>
              <b-form-group
                label="Bağlam Deseni (Regex):"
                label-for="edit-contextPattern"
                class="mt-3"
              >
                <b-form-input
                  id="edit-contextPattern"
                  v-model="editingRule.contextPattern"
                  required
                ></b-form-input>
              </b-form-group>
              <b-form-group label="Hedef Kategori:" label-for="edit-category" class="mt-3">
                <b-form-input
                  id="edit-category"
                  v-model="editingRule.category"
                  required
                ></b-form-input>
              </b-form-group>
              <b-form-group
                label="Güven Seviyesi (0.0 - 1.0):"
                label-for="edit-confidence"
                class="mt-3"
              >
                <b-form-input
                  id="edit-confidence"
                  v-model.number="editingRule.confidence"
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  required
                ></b-form-input>
              </b-form-group>
              <div class="d-flex justify-content-end">
                <b-button
                  size="sm"
                  variant="primary"
                  class="mr-2"
                  @click="updateRule"
                  :disabled="updatingRule"
                >
                  Güncelle
                </b-button>
                <b-button size="sm" variant="secondary" @click="cancelEdit">İptal</b-button>
              </div>
              <b-alert v-if="updateRuleError" show variant="danger" class="mt-3">
                Hata: {{ updateRuleError }}
              </b-alert>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Bağlam Kategorizasyon Testi -->
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Bağlam Kategorizasyon Testi</h5>
        <b-form @submit.prevent="testCategorization">
          <b-form-group label="Test Bağlamı Metni:" label-for="test-context">
            <b-form-textarea
              id="test-context"
              v-model="testContextInput"
              rows="5"
              placeholder="Kategorize edilecek metni girin."
            ></b-form-textarea>
          </b-form-group>
          <b-form-group label="Dil (Opsiyonel, ISO 639-1):" label-for="test-language" class="mt-3">
            <b-form-input
              id="test-language"
              v-model="testLanguageInput"
              placeholder="tr veya en"
            ></b-form-input>
          </b-form-group>
          <b-button type="submit" variant="info" class="mt-4" :disabled="testing">
            Kategorize Et
          </b-button>

          <div v-if="categorizationResult" class="mt-3">
            <h6>Kategorizasyon Sonucu:</h6>
            <p>
              <strong>Kategori:</strong>
              {{ categorizationResult.category }}
            </p>
            <p>
              <strong>Güven Seviyesi:</strong>
              %{{ (categorizationResult.confidence * 100).toFixed(2) }}
            </p>
            <p>
              <strong>Gerekçe:</strong>
              {{ categorizationResult.rationale }}
            </p>
          </div>
          <b-alert v-if="categorizationError" show variant="danger" class="mt-3">
            Hata: {{ categorizationError }}
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
import { useAuthStore } from '~/stores/auth';

interface ContextualRule {
  id?: string;
  name: string;
  contextPattern: string;
  category: string;
  confidence: number;
}

interface ContextualCategorizationOutput {
  category: string;
  confidence: number;
  rationale: string;
}

export default defineComponent({
  name: 'ContextualCategorization',
  setup() {
    const authStore = useAuthStore();

    const rules = ref<ContextualRule[]>([]);
    const loadingRules = ref(true);
    const rulesError = ref<string | null>(null);

    const newRule = ref<ContextualRule>({
      name: '',
      contextPattern: '',
      category: '',
      confidence: 0.8,
    });
    const addingRule = ref(false);
    const addRuleSuccess = ref(false);
    const addRuleError = ref<string | null>(null);

    const editingRuleId = ref<string | null>(null);
    const editingRule = ref<ContextualRule>({
      name: '',
      contextPattern: '',
      category: '',
      confidence: 0,
    });
    const updatingRule = ref(false);
    const updateRuleError = ref<string | null>(null);

    const testContextInput = ref('');
    const testLanguageInput = ref('');
    const categorizationResult = ref<ContextualCategorizationOutput | null>(null);
    const testing = ref(false);
    const categorizationError = ref<string | null>(null);

    // Firebase Cloud Functions references
    const getCustomContextualRulesCallable = httpsCallable(functions, 'getCustomContextualRules');
    const createCustomContextualRuleCallable = httpsCallable(
      functions,
      'createCustomContextualRule'
    );
    const updateCustomContextualRuleCallable = httpsCallable(
      functions,
      'updateCustomContextualRule'
    );
    const deleteCustomContextualRuleCallable = httpsCallable(
      functions,
      'deleteCustomContextualRule'
    );
    const categorizeContextCallable = httpsCallable(functions, 'categorizeContext');

    const fetchRules = async () => {
      loadingRules.value = true;
      rulesError.value = null;
      try {
        const result = await getCustomContextualRulesCallable();
        rules.value = (result.data as { data: ContextualRule[] }).data;
      } catch (e: any) {
        rulesError.value = e.message || 'Bağlamsal kurallar çekilirken bir hata oluştu.';
        console.error('Bağlamsal kurallar çekilirken hata:', e);
      } finally {
        loadingRules.value = false;
      }
    };

    const addRule = async () => {
      if (!authStore.user) {
        alert('Kural eklemek için giriş yapmalısınız.');
        return;
      }
      addingRule.value = true;
      addRuleSuccess.value = false;
      addRuleError.value = null;
      try {
        await createCustomContextualRuleCallable(newRule.value);
        addRuleSuccess.value = true;
        newRule.value = { name: '', contextPattern: '', category: '', confidence: 0.8 };
        fetchRules();
      } catch (e: any) {
        addRuleError.value = e.message || 'Kural eklenirken bir hata oluştu.';
        console.error('Kural eklenirken hata:', e);
      } finally {
        addingRule.value = false;
      }
    };

    const startEdit = (rule: ContextualRule) => {
      editingRuleId.value = rule.id || null; // id'nin mevcut olduğundan emin olun
      editingRule.value = { ...rule };
    };

    const cancelEdit = () => {
      editingRuleId.value = null;
      updateRuleError.value = null;
    };

    const updateRule = async () => {
      if (!authStore.user) {
        alert('Kuralı güncellemek için giriş yapmalısınız.');
        return;
      }
      if (!editingRule.value.id) {
        alert('Güncellenecek kural kimliği bulunamadı.');
        return;
      }
      updatingRule.value = true;
      updateRuleError.value = null;
      try {
        await updateCustomContextualRuleCallable(editingRule.value);
        editingRuleId.value = null;
        fetchRules();
      } catch (e: any) {
        updateRuleError.value = e.message || 'Kural güncellenirken bir hata oluştu.';
        console.error('Kural güncellenirken hata:', e);
      } finally {
        updatingRule.value = false;
      }
    };

    const deleteRule = async (ruleId: string) => {
      if (!authStore.user) {
        alert('Kuralı silmek için giriş yapmalısınız.');
        return;
      }
      if (!confirm('Bu kuralı silmek istediğinizden emin misiniz?')) {
        return;
      }
      try {
        await deleteCustomContextualRuleCallable({ id: ruleId });
        fetchRules();
      } catch (e: any) {
        alert('Kural silinirken bir hata oluştu: ' + (e.message || 'Bilinmeyen Hata'));
        console.error('Kural silinirken hata:', e);
      }
    };

    const testCategorization = async () => {
      if (!authStore.user) {
        alert('Kategorizasyon testi yapmak için giriş yapmalısınız.');
        return;
      }
      if (!testContextInput.value.trim()) {
        alert('Lütfen test bağlamı metni girin.');
        return;
      }
      testing.value = true;
      categorizationResult.value = null;
      categorizationError.value = null;
      try {
        const payload: { context: string; language?: string } = { context: testContextInput.value };
        if (testLanguageInput.value.trim()) {
          payload.language = testLanguageInput.value.trim();
        }
        const result = await categorizeContextCallable(payload);
        categorizationResult.value = (result.data as { data: ContextualCategorizationOutput }).data;
      } catch (e: any) {
        categorizationError.value = e.message || 'Kategorizasyon testi sırasında bir hata oluştu.';
        console.error('Kategorizasyon testi sırasında hata:', e);
      } finally {
        testing.value = false;
      }
    };

    onMounted(() => {
      fetchRules();
    });

    return {
      rules,
      loadingRules,
      rulesError,
      newRule,
      addingRule,
      addRuleSuccess,
      addRuleError,
      editingRuleId,
      editingRule,
      updatingRule,
      updateRuleError,
      testContextInput,
      testLanguageInput,
      categorizationResult,
      testing,
      categorizationError,
      addRule,
      startEdit,
      cancelEdit,
      updateRule,
      deleteRule,
      testCategorization,
    };
  },
});
</script>

<style scoped lang="scss">
@import '../../style/globals';

.contextual-categorization-container {
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
.b-form-input,
.b-form-textarea {
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

.btn-secondary {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  color: white;
  &:hover {
    background-color: darken(var(--secondary-color), 10%);
    border-color: darken(var(--secondary-color), 10%);
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
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.error {
  color: red;
}

code {
  background-color: #e9ecef;
  padding: 2px 4px;
  border-radius: 4px;
  color: #c7254e;
}
</style>
