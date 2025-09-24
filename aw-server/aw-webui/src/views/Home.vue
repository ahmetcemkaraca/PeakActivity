<template lang="pug">
div.home-container.aw-container
  .row.mb-4
    .col-12.text-center
      h2.display-4.mb-3 Merhaba, {{ isAuthenticated ? 'Hoş Geldiniz!' : 'PeakActivity' }}!
      p.lead Etkinlik verilerinizi ve içgörülerinizi buradan görüntüleyebilirsiniz.
      
      .d-flex.justify-content-center.align-items-center.mt-3
        span.mr-2 Tema:
        b-form-radio-group(v-model="selectedTheme" @change="setTheme")
          b-form-radio(value="light-mode") Aydınlık
          b-form-radio(value="dark-mode") Karanlık

  template(v-if="isAuthenticated")
    .row.mb-4
      .col-md-6.mb-4
        .card.h-100
          .card-body
            h3.card-title.mb-3 Günlük Aktivite Özeti
            p.card-text Bugün toplam {{ formatDuration(totalTimeTracked) }} boyunca aktiftiniz.
            p.card-text Ortalama odaklanma puanınız: {{ focusScore.toFixed(2) }}
            // Gelecekte buraya daha fazla özet ve küçük grafikler eklenecek

      .col-md-6.mb-4
        .card.h-100
          .card-body
            h3.card-title.mb-3 Raporlar ve Gösterge Tabloları
            p.card-text Özelleştirilmiş raporlarınızı ve gösterge tablolarınızı oluşturmak ve görüntülemek için 
              router-link(to="/reports") Raporlar
              | sayfasına gidin.
            // Rapor listesi veya özet grafikleri buraya gelecek

    .row.mb-4
      .col-md-6.mb-4
        .card.h-100
          .card-body
            h3.card-title.mb-3 Hedefleriniz
            p.card-text Devam eden hedeflerinizi yönetmek ve ilerlemenizi takip etmek için 
              router-link(to="/goals") Hedefler
              | sayfasına gidin.
            // Hedef listesi veya ilerleme çubukları buraya gelecek

      .col-md-6.mb-4
        .card.h-100
          .card-body
            h3.card-title.mb-3 Yapay Zeka İçgörüleri
            AIInsightsDisplay.mb-3
            AnomalyDetectionDisplay.mb-3
            BehavioralTrendsDisplay.mb-3
            FocusQualityScoreDisplay

  template(v-else)
    .row.mb-4
      .col-12.text-center
        h2.display-4.mb-3 Hoş Geldiniz!
        p.lead Aktivite verilerinizi takip etmeye başlamak için lütfen giriş yapın veya kaydolun.
        .auth-prompt.mt-4
          router-link(to="/login").btn.btn-primary.btn-lg.mr-3 Giriş Yap
          router-link(to="/register").btn.btn-outline-secondary.btn-lg Kaydol
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import { AuthService } from '../auth/AuthService';

import AIInsightsDisplay from '../components/AIInsightsDisplay.vue';
import AnomalyDetectionDisplay from '../components/AnomalyDetectionDisplay.vue';
import BehavioralTrendsDisplay from '../components/BehavioralTrendsDisplay.vue';
import FocusQualityScoreDisplay from '../components/FocusQualityScoreDisplay.vue';

export default defineComponent({
  name: 'Home',
  components: {
    AIInsightsDisplay,
    AnomalyDetectionDisplay,
    BehavioralTrendsDisplay,
    FocusQualityScoreDisplay,
  },
  setup() {
    const isAuthenticated = ref(false);
    const authService = new AuthService();

    const totalTimeTracked = ref(3600 * 5 + 120);
    const focusScore = ref(85.5);

    let unsubscribeAuth: () => void;

    // Theme management
    const selectedTheme = ref(
      localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark-mode' : 'light-mode')
    );

    onMounted(() => {
      unsubscribeAuth = authService.onAuthChange(user => {
        isAuthenticated.value = !!user;
      });
    });

    onUnmounted(() => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
    });

    const formatDuration = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      return `${hours}sa ${minutes}dk ${remainingSeconds}sn`;
    };

    const setTheme = (theme: string) => {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.remove('light-mode', 'dark-mode');
      document.documentElement.classList.add(theme);
    };

    return {
      isAuthenticated,
      totalTimeTracked,
      focusScore,
      formatDuration,
      selectedTheme,
      setTheme,
    };
  },
});
</script>

<style scoped lang="scss">
@import '../style/globals';

.home-container {
  padding: 30px;
  max-width: 1200px; // Geniş ekranlar için daha geniş
  margin: 0 auto;
  text-align: center;
}

h2 {
  color: var(--text-color);
  margin-bottom: 20px;
}

p {
  color: var(--text-color);
  line-height: 1.6;
}

.card {
  background-color: var(--background-color);
  border: 1px solid var(--light-border-color);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.card-title {
  color: var(--active-highlight-color);
  font-size: 1.6em;
  font-weight: bold;
}

.card-text {
  color: var(--text-color);
}

.auth-prompt {
  margin-top: 30px;
}

.btn-primary {
  background-color: var(--active-highlight-color);
  border-color: var(--active-highlight-color);
  color: white;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease;
}

.btn-primary:hover {
  background-color: darken(var(--active-highlight-color), 10%);
  border-color: darken(var(--active-highlight-color), 10%);
}

.btn-outline-secondary {
  background-color: transparent;
  color: var(--active-highlight-color);
  border: 1px solid var(--active-highlight-color);
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

.btn-outline-secondary:hover {
  background-color: var(--active-highlight-color);
  color: white;
}

// Bootstrap Form Radio'nun görünümünü iyileştirme
.form-check-input:checked {
  background-color: var(--active-highlight-color);
  border-color: var(--active-highlight-color);
}
</style>
