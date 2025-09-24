<template lang="pug">
div
  h3 Settings

  hr

  DaystartSettings

  hr

  TimelineDurationSettings

  hr

  LandingPageSettings

  hr

  Theme

  hr

  div(v-if="!$isAndroid")
    ReleaseNotificationSettings
    hr

  ColorSettings

  hr

  ActivePatternSettings

  hr

  CategorizationSettings

  hr

  DeveloperSettings

  hr

  AINotificationSettings

  hr

  h4 Gizlilik ve Güvenlik Ayarları
  router-link(:to="{ path: '/settings/privacy' }") Gizlilik Ayarları
  br
  router-link(:to="{ path: '/settings/encryption' }") Şifreleme Ayarları
  br
  router-link(:to="{ path: '/settings/data-sharing' }") Veri Paylaşım Kontrolleri
  br
  router-link(:to="{ path: '/settings/security-questions' }") Güvenlik Soruları Kurulumu
  br
  router-link(:to="{ path: '/settings/two-factor-auth' }") İki Faktörlü Kimlik Doğrulama Kurulumu
  br
  router-link(:to="{ path: '/settings/master-password' }") Ana Parola Kurulumu
  br
  router-link(:to="{ path: '/settings/key-recovery' }") Anahtar Kurtarma Sihirbazı
  br
  router-link(:to="{ path: '/feedback' }") Geri Bildirim Gönder

</template>

<script lang="ts">
import { useSettingsStore } from '../../stores/settings';

import DaystartSettings from '~/views/settings/DaystartSettings.vue';
import TimelineDurationSettings from '~/views/settings/TimelineDurationSettings.vue';
import ReleaseNotificationSettings from '~/views/settings/ReleaseNotificationSettings.vue';
import CategorizationSettings from '~/views/settings/CategorizationSettings.vue';
import LandingPageSettings from '~/views/settings/LandingPageSettings.vue';
import DeveloperSettings from '~/views/settings/DeveloperSettings.vue';
import Theme from '~/views/settings/Theme.vue';
import ColorSettings from '~/views/settings/ColorSettings.vue';
import ActivePatternSettings from '~/views/settings/ActivePatternSettings.vue';
import AINotificationSettings from '~/views/settings/AINotificationSettings.vue';
import EncryptionSettings from '~/views/settings/EncryptionSettings.vue';
import DataSharingControls from '~/views/settings/DataSharingControls.vue';
import SecurityQuestionSetup from '~/views/settings/SecurityQuestionSetup.vue';
import TwoFactorSetup from '~/views/settings/TwoFactorSetup.vue';
import MasterPasswordSetup from '~/views/settings/MasterPasswordSetup.vue';
import KeyRecoveryWizard from '~/views/settings/KeyRecoveryWizard.vue';
import GoogleCalendarSettings from '~/views/GoogleCalendarSettings.vue'; // Doğru yol
// import ExternalServiceSetup from '~/views/settings/ExternalServiceSetup.vue'; // Henüz bulunamadı

export default {
  name: 'Settings',
  components: {
    DaystartSettings,
    TimelineDurationSettings,
    ReleaseNotificationSettings,
    CategorizationSettings,
    LandingPageSettings,
    Theme,
    ColorSettings,
    DeveloperSettings,
    ActivePatternSettings,
    AINotificationSettings,
    EncryptionSettings,
    DataSharingControls,
    SecurityQuestionSetup,
    TwoFactorSetup,
    MasterPasswordSetup,
    KeyRecoveryWizard,
    GoogleCalendarSettings,
    // ExternalServiceSetup, // Eklenemedi
  },
  async created() {
    await this.init();
  },
  methods: {
    async init() {
      const settingsStore = useSettingsStore();
      return settingsStore.load();
    },
  },
};
</script>
