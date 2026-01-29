<template>
  <div class="loading-spinner-container" :class="{ 'full-page': fullPage }">
    <div class="loading-spinner" :class="`size-${size}`">
      <div class="spinner" :class="variant">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
      </div>
      <div class="loading-text" v-if="text">
        {{ text }}
      </div>
      <div class="loading-progress" v-if="showProgress && progress !== undefined">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        <div class="progress-text">
          {{ Math.round(progress) }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LoadingSpinner',
  props: {
    size: {
      type: String as () => 'small' | 'medium' | 'large',
      default: 'medium',
      validator: (value: string) => ['small', 'medium', 'large'].includes(value)
    },
    variant: {
      type: String as () => 'primary' | 'secondary' | 'success' | 'warning' | 'danger',
      default: 'primary',
      validator: (value: string) => ['primary', 'secondary', 'success', 'warning', 'danger'].includes(value)
    },
    text: {
      type: String,
      default: ''
    },
    fullPage: {
      type: Boolean,
      default: false
    },
    showProgress: {
      type: Boolean,
      default: false
    },
    progress: {
      type: Number,
      default: undefined,
      validator: (value: number | undefined) => value === undefined || (value >= 0 && value <= 100)
    }
  }
});
</script>

<style lang="scss" scoped>
.loading-spinner-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  
  &.full-page {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 9999;
    backdrop-filter: blur(2px);
  }
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  
  &.size-small .spinner {
    width: 24px;
    height: 24px;
  }
  
  &.size-medium .spinner {
    width: 40px;
    height: 40px;
  }
  
  &.size-large .spinner {
    width: 60px;
    height: 60px;
  }
}

.spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2px;
  
  > div {
    border-radius: 100%;
    display: inline-block;
    animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  }
  
  .bounce1 {
    animation-delay: -0.32s;
  }
  
  .bounce2 {
    animation-delay: -0.16s;
  }
  
  .bounce3 {
    animation-delay: 0s;
  }
  
  // Color variants
  &.primary > div {
    background-color: #007bff;
  }
  
  &.secondary > div {
    background-color: #6c757d;
  }
  
  &.success > div {
    background-color: #28a745;
  }
  
  &.warning > div {
    background-color: #ffc107;
  }
  
  &.danger > div {
    background-color: #dc3545;
  }
}

.size-small .spinner > div {
  width: 6px;
  height: 6px;
}

.size-medium .spinner > div {
  width: 10px;
  height: 10px;
}

.size-large .spinner > div {
  width: 15px;
  height: 15px;
}

.loading-text {
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  
  .size-small & {
    font-size: 0.75rem;
  }
  
  .size-large & {
    font-size: 1rem;
  }
}

.loading-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 200px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
}

@keyframes sk-bouncedelay {
  0%, 80%, 100% { 
    transform: scale(0);
  } 40% { 
    transform: scale(1.0);
  }
}

// Dark theme support
@media (prefers-color-scheme: dark) {
  .loading-spinner-container.full-page {
    background: rgba(0, 0, 0, 0.8);
  }
  
  .loading-text {
    color: #a0aec0;
  }
  
  .progress-bar {
    background: #4a5568;
  }
  
  .progress-text {
    color: #a0aec0;
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .loading-spinner-container {
    padding: 0.5rem;
  }
  
  .loading-progress {
    min-width: 150px;
  }
}
</style>
