<template>
  <div class="manual-activity-form">
    <h3>Manual Activity</h3>
    <form @submit.prevent="submit">
      <div>
        <label>Label</label>
        <input v-model="label" required />
      </div>
      <div>
        <label>Duration (sec)</label>
        <input type="number" v-model.number="duration" min="0" />
      </div>
      <div>
        <label>Category</label>
        <input v-model="category" />
      </div>
      <div>
        <label>Description</label>
        <textarea v-model="description"></textarea>
      </div>
      <button type="submit">Save</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'ManualActivityForm',
  data() {
    return {
      label: '',
      duration: 0,
      category: '',
      description: '',
    };
  },
  methods: {
    async submit() {
      const payload = {
        timestamp: new Date().toISOString(),
        duration: this.duration,
        data: {
          label: this.label,
          category: this.category || undefined,
          description: this.description || undefined,
        },
      };
      await axios.post('/api/0/manualactivity', payload);
      this.$emit('saved');
      this.label = '';
      this.duration = 0;
      this.category = '';
      this.description = '';
    },
  },
};
</script>

<style scoped>
.manual-activity-form {
  max-width: 400px;
  margin: 0 auto;
}
</style>
