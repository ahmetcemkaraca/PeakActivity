<template>
  <div class="automation-rules-container">
    <h2>Otomasyon Kuralları Yönetimi</h2>

    <!-- Yeni Kural Ekle Formu -->
    <div class="add-rule-section">
      <h3>Yeni Kural Ekle</h3>
      <form @submit.prevent="addRule">
        <div class="form-group">
          <label for="ruleName">Kural Adı:</label>
          <input type="text" id="ruleName" v-model="newRule.name" required />
        </div>
        <div class="form-group">
          <label for="ruleTrigger">Tetikleyici (JSON):</label>
          <textarea id="ruleTrigger" v-model="newRule.trigger" required rows="5"></textarea>
          <small>Örnek: {"type": "activity_event", "threshold": 60, "app_name": "vscode"}</small>
        </div>
        <div class="form-group">
          <label for="ruleAction">Eylem (JSON):</label>
          <textarea id="ruleAction" v-model="newRule.action" required rows="5"></textarea>
          <small>
            Örnek: {"type": "send_notification", "message": "Çok fazla vscode kullandınız!"}
          </small>
        </div>
        <button type="submit" class="btn btn-primary">Kural Ekle</button>
      </form>
    </div>

    <!-- Mevcut Kurallar Listesi -->
    <div class="rules-list-section">
      <h3>Mevcut Kurallar</h3>
      <p v-if="loading">Kurallar yükleniyor...</p>
      <p v-if="error" class="error-message">{{ error }}</p>
      <ul v-if="rules.length">
        <li v-for="rule in rules" :key="rule.id" class="rule-item">
          <div v-if="editingRuleId !== rule.id">
            <h4>{{ rule.name }}</h4>
            <p>
              <strong>Tetikleyici:</strong>
              {{ JSON.stringify(rule.trigger, null, 2) }}
            </p>
            <p>
              <strong>Eylem:</strong>
              {{ JSON.stringify(rule.action, null, 2) }}
            </p>
            <button @click="startEdit(rule)" class="btn btn-secondary">Düzenle</button>
            <button @click="deleteRule(rule.id)" class="btn btn-danger">Sil</button>
          </div>
          <div v-else class="edit-form">
            <h4>Kuralı Düzenle: {{ editingRule.name }}</h4>
            <div class="form-group">
              <label for="editRuleName">Kural Adı:</label>
              <input type="text" id="editRuleName" v-model="editingRule.name" required />
            </div>
            <div class="form-group">
              <label for="editRuleTrigger">Tetikleyici (JSON):</label>
              <textarea
                id="editRuleTrigger"
                v-model="editingRule.trigger"
                required
                rows="5"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="editRuleAction">Eylem (JSON):</label>
              <textarea
                id="editRuleAction"
                v-model="editingRule.action"
                required
                rows="5"
              ></textarea>
            </div>
            <button @click="updateRule" class="btn btn-primary">Güncelle</button>
            <button @click="cancelEdit" class="btn btn-secondary">İptal</button>
          </div>
        </li>
      </ul>
      <p v-else-if="!loading && !error">Henüz hiç otomasyon kuralı yok.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuthStore } from '../stores/auth';

const functionsInstance = functions;
const authStore = useAuthStore();

const rules = ref([]);
const loading = ref(true);
const error = ref(null);

const newRule = reactive({
  name: '',
  trigger: '',
  action: '',
});

const editingRuleId = ref(null);
const editingRule = reactive({
  id: '',
  name: '',
  trigger: '',
  action: '',
});

// Kuralları Yükle
const fetchRules = async () => {
  loading.value = true;
  error.value = null;
  try {
    const getAllAutomationRulesCallable = httpsCallable(functionsInstance, 'getAllAutomationRules');
    const response = await getAllAutomationRulesCallable();
    rules.value = response.data.rules || [];
  } catch (err) {
    console.error('Otomasyon kuralları getirilirken hata:', err);
    error.value = 'Otomasyon kuralları yüklenirken bir hata oluştu.';
  } finally {
    loading.value = false;
  }
};

