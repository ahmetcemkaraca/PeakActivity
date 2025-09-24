<template>
  <div class="goal-progress-bar">
    <div class="progress-header">
      <span>İlerleme: {{ progressPercentage.toFixed(1) }}%</span>
      <span v-if="goal.type === 'time_based'">Kalan: {{ formatDuration(remainingTime) }}</span>
      <span v-else-if="goal.type === 'count_based'">
        Kalan: {{ goal.targetCount - goal.progress.currentCount }} adet
      </span>
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
    </div>
    <div class="progress-details">
      <p v-if="goal.type === 'time_based'">
        Mevcut: {{ formatDuration(goal.progress.currentDuration) }} / Hedef:
        {{ formatDuration(goal.targetDuration) }}
      </p>
      <p v-else-if="goal.type === 'count_based'">
        Mevcut: {{ goal.progress.currentCount }} / Hedef: {{ goal.targetCount }}
      </p>
      <p>
        Mevcut Seri: {{ goal.progress.currentStreak }} gün (En Uzun:
        {{ goal.progress.longestStreak }} gün)
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GoalProgressBar',
  props: {
    goal: {
      type: Object,
      required: true,
    },
  },
  computed: {
    progressPercentage() {
      let percentage = 0;
      if (this.goal.type === 'time_based' && this.goal.targetDuration > 0) {
        percentage = (this.goal.progress.currentDuration / this.goal.targetDuration) * 100;
      } else if (this.goal.type === 'count_based' && this.goal.targetCount > 0) {
        percentage = (this.goal.progress.currentCount / this.goal.targetCount) * 100;
      }
      return Math.min(100, Math.max(0, percentage)); // Yüzdeyi 0-100 arasında tut
    },
    remainingTime() {
      if (this.goal.type === 'time_based') {
        return Math.max(0, this.goal.targetDuration - this.goal.progress.currentDuration);
      }
      return 0;
    },
  },
  methods: {
    formatDuration(seconds) {
      if (seconds === null || seconds === undefined) return '-';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours}sa ${minutes}dk ${remainingSeconds}sn`;
    },
  },
};
</script>

<style scoped>
.goal-progress-bar {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: bold;
  color: #555;
  font-size: 0.9em;
}

.progress-bar-container {
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
  height: 10px;
}

.progress-bar {
  height: 100%;
  background-color: #4caf50;
  border-radius: 5px;
  transition: width 0.5s ease-in-out;
}

.progress-details {
  margin-top: 8px;
  font-size: 0.8em;
  color: #777;
}

.progress-details p {
  margin-bottom: 4px;
}
</style>
