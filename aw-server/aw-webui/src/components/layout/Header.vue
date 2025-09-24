<template lang="pug">
div(:class="{'fixed-top-padding': fixedTopMenu}")
  b-navbar.aw-navbar(toggleable="lg" :fixed="fixedTopMenu ? 'top' : null")
    b-navbar-brand(to="/")
      img.align-middle(src="/logo.png" style="height: 1.5em;")
      span.ml-2.align-middle PeakActivity

    b-navbar-toggle(target="nav-collapse")

    b-collapse#nav-collapse(is-nav)
      b-navbar-nav
        // Main Navigation Items (Always visible if authenticated)
        b-nav-item(to="/home" v-if="isAuthenticated")
          div.px-2.px-lg-1
            icon(name="home")
            | Anasayfa
        b-nav-item-dropdown(v-if="activityViews && isAuthenticated")
          template(slot="button-content")
            div.d-inline.px-2.px-lg-1
              icon(name="calendar-day")
              | Aktivite
          b-dropdown-item(v-for="view in activityViews", :key="view.name", :to="view.pathUrl")
            icon(:name="view.icon")
            | {{ view.name }}

        b-nav-item(to="/timeline" v-if="isAuthenticated")
          div.px-2.px-lg-1
            icon(name="stream")
            | Zaman Çizelgesi

        b-nav-item(to="/stopwatch" v-if="isAuthenticated")
          div.px-2.px-lg-1
            icon(name="stopwatch")
            | Kronometre

        // New AI & Analytics Dropdown
        b-nav-item-dropdown(v-if="isAuthenticated")
          template(slot="button-content")
            div.d-inline.px-2.px-lg-1
              icon(name="brain")
              | AI & Analiz
          b-dropdown-item(to="/goals")
            icon(name="bullseye")
            | Hedefler
          b-dropdown-item(to="/reports")
            icon(name="chart-line")
            | Raporlar
          b-dropdown-item(to="/automation-rules")
            icon(name="cogs")
            | Otomasyon Kuralları
          b-dropdown-item(to="/contextual-categorization")
            icon(name="tags")
            | Bağlamsal Kategorizasyon
          b-dropdown-item(to="/community-rules")
            icon(name="users")
            | Topluluk Kuralları
          b-dropdown-item(to="/project-prediction")
            icon(name="chart-bar")
            | Proje Tahmini
          b-dropdown-item(to="/ai-features/agent-builder")
            icon(name="robot")
            | Yapay Zeka Ajan Oluşturucu

      // Tools & Settings (right-aligned)
      b-navbar-nav.ml-auto
        // Notifications
        b-nav-item(v-if="isAuthenticated")
          div.px-2.px-lg-1
            icon(name="bell")
            // TODO: Yeni bildirimler için badge eklenecek
            | Bildirimler

        // User Profile & Auth
        b-nav-item-dropdown(v-if="isAuthenticated" right)
          template(slot="button-content")
            div.d-inline.px-2.px-lg-1
              icon(name="user-circle")
              | Profil
          b-dropdown-item(to="/settings/profile")
            icon(name="user")
            | Profil Ayarları
          b-dropdown-item(to="/settings")
            icon(name="cog")
            | Ayarlar
          b-dropdown-divider
          b-dropdown-item(@click="handleLogout")
            icon(name="sign-out-alt")
            | Çıkış Yap

        // Raw Data
        b-nav-item(to="/buckets" v-if="isAuthenticated")
          div.px-2.px-lg-1
            icon(name="database")
            | Ham Veri

        // Developer Tools (devmode only)
        b-nav-item-dropdown(v-if="isAuthenticated && devmode" right)
          template(slot="button-content")
            div.d-inline.px-2.px-lg-1
              icon(name="tools")
              | Geliştirici Araçları
          b-dropdown-item(to="/trends")
            icon(name="chart-line")
            | Eğilimler
          b-dropdown-item(to="/report")
            icon(name="chart-pie")
            | Rapor (Dev)
          b-dropdown-item(to="/alerts")
            icon(name="flag-checkered")
            | Uyarılar
          b-dropdown-item(to="/timespiral")
            icon(name="history")
            | Zaman Sarmalı
          b-dropdown-item(to="/query")
            icon(name="code")
            | Sorgu Gezgini
          b-dropdown-item(to="/graph")
            icon(name="project-diagram")
            | Grafik

        // Login/Register (if not authenticated)
        b-nav-item(to="/login" v-if="!isAuthenticated")
          div.px-2.px-lg-1
            icon(name="sign-in-alt")
            | Giriş Yap
        b-nav-item(to="/register" v-if="!isAuthenticated")
          div.px-2.px-lg-1
            icon(name="user-plus")
            | Kaydol
</template>

