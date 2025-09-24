<template>
  <div class="create-goal-form">
    <h3>Yeni Hedef Oluştur</h3>
    <form @submit.prevent="createGoal">
      <div class="form-group">
        <label for="title">Hedef Başlığı:</label>
        <input type="text" id="title" v-model="goal.title" required />
      </div>

      <div class="form-group">
        <label for="description">Açıklama (İsteğe Bağlı):</label>
        <textarea id="description" v-model="goal.description"></textarea>
      </div>

      <div class="form-group">
        <label for="type">Hedef Türü:</label>
        <select id="type" v-model="goal.type" @change="resetTargetFields">
          <option value="time_based">Süre Bazlı</option>
          <option value="count_based">Sayı Bazlı</option>
          <option value="habit_based">Alışkanlık Bazlı</option>
          <option value="milestone_based">Dönüm Noktası Bazlı</option>
        </select>
      </div>

      <div v-if="goal.type === 'time_based'">
        <div class="form-group">
          <label for="targetDuration">Hedef Süre (Saniye):</label>
          <input
            type="number"
            id="targetDuration"
            v-model.number="goal.targetDuration"
            min="0"
            required
          />
        </div>
        <div class="form-group">
          <label for="targetDailyDuration">Günlük Hedef Süre (Saniye):</label>
          <input
            type="number"
            id="targetDailyDuration"
            v-model.number="goal.targetDailyDuration"
            min="0"
          />
        </div>
        <div class="form-group">
          <label for="targetWeeklyDuration">Haftalık Hedef Süre (Saniye):</label>
          <input
            type="number"
            id="targetWeeklyDuration"
            v-model.number="goal.targetWeeklyDuration"
            min="0"
          />
        </div>
      </div>

      <div v-else-if="goal.type === 'count_based'">
        <div class="form-group">
          <label for="targetCount">Hedef Sayı:</label>
          <input
            type="number"
            id="targetCount"
            v-model.number="goal.targetCount"
            min="0"
            required
          />
        </div>
      </div>

      <div class="form-group">
        <label for="appNames">Uygulama Adları (Virgülle Ayırın):</label>
        <input type="text" id="appNames" v-model="appNamesInput" />
      </div>

      <div class="form-group">
        <label for="categories">Kategoriler (Virgülle Ayırın):</label>
        <input type="text" id="categories" v-model="categoriesInput" />
      </div>

      <div class="form-group">
        <label for="tags">Etiketler (Virgülle Ayırın):</label>
        <input type="text" id="tags" v-model="tagsInput" />
      </div>

      <button type="submit">Hedef Oluştur</button>
    </form>
  </div>
</template>

<script>
import { useAuthStore } from '@/stores/auth'; // Farazi bir auth store
import { GoalService } from '@/services/goal-service'; // Daha önce oluşturduğumuz GoalService

export default {
  name: 'CreateGoalForm',
  data() {
    return {
      goal: {
        title: '',
        description: '',
        type: 'time_based',
        targetDuration: null,
        targetDailyDuration: null,
        targetWeeklyDuration: null,
        targetCount: null,
        targetCriteria: {
          appNames: [],
          categories: [],
          tags: [],
        },
      },
      appNamesInput: '',
      categoriesInput: '',
      tagsInput: '',
    };
  },
  methods: {
    resetTargetFields() {
      this.goal.targetDuration = null;
      this.goal.targetDailyDuration = null;
      this.goal.targetWeeklyDuration = null;
      this.goal.targetCount = null;
    },
    async createGoal() {
      // Inputları diziye dönüştür
      this.goal.targetCriteria.appNames = this.appNamesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      this.goal.targetCriteria.categories = this.categoriesInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
      this.goal.targetCriteria.tags = this.tagsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s);

      // Kullanıcı ID'sini auth store'dan veya başka bir yerden alın
      const authStore = useAuthStore(); // Örnek
      const userId = authStore.user?.uid; // User ID'sini al

      if (!userId) {
        alert('Hedef oluşturmak için kullanıcı girişi yapmalısınız.');
        return;
      }

      try {
        // GoalService.createGoal metodu bir userId parametresi bekliyor
        const newGoal = await GoalService.createGoal(this.goal, userId);
        alert('Hedef başarıyla oluşturuldu!');
        console.log('Oluşturulan Hedef:', newGoal);
        // Formu sıfırla veya yönlendir
        this.resetForm();
      } catch (error) {
        alert('Hedef oluşturulurken bir hata oluştu: ' + error.message);
        console.error('Hedef oluşturma hatası:', error);
      }
    },
    resetForm() {
      this.goal = {
        title: '',
        description: '',
        type: 'time_based',
        targetDuration: null,
        targetDailyDuration: null,
        targetWeeklyDuration: null,
        targetCount: null,
        targetCriteria: {
          appNames: [],
          categories: [],
          tags: [],
        },
      };
      this.appNamesInput = '';
      this.categoriesInput = '';
      this.tagsInput = '';
    },
  },
};
</script>

<style scoped>
.create-goal-form {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type='text'],
input[type='number'],
textarea,
select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box; /* Padding ve border'ın genişliğe dahil olmasını sağlar */
}

button {
  background-color: #4caf50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #45a049;
}
</style>
