/**
 * Main Application Entry Point
 *
 * Vue 3 application bootstrap with complete store and routing setup.
 * Error handling, performance monitoring ve modular architecture.
 */

import Vue from 'vue';
import { createPinia, PiniaVuePlugin } from 'pinia';
import router from './router';
import App from './App.vue';

// Global error handling
import { errorManager } from './utils/error-manager';

// CSS imports
import './assets/styles/main.css';

// Use Pinia plugin
Vue.use(PiniaVuePlugin);

// Create Pinia instance
const pinia = createPinia();

// Global error handler
Vue.config.errorHandler = (err: Error, vm: any, info: string) => {
  console.error('Vue Error:', err, info);
  errorManager.captureError(err, {
    type: 'system',
    component: vm?.$options.name || 'unknown',
    action: info,
  });
};

// Global performance monitoring
if (process.env.NODE_ENV === 'development') {
  Vue.config.performance = true;
}

// Global properties for development
if (process.env.NODE_ENV === 'development') {
  Vue.prototype.$log = console.log;
  Vue.prototype.$error = console.error;
  Vue.prototype.$warn = console.warn;
}

// Create Vue app instance
const app = new Vue({
  router,
  pinia,
  render: h => h(App),
});

// Mount application
app.$mount('#app');

// Initialize core services after mount
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 PeakActivity started in development mode');
}

// Service worker registration (for future PWA features)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

export default app;
