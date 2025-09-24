<template>
  <div class="error-boundary" v-if="hasError">
    <div class="error-container">
      <div class="error-icon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <div class="error-content">
        <h3 class="error-title">{{ $t('error.boundary.title') }}</h3>
        <p class="error-message">{{ $t('error.boundary.message') }}</p>
        <div class="error-details" v-if="showDetails">
          <details>
            <summary>{{ $t('error.boundary.technical_details') }}</summary>
            <pre class="error-stack">{{ errorDetails }}</pre>
          </details>
        </div>
        <div class="error-actions">
          <button 
            @click="retry" 
            class="btn btn-primary"
            :disabled="retrying"
          >
            <i class="fas fa-redo" v-if="!retrying"></i>
            <i class="fas fa-spinner fa-spin" v-else></i>
            {{ retrying ? $t('error.boundary.retrying') : $t('error.boundary.retry') }}
          </button>
          <button 
            @click="goHome" 
            class="btn btn-secondary ml-2"
          >
            <i class="fas fa-home"></i>
            {{ $t('error.boundary.go_home') }}
          </button>
          <button 
            @click="toggleDetails" 
            class="btn btn-link"
          >
            {{ showDetails ? $t('error.boundary.hide_details') : $t('error.boundary.show_details') }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script lang="ts">
import { defineComponent, ref, onErrorCaptured } from 'vue';
import { useRouter } from 'vue-router';
import { useNotificationStore } from '../../stores/modules';

export default defineComponent({
  name: 'ErrorBoundary',
  props: {
    fallbackComponent: {
      type: Object,
      default: null
    },
    onError: {
      type: Function,
      default: null
    }
  },
  setup(props, { emit }) {
    const router = useRouter();
    const notificationStore = useNotificationStore();
    
    const hasError = ref(false);
    const errorDetails = ref('');
    const showDetails = ref(false);
    const retrying = ref(false);
    
    const captureError = (error: Error, instance: any, info: string) => {
      hasError.value = true;
      errorDetails.value = `${error.message}\n\nStack trace:\n${error.stack}\n\nComponent info:\n${info}`;
      
      // Log error for monitoring
      console.error('Error Boundary captured error:', {
        error,
        instance,
        info,
        timestamp: new Date().toISOString()
      });
      
      // Call custom error handler if provided
      if (props.onError) {
        props.onError(error, instance, info);
      }
      
      // Emit error event
      emit('error', { error, instance, info });
      
      // Show user-friendly notification
      notificationStore.showError(
        'Beklenmeyen Hata',
        'Bir şeyler ters gitti. Lütfen sayfayı yenilemeyi deneyin.',
        10000
      );
    };
    
    onErrorCaptured((error: Error, instance: any, info: string) => {
      captureError(error, instance, info);
      return false; // Prevent error from propagating
    });
    
    const retry = async () => {
      retrying.value = true;
      try {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Reset error state
        hasError.value = false;
        errorDetails.value = '';
        showDetails.value = false;
        
        // Emit retry event
        emit('retry');
        
        notificationStore.showSuccess(
          'Yeniden Deneme',
          'Sayfa başarıyla yenilendi.'
        );
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        notificationStore.showError(
          'Yeniden Deneme Başarısız',
          'Sayfa yenilenemedi. Lütfen manuel olarak yenileyin.'
        );
      } finally {
        retrying.value = false;
      }
    };
    
    const goHome = () => {
      router.push('/');
    };
    
    const toggleDetails = () => {
      showDetails.value = !showDetails.value;
    };
    
    return {
      hasError,
      errorDetails,
      showDetails,
      retrying,
      retry,
      goHome,
      toggleDetails
    };
  }
});
</script>

<style lang="scss" scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.error-container {
  max-width: 600px;
  text-align: center;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

.error-title {
  color: #dc3545;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.error-message {
  color: #6c757d;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.error-details {
  margin-bottom: 1.5rem;
  text-align: left;
  
  details {
    background: #ffffff;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    padding: 1rem;
    
    summary {
      cursor: pointer;
      font-weight: 500;
      color: #495057;
      margin-bottom: 0.5rem;
      
      &:hover {
        color: #007bff;
      }
    }
  }
}

.error-stack {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.875rem;
  color: #495057;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.error-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    
    i {
      font-size: 0.875rem;
    }
  }
}

// Dark theme support
@media (prefers-color-scheme: dark) {
  .error-container {
    background: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }
  
  .error-message {
    color: #a0aec0;
  }
  
  .error-details details {
    background: #1a202c;
    border-color: #4a5568;
  }
  
  .error-stack {
    background: #1a202c;
    border-color: #4a5568;
    color: #e2e8f0;
  }
}
</style>