<style lang="scss" scoped>
.fixed-top-padding {
  padding-bottom: 3.5em;
}
</style>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, computed } from 'vue';
import { AuthService } from '../auth/AuthService';
// import { useRouter } from 'vue-router'; // Vue 2'de useRouter kullanılmaz

// only import the icons you use to reduce bundle size
import 'vue-awesome/icons/calendar-day';
import 'vue-awesome/icons/calendar-week';
import 'vue-awesome/icons/stream';
import 'vue-awesome/icons/database';
import 'vue-awesome/icons/search';
import 'vue-awesome/icons/code';
import 'vue-awesome/icons/chart-line'; // TODO: switch to chart-column, when vue-awesome supports FA v6
import 'vue-awesome/icons/chart-pie';
import 'vue-awesome/icons/chart-bar';
import 'vue-awesome/icons/flag-checkered';
import 'vue-awesome/icons/stopwatch';
import 'vue-awesome/icons/cog';
import 'vue-awesome/icons/tools';
import 'vue-awesome/icons/history';
import 'vue-awesome/icons/cogs';

// TODO: use circle-nodes instead in the future
import 'vue-awesome/icons/project-diagram';
//import 'vue-awesome/icons/cicle-nodes';

import 'vue-awesome/icons/ellipsis-h';

import 'vue-awesome/icons/mobile';
import 'vue-awesome/icons/desktop';
import 'vue-awesome/icons/sign-in-alt';
import 'vue-awesome/icons/user-plus';
import 'vue-awesome/icons/sign-out-alt';
import 'vue-awesome/icons/users';
import 'vue-awesome/icons/tags';
import 'vue-awesome/icons/bullseye';
import 'vue-awesome/icons/bell';
import 'vue-awesome/icons/user';
import 'vue-awesome/icons/user-circle';
import 'vue-awesome/icons/home';
import 'vue-awesome/icons/brain';
import 'vue-awesome/icons/robot';

import _ from 'lodash';

import { mapState } from 'pinia';
import { useSettingsStore } from '~/stores/settings';
import { useBucketsStore } from '~/stores/buckets';
import { IBucket } from '~/util/interfaces';

export default defineComponent({
  name: 'Header',
  data() {
    return {
      isAuthenticated: false,
      activityViews: null as any[] | null,
      unsubscribeAuth: null as (() => void) | null,
    };
  },
  computed: {
    fixedTopMenu(): boolean {
      return false; // Bu değeri duruma göre ayarlayın
    },
    devmode(): boolean {
      const settingsStore = useSettingsStore();
      return settingsStore.devmode;
    },
  },
  methods: {
    async handleLogout() {
      try {
        const authService = new AuthService();
        await authService.logout();
        this.$router.push('/login'); // Çıkış yapıldıktan sonra giriş sayfasına yönlendir
      } catch (error) {
        console.error("Çıkış yaparken hata oluştu:", error);
      }
    },
  },
  mounted() {
    const authService = new AuthService();

    this.unsubscribeAuth = authService.onAuthChange((user) => {
      this.isAuthenticated = !!user;
    });

    // Existing logic for activityViews
    const bucketStore = useBucketsStore();
    bucketStore.ensureLoaded().then(() => {
      const buckets: IBucket[] = bucketStore.buckets;
      const types_by_host: { [key: string]: { afk?: boolean; window?: boolean; android?: boolean; } } = {};

      const currentActivityViews: any[] = [];

      _.each(buckets, v => {
        types_by_host[v.hostname] = types_by_host[v.hostname] || {};
        types_by_host[v.hostname].afk ||= v.type == 'afkstatus';
        types_by_host[v.hostname].window ||= v.type == 'currentwindow';
        types_by_host[v.hostname].android ||= v.type == 'currentwindow' && v.id.includes('android');
      });

      _.each(types_by_host, (types, hostname) => {
        if (hostname != 'unknown') {
          currentActivityViews.push({
            name: hostname,
            hostname: hostname,
            type: 'default',
            pathUrl: `/activity/${hostname}`,
            icon: 'desktop',
          });
        }
        if (types['android']) {
          currentActivityViews.push({
            name: `${hostname} (Android)`,
            hostname: hostname,
            type: 'android',
            pathUrl: `/activity/${hostname}`,
            icon: 'mobile',
          });
        }
      });
      this.activityViews = currentActivityViews;
    });
  },
  beforeDestroy() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  },
});
</script>

<style lang="scss" scoped>
@import '../style/globals';

.aw-navbar {
  background-color: white;
  border: solid $lightBorderColor;
  border-width: 0 0 1px 0;
}

.nav-item {
  align-items: center;

  margin-left: 0.2em;
  margin-right: 0.2em;
  border-radius: 0.5em;

  &:hover {
    background-color: #ddd;
  }
}

.abs-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
</style>

<style lang="scss">
// Needed because dropdown somehow doesn't properly work with scoping
.nav-item {
  .nav-link {
    color: #555 !important;
  }
}
</style>
