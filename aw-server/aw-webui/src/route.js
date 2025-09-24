import Vue from 'vue';
import VueRouter from 'vue-router';

const Home = () => import('./views/Home.vue');

// Activity views for desktop
const Activity = () => import('./views/activity/Activity.vue');
const ActivityView = () => import('./views/activity/ActivityView.vue');

const Buckets = () => import('./views/Buckets.vue');
const Bucket = () => import('./views/Bucket.vue');
const QueryExplorer = () => import('./views/QueryExplorer.vue');
const Timeline = () => import('./views/Timeline.vue');
const Trends = () => import('./views/Trends.vue');
const Settings = () => import('./views/settings/Settings.vue');
const CategoryBuilder = () => import('./views/settings/CategoryBuilder.vue');
const Stopwatch = () => import('./views/Stopwatch.vue');
const Alerts = () => import('./views/Alerts.vue');
const Search = () => import('./views/Search.vue');
const Report = () => import('./views/Report.vue');
const TimespiralView = () => import('./views/TimespiralView.vue');
const Dev = () => import('./views/Dev.vue');
const Graph = () => import('./views/Graph.vue');
const NotFound = () => import('./views/NotFound.vue');

// AI Feature Views
const AnomalyDetectionView = () => import('./views/ai-features/AnomalyDetectionView.vue');
const BehavioralTrendsView = () => import('./views/ai-features/BehavioralTrendsView.vue');
const FocusQualityScoreView = () => import('./views/ai-features/FocusQualityScoreView.vue');
const AgentBuilder = () => import('./views/ai-features/AgentBuilder.vue');

import Login from './views/Login.vue';
import Register from './views/Register.vue';
import AutomationRules from './views/AutomationRules.vue';
import ProjectPrediction from './views/ProjectPrediction.vue';
import CommunityRules from './views/CommunityRules.vue';
import ContextualCategorization from './views/ContextualCategorization.vue';
import Goals from './views/Goals.vue';
import Reports from './views/Reports.vue';
import FeedbackView from './views/FeedbackView.vue';

Vue.use(VueRouter);

const router = new VueRouter({
  routes: [
    {
      path: '/',
      redirect: _to => {
        return localStorage.landingpage || '/home';
      },
    },
    { path: '/home', component: Home },
    {
      path: '/activity/:host/:periodLength?/:date?',
      component: Activity,
      props: true,
      children: [
        {
          path: 'view/:view_id?',
          meta: { subview: 'view' },
          name: 'activity-view',
          component: ActivityView,
          props: true,
        },
        // Unspecified should redirect to summary view is the summary view
        // (needs to be last since otherwise it'll always match first)
        {
          path: '',
          redirect: 'view/',
        },
      ],
    },
    { path: '/buckets', component: Buckets },
    { path: '/buckets/:id', component: Bucket, props: true },
    { path: '/timeline', component: Timeline, meta: { fullContainer: true } },
    { path: '/trends', component: Trends, meta: { fullContainer: true } },
    { path: '/trends/:host', component: Trends, meta: { fullContainer: true } },
    { path: '/report', component: () => import('./views/Report.vue') },
    { path: '/query', component: QueryExplorer },
    { path: '/alerts', component: Alerts },
    { path: '/timespiral', component: TimespiralView },
    { path: '/settings', component: Settings },
    { path: '/settings/category-builder', component: CategoryBuilder },
    { path: '/stopwatch', component: Stopwatch },
    { path: '/search', component: Search },
    { path: '/graph', component: Graph },
    { path: '/dev', component: Dev },
    {
      path: '/settings/google-calendar',
      component: () => import('./views/GoogleCalendarSettings.vue'),
    },
    // AI Feature Routes
    { path: '/ai-features/anomaly-detection', component: AnomalyDetectionView },
    { path: '/ai-features/behavioral-trends', component: BehavioralTrendsView },
    { path: '/ai-features/focus-quality-score', component: FocusQualityScoreView },
    { path: '/ai-features/agent-builder', component: AgentBuilder },
    {
      path: '/settings/ai-notification',
      component: () => import('./views/settings/AINotificationSettings.vue'),
    },
    { path: '/settings/privacy', component: () => import('./views/settings/PrivacySettings.vue') },
    {
      path: '/settings/encryption',
      component: () => import('./views/settings/EncryptionSettings.vue'),
    },
    {
      path: '/settings/data-sharing',
      component: () => import('./views/settings/DataSharingControls.vue'),
    },
    {
      path: '/settings/security-questions',
      component: () => import('./views/settings/SecurityQuestionSetup.vue'),
    },
    {
      path: '/settings/two-factor-auth',
      component: () => import('./views/settings/TwoFactorSetup.vue'),
    },
    {
      path: '/settings/master-password',
      component: () => import('./views/settings/MasterPasswordSetup.vue'),
    },
    {
      path: '/settings/key-recovery',
      component: () => import('./views/settings/KeyRecoveryWizard.vue'),
    },
    {
      path: '/community-rules',
      name: 'community-rules',
      component: () => import('./views/CommunityRules.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/contextual-categorization',
      name: 'contextual-categorization',
      component: () => import('./views/ContextualCategorization.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/feedback',
      name: 'Feedback',
      component: FeedbackView,
    },
    // NOTE: Will break with Vue 3: https://stackoverflow.com/questions/40193634/vue-router-redirect-on-page-not-found-404/64186073#64186073
    {
      path: '*',
      component: NotFound,
    },
  ],
});

export default router;