// Yeni Kural Ekle
const addRule = async () => {
  if (!authStore.user) {
    alert('Kural eklemek için giriş yapmalısınız.');
    return;
  }
  try {
    const createAutomationRuleCallable = httpsCallable(functionsInstance, 'createAutomationRule');
    const ruleData = {
      name: newRule.name,
      trigger: JSON.parse(newRule.trigger),
      action: JSON.parse(newRule.action),
    };
    await createAutomationRuleCallable({ ruleData });
    alert('Kural başarıyla eklendi!');
    newRule.name = '';
    newRule.trigger = '';
    newRule.action = '';
    fetchRules(); // Kuralları yeniden yükle
  } catch (err) {
    console.error('Kural eklenirken hata:', err);
    alert(`Kural eklenirken hata oluştu: ${err.message}`);
  }
};

// Kuralı Düzenlemeye Başla
const startEdit = rule => {
  editingRuleId.value = rule.id;
  editingRule.id = rule.id;
  editingRule.name = rule.name;
  editingRule.trigger = JSON.stringify(rule.trigger, null, 2);
  editingRule.action = JSON.stringify(rule.action, null, 2);
};

// Kural Güncelle
const updateRule = async () => {
  if (!authStore.user) {
    alert('Kuralı güncellemek için giriş yapmalısınız.');
    return;
  }
  try {
    const updateAutomationRuleCallable = httpsCallable(functionsInstance, 'updateAutomationRule');
    const updates = {
      name: editingRule.name,
      trigger: JSON.parse(editingRule.trigger),
      action: JSON.parse(editingRule.action),
    };
    await updateAutomationRuleCallable({ ruleId: editingRule.id, updates });
    alert('Kural başarıyla güncellendi!');
    cancelEdit();
    fetchRules(); // Kuralları yeniden yükle
  } catch (err) {
    console.error('Kural güncellenirken hata:', err);
    alert(`Kural güncellenirken hata oluştu: ${err.message}`);
  }
};

// Düzenlemeyi İptal Et
const cancelEdit = () => {
  editingRuleId.value = null;
  editingRule.id = '';
  editingRule.name = '';
  editingRule.trigger = '';
  editingRule.action = '';
};

// Kuralı Sil
const deleteRule = async ruleId => {
  if (!authStore.user) {
    alert('Kuralı silmek için giriş yapmalısınız.');
    return;
  }
  if (confirm('Bu kuralı silmek istediğinizden emin misiniz?')) {
    try {
      const deleteAutomationRuleCallable = httpsCallable(functionsInstance, 'deleteAutomationRule');
      await deleteAutomationRuleCallable({ ruleId });
      alert('Kural başarıyla silindi!');
      fetchRules(); // Kuralları yeniden yükle
    } catch (err) {
      console.error('Kural silinirken hata:', err);
      alert(`Kural silinirken hata oluştu: ${err.message}`);
    }
  }
};

onMounted(() => {
  authStore.initAuthService();
  fetchRules();
});
</script>

<style scoped>
.automation-rules-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
  color: #333;
}

h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
}

h3 {
  color: #34495e;
  margin-top: 25px;
  margin-bottom: 15px;
}

.add-rule-section,
.rules-list-section {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type='text'],
.form-group textarea {
  width: calc(100% - 22px);
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group small {
  display: block;
  color: #777;
  margin-top: 5px;
}

.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.btn-primary {
  background-color: #4caf50;
  color: white;
  margin-right: 10px;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
  margin-right: 10px;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.rule-item {
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
}

.rule-item h4 {
  margin-top: 0;
  color: #2c3e50;
}

.rule-item p {
  white-space: pre-wrap; /* JSON çıktısının düzgün görünmesi için */
  word-break: break-all;
}

.rule-item button {
  margin-top: 10px;
  margin-right: 10px;
}

.edit-form {
  border-top: 1px solid #eee;
  padding-top: 15px;
  margin-top: 10px;
}

.error-message {
  color: #dc3545;
  font-weight: bold;
  text-align: center;
}
</style>
