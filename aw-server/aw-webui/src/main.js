import 'core-js/stable';
import 'regenerator-runtime/runtime';

import Vue from 'vue';

// Load the Bootstrap CSS
import BootstrapVue from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
Vue.use(BootstrapVue);

import { Datetime } from 'vue-datetime';
import 'vue-datetime/dist/vue-datetime.css';
Vue.component('datetime', Datetime);

// Load the Varela Round font
import 'typeface-varela-round';

// Load the main style
import './style/style.scss';

// Loads all the filters
import './util/filters.js';

// Sets up the routing and the base app (using vue-router)
import router from './route.js';

// Sets up the pinia store
import pinia from './stores';

// Register Font Awesome icon component
Vue.component('icon', () => import('vue-awesome/components/Icon.vue'));

// General components
Vue.component('error-boundary', () => import('./components/ErrorBoundary.vue'));
Vue.component('input-timeinterval', () => import('./components/InputTimeInterval.vue'));
Vue.component('aw-header', () => import('./components/Header.vue'));
Vue.component('aw-footer', () => import('./components/Footer.vue'));
Vue.component('aw-devonly', () => import('./components/DevOnly.vue'));
Vue.component('aw-selectable-vis', () => import('./components/SelectableVisualization.vue'));
Vue.component('aw-selectable-eventview', () => import('./components/SelectableEventView.vue'));
Vue.component('new-release-notification', () => import('./components/NewReleaseNotification.vue'));
Vue.component('user-satisfaction-poll', () => import('./components/UserSatisfactionPoll.vue'));
Vue.component('aw-query-options', () => import('./components/QueryOptions.vue'));
Vue.component('aw-select-categories', () => import('./components/SelectCategories.vue'));
Vue.component('aw-select-categories-or-pattern', () =>
  import('./components/SelectCategoriesOrPattern.vue')
);

// Visualization components
Vue.component('aw-summary', () => import('./visualizations/Summary.vue'));
Vue.component('aw-periodusage', () => import('./visualizations/PeriodUsage.vue'));
Vue.component('aw-eventlist', () => import('./visualizations/EventList.vue'));
Vue.component('aw-sunburst-categories', () => import('./visualizations/SunburstCategories.vue'));
Vue.component('aw-sunburst-clock', () => import('./visualizations/SunburstClock.vue'));
Vue.component('aw-timeline-inspect', () => import('./visualizations/TimelineInspect.vue'));
Vue.component('aw-timeline', () => import('./visualizations/TimelineSimple.vue'));
Vue.component('vis-timeline', () => import('./visualizations/VisTimeline.vue'));
Vue.component('aw-categorytree', () => import('./visualizations/CategoryTree.vue'));
Vue.component('aw-timeline-barchart', () => import('./visualizations/TimelineBarChart.vue'));
Vue.component('aw-calendar', () => import('./visualizations/Calendar.vue'));
Vue.component('aw-custom-vis', () => import('./visualizations/CustomVisualization.vue'));
Vue.component('aw-score', () => import('./visualizations/Score.vue'));

// A mixin to make async method errors propagate
import asyncErrorCapturedMixin from './mixins/asyncErrorCaptured.js';
Vue.mixin(asyncErrorCapturedMixin);

// Set the PRODUCTION constant
// FIXME: Thould follow Vue convention and start with a $.
Vue.prototype.PRODUCTION = PRODUCTION;
Vue.prototype.COMMIT_HASH = COMMIT_HASH;

// Set the $isAndroid constant
Vue.prototype.$isAndroid = process.env.VUE_APP_ON_ANDROID;

// Create an instance of AWClient as this.$aw
// NOTE: needs to be created before the Vue app is created,
//       since stores rely on it having been run.
import { createClient, getClient, configureClient } from './util/awclient';
createClient();

// Setup Vue app
import App from './App.vue';
import Home from './views/Home.vue';

import VueI18n from 'vue-i18n';
import en from './locales/en.json';
import tr from './locales/tr.json';

Vue.use(VueI18n);

// Add axios to Vue prototype
import axios from 'axios';
Vue.prototype.$axios = axios;

const messages = {
  en: {
    ...en
  },
  tr: {
    ...tr
  }
};

const i18n = new VueI18n({
  locale: 'en', // Varsayılan dil
  fallbackLocale: 'en',
  messages,
});

// Dark Mode Toggle Logic
function applyTheme(theme: string) {
  document.documentElement.classList.remove('light-mode', 'dark-mode');
  document.documentElement.classList.add(theme);
}

// Check for user's preferred theme from localStorage or system preference
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme) {
  applyTheme(savedTheme);
} else if (prefersDark) {
  applyTheme('dark-mode');
} else {
  applyTheme('light-mode');
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) { // Only apply if user hasn't set a preference
    applyTheme(e.matches ? 'dark-mode' : 'light-mode');
  }
});

new Vue({
  el: '#app',
  router: router,
  render: h => h(App),
  pinia,
  i18n,
});

// Set the $aw global
Vue.prototype.$aw = getClient();

// Must be run after vue init since it relies on the settings store
configureClient();

import Login from './views/Login.vue';
import Register from './views/Register.vue';
import AutomationRules from './views/AutomationRules.vue';
import ProjectPrediction from './views/ProjectPrediction.vue';
import CommunityRules from './views/CommunityRules.vue';
import ContextualCategorization from './views/ContextualCategorization.vue';
import Goals from './views/Goals.vue';
import Reports from './views/Reports.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
  },
  {
    path: '/automation-rules',
    name: 'AutomationRules',
    component: AutomationRules,
  },
  {
    path: '/project-prediction',
    name: 'ProjectPrediction',
    component: ProjectPrediction,
  },
  {
    path: '/community-rules',
    name: 'CommunityRules',
    component: CommunityRules,
  },
  {
    path: '/contextual-categorization',
    name: 'ContextualCategorization',
    component: ContextualCategorization,
  },
  {
    path: '/goals',
    name: 'Goals',
    component: Goals,
  },
  {
    path: '/reports',
    name: 'Reports',
    component: Reports,
  },
];
