<template>
  <div class="goal-list">
    <h3>Hedeflerim</h3>
    <p v-if="loading">Hedefler yükleniyor...</p>
    <p v-else-if="goals.length === 0">Henüz bir hedefiniz yok. Yeni bir hedef oluşturun!</p>
    <div v-else class="goals-container">
      <div v-for="goal in goals" :key="goal.id" class="goal-card">
        <h4>{{ goal.title }}</h4>
        <p v-if="goal.description">{{ goal.description }}</p>
        <p>
          <strong>Tür:</strong>
          {{ getGoalTypeDisplayName(goal.type) }}
        </p>
        <div v-if="goal.type === 'time_based'">
          <p>
            <strong>Hedef Süre:</strong>
            {{ formatDuration(goal.targetDuration) }}
          </p>
          <p v-if="goal.targetDailyDuration">
            <strong>Günlük Hedef:</strong>
            {{ formatDuration(goal.targetDailyDuration) }}
          </p>
          <p v-if="goal.targetWeeklyDuration">
            <strong>Haftalık Hedef:</strong>
            {{ formatDuration(goal.targetWeeklyDuration) }}
          </p>
          <p>
            <strong>Mevcut Süre:</strong>
            {{ formatDuration(goal.progress.currentDuration) }}
          </p>
        </div>
        <div v-else-if="goal.type === 'count_based'">
          <p>
            <strong>Hedef Sayı:</strong>
            {{ goal.targetCount }}
          </p>
          <p>
            <strong>Mevcut Sayı:</strong>
            {{ goal.currentCount }}
          </p>
        </div>
        <p>
          <strong>Son Güncelleme:</strong>
          {{ formatDate(goal.progress.lastUpdated) }}
        </p>
        <button @click="editGoal(goal)">Düzenle</button>
        <button @click="deleteGoal(goal.id)">Sil</button>
        <GoalProgressBar :goal="goal" />
      </div>
    </div>

    <EditGoalModal
      :goal="selectedGoal"
      :is-visible="isModalVisible"
      @close="isModalVisible = false"
      @goal-updated="handleGoalUpdated"
    />
  </div>
</template>

<script>
import { GoalService } from '@/services/goal-service';
import { useAuthStore } from '@/stores/auth';
import GoalProgressBar from './GoalProgressBar.vue';
import EditGoalModal from './EditGoalModal.vue'; // Import the new component

export default {
  name: 'GoalList',
  components: {
    GoalProgressBar,
    EditGoalModal, // Register the component
  },
  data() {
    return {
      goals: [],
      loading: true,
      isModalVisible: false,
      selectedGoal: null,
    };
  },
  async created() {
    await this.fetchGoals();
  },
  methods: {
    async fetchGoals() {
      this.loading = true;
      try {
        const authStore = useAuthStore();
        const userId = authStore.user?.uid;

        if (!userId) {
          console.warn('Hedefleri getirmek için kullanıcı girişi yapılmalı.');
          this.goals = [];
          return;
        }
        this.goals = await GoalService.getAllGoals(userId);
      } catch (error) {
        console.error('Hedefler yüklenirken hata oluştu:', error);
        alert('Hedefler yüklenirken bir hata oluştu.');
      } finally {
        this.loading = false;
      }
    },
    getGoalTypeDisplayName(type) {
      const types = {
        time_based: 'Süre Bazlı',
        count_based: 'Sayı Bazlı',
        habit_based: 'Alışkanlık Bazlı',
        milestone_based: 'Dönüm Noktası Bazlı',
      };
      return types[type] || type;
    },
    formatDuration(seconds) {
      if (seconds === null || seconds === undefined) return '-';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours}sa ${minutes}dk ${remainingSeconds}sn`;
    },
    formatDate(timestamp) {
      if (!timestamp) return '-';
      const date = new Date(timestamp);
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    editGoal(goal) {
      this.selectedGoal = { ...goal };
      this.isModalVisible = true;
    },
    async deleteGoal(goalId) {
      if (confirm('Bu hedefi silmek istediğinize emin misiniz?')) {
        try {
          const authStore = useAuthStore();
          const userId = authStore.user?.uid;
          if (!userId) {
            alert('Kullanıcı girişi yapmalısınız.');
            return;
          }
          await GoalService.deleteGoal(goalId, userId);
          alert('Hedef başarıyla silindi!');
          this.goals = this.goals.filter(goal => goal.id !== goalId);
        } catch (error) {
          alert('Hedef silinirken bir hata oluştu: ' + error.message);
          console.error('Hedef silme hatası:', error);
        }
      }
    },
    handleGoalUpdated() {
      this.fetchGoals(); // Hedef güncellendiğinde listeyi yeniden çek
    },
  },
};
</script>

<style scoped>
.goal-list {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.goals-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.goal-card {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.goal-card h4 {
  margin-top: 0;
  color: #333;
}

.goal-card p {
  margin-bottom: 8px;
  color: #666;
  font-size: 0.9em;
}

.goal-card button {
  margin-top: 10px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background-color 0.2s ease;
}

.goal-card button:first-of-type {
  background-color: #007bff;
  color: white;
  margin-right: 10px;
}

.goal-card button:first-of-type:hover {
  background-color: #0056b3;
}

.goal-card button:last-of-type {
  background-color: #dc3545;
  color: white;
}

.goal-card button:last-of-type:hover {
  background-color: #c82333;
}
</style>
