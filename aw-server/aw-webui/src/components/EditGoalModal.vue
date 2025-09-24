<template>
  <div class="modal-overlay" v-if="isVisible">
    <div class="modal-content">
      <h3>Hedefi Düzenle</h3>
      <form @submit.prevent="saveChanges">
        <div class="form-group">
          <label for="edit-title">Başlık:</label>
          <input type="text" id="edit-title" v-model="editedGoal.title" required />
        </div>
        <div class="form-group">
          <label for="edit-description">Açıklama:</label>
          <textarea id="edit-description" v-model="editedGoal.description"></textarea>
        </div>

        <div class="form-group">
          <label for="edit-type">Hedef Türü:</label>
          <select id="edit-type" v-model="editedGoal.type" @change="resetTargetFields">
            <option value="time_based">Süre Bazlı</option>
            <option value="count_based">Sayı Bazlı</option>
            <option value="habit_based">Alışkanlık Bazlı</option>
            <option value="milestone_based">Dönüm Noktası Bazlı</option>
          </select>
        </div>

        <div v-if="editedGoal.type === 'time_based'">
          <div class="form-group">
            <label for="edit-targetDuration">Hedef Süre (Saniye):</label>
            <input
              type="number"
              id="edit-targetDuration"
              v-model.number="editedGoal.targetDuration"
              min="0"
              required
            />
          </div>
          <div class="form-group">
            <label for="edit-targetDailyDuration">Günlük Hedef Süre (Saniye):</label>
            <input
              type="number"
              id="edit-targetDailyDuration"
              v-model.number="editedGoal.targetDailyDuration"
              min="0"
            />
          </div>
          <div class="form-group">
            <label for="edit-targetWeeklyDuration">Haftalık Hedef Süre (Saniye):</label>
            <input
              type="number"
              id="edit-targetWeeklyDuration"
              v-model.number="editedGoal.targetWeeklyDuration"
              min="0"
            />
          </div>
        </div>

        <div v-else-if="editedGoal.type === 'count_based'">
          <div class="form-group">
            <label for="edit-targetCount">Hedef Sayı:</label>
            <input
              type="number"
              id="edit-targetCount"
              v-model.number="editedGoal.targetCount"
              min="0"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="edit-appNames">Uygulama Adları (Virgülle Ayırın):</label>
          <input type="text" id="edit-appNames" v-model="appNamesInput" />
        </div>

        <div class="form-group">
          <label for="edit-categories">Kategoriler (Virgülle Ayırın):</label>
          <input type="text" id="edit-categories" v-model="categoriesInput" />
        </div>

        <div class="form-group">
          <label for="edit-tags">Etiketler (Virgülle Ayırın):</label>
          <input type="text" id="edit-tags" v-model="tagsInput" />
        </div>

        <div class="modal-actions">
          <button type="submit" class="save-button">Değişiklikleri Kaydet</button>
          <button type="button" @click="closeModal" class="cancel-button">İptal</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { GoalService } from '@/services/goal-service';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'EditGoalModal',
  props: {
    goal: {
      type: Object,
      required: true,
    },
    isVisible: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      editedGoal: { ...this.goal },
      appNamesInput: this.goal.targetCriteria.appNames
        ? this.goal.targetCriteria.appNames.join(', ')
        : '',
      categoriesInput: this.goal.targetCriteria.categories
        ? this.goal.targetCriteria.categories.join(', ')
        : '',
      tagsInput: this.goal.targetCriteria.tags ? this.goal.targetCriteria.tags.join(', ') : '',
    };
  },
  watch: {
    goal: {
      handler(newGoal) {
        this.editedGoal = { ...newGoal };
        this.appNamesInput = newGoal.targetCriteria.appNames
          ? newGoal.targetCriteria.appNames.join(', ')
          : '';
        this.categoriesInput = newGoal.targetCriteria.categories
          ? newGoal.targetCriteria.categories.join(', ')
          : '';
        this.tagsInput = newGoal.targetCriteria.tags ? newGoal.targetCriteria.tags.join(', ') : '';
      },
      deep: true,
      immediate: true,
    },
  },
  methods: {
    resetTargetFields() {
      this.editedGoal.targetDuration = null;
      this.editedGoal.targetDailyDuration = null;
      this.editedGoal.targetWeeklyDuration = null;
      this.editedGoal.targetCount = null;
    },
    async saveChanges() {
      this.editedGoal.targetCriteria.appNames = this.appNamesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      this.editedGoal.targetCriteria.categories = this.categoriesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      this.editedGoal.targetCriteria.tags = this.tagsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      const authStore = useAuthStore();
      const userId = authStore.user?.uid;

      if (!userId) {
        alert('Değişiklikleri kaydetmek için kullanıcı girişi yapmalısınız.');
        return;
      }

      try {
        await GoalService.updateGoal(this.editedGoal.id, this.editedGoal, userId);
        alert('Hedef başarıyla güncellendi!');
        this.$emit('goal-updated');
        this.closeModal();
      } catch (error) {
        alert('Hedef güncellenirken bir hata oluştu: ' + error.message);
        console.error('Hedef güncelleme hatası:', error);
      }
    },
    closeModal() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

input[type='text'],
input[type='number'],
textarea,
select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box;
  font-size: 1em;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.save-button,
.cancel-button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s ease;
}

.save-button {
  background-color: #28a745;
  color: white;
}

.save-button:hover {
  background-color: #218838;
}

.cancel-button {
  background-color: #6c757d;
  color: white;
}

.cancel-button:hover {
  background-color: #5a6268;
}
</style>
