<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal">
      <h3>Quick Survey</h3>
      <form @submit.prevent="submit">
        <div>
          <label>Emotion</label>
          <input v-model="emotion" required />
        </div>
        <div>
          <label>Context</label>
          <input v-model="context" required />
        </div>
        <div>
          <label>Energy (1-5)</label>
          <input type="number" v-model.number="energy" min="1" max="5" />
        </div>
        <div>
          <label>Focus (1-5)</label>
          <input type="number" v-model.number="focus" min="1" max="5" />
        </div>
        <div>
          <label>Notes</label>
          <textarea v-model="notes"></textarea>
        </div>
        <button type="submit">Send</button>
        <button type="button" @click="close">Cancel</button>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'MicroSurveyModal',
  props: {
    visible: { type: Boolean, default: false },
  },
  data() {
    return {
      emotion: '',
      context: '',
      energy: null,
      focus: null,
      notes: '',
    };
  },
  methods: {
    async submit() {
      const payload = {
        timestamp: new Date().toISOString(),
        data: {
          emotion: this.emotion,
          context: this.context,
          energy: this.energy || undefined,
          focus: this.focus || undefined,
          notes: this.notes || undefined,
        },
      };
      await axios.post('/api/0/microsurvey', payload);
      this.close();
      this.$emit('submitted');
    },
    close() {
      this.$emit('update:visible', false);
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  width: 300px;
}
</style>
