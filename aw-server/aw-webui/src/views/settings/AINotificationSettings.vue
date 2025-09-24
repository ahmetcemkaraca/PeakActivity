<template lang="pug">
div
  h4.mb-3 AI Bildirim Ayarları

  b-form-group(label="AI Önerileri Bildirimleri" label-cols-md=4 description="AI tarafından oluşturulan öneri bildirimlerini etkinleştirin veya devre dışı bırakın.")
    div
      b-form-checkbox.float-right.ml-2(v-model="aiRecommendationsEnabled" switch)

  b-form-group(label="AI Uyarı Bildirimleri" label-cols-md=4 description="AI tarafından oluşturulan uyarı bildirimlerini etkinleştirin veya devre dışı bırakın.")
    div
      b-form-checkbox.float-right.ml-2(v-model="aiAlertsEnabled" switch)
</template>

<script lang="ts">
import { useSettingsStore } from '~/stores/settings';

export default {
  name: 'AINotificationSettings',
  computed: {
    aiRecommendationsEnabled: {
      get() {
        return useSettingsStore().aiRecommendationsEnabled;
      },
      set(value: boolean) {
        useSettingsStore().update({ aiRecommendationsEnabled: value });
      },
    },
    aiAlertsEnabled: {
      get() {
        return useSettingsStore().aiAlertsEnabled;
      },
      set(value: boolean) {
        useSettingsStore().update({ aiAlertsEnabled: value });
      },
    },
  },
};
</script>
