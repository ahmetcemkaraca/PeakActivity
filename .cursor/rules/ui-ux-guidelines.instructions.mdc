---
applyTo: "**/*.ts,**/*.tsx,**/*.vue"
description: "User interface and user experience development guidelines"
---

# UI/UX Geliştirme Kılavuzu

Bu dosya, PeakActivity kullanıcı arayüzü ve deneyimi geliştirme standartlarını tanımlar.

## Çok Dilli Uygulama (i18n) Standartları

### Vue.js i18n Implementation
```vue
<template>
  <div class="welcome-section">
    <h1>{{ $t('dashboard.welcome', { name: user.name }) }}</h1>
    <p>{{ $t('dashboard.summary', { count: activityCount }) }}</p>
    <button @click="exportData">{{ $t('actions.export') }}</button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const welcomeMessage = computed(() => t('dashboard.welcome', { name: user.value.name }));
</script>
```

### Dil Dosyası Yapısı
```typescript
// locales/tr.json
{
  "dashboard": {
    "welcome": "Hoş geldin, {name}!",
    "summary": "{count} aktivite kaydedildi",
    "noData": "Henüz veri yok"
  },
  "actions": {
    "export": "Dışa Aktar",
    "import": "İçe Aktar",
    "save": "Kaydet",
    "cancel": "İptal"
  },
  "categories": {
    "work": "İş",
    "social": "Sosyal",
    "entertainment": "Eğlence"
  }
}

// locales/en.json
{
  "dashboard": {
    "welcome": "Welcome, {name}!",
    "summary": "{count} activities recorded",
    "noData": "No data yet"
  },
  "actions": {
    "export": "Export",
    "import": "Import", 
    "save": "Save",
    "cancel": "Cancel"
  },
  "categories": {
    "work": "Work",
    "social": "Social",
    "entertainment": "Entertainment"
  }
}
```

### ICU Message Format Kullanımı
```typescript
// Pluralization support
{
  "notifications": {
    "unread": {
      "zero": "Okunmamış bildirim yok",
      "one": "1 okunmamış bildirim",
      "other": "{count} okunmamış bildirim"
    }
  }
}

// Vue component'te kullanım
const unreadMessage = computed(() => 
  t('notifications.unread', unreadCount.value, { count: unreadCount.value })
);
```

## Component Architecture

### Base Component Pattern
```vue
<!-- BaseButton.vue -->
<template>
  <button 
    :class="computedClasses" 
    :disabled="disabled"
    @click="handleClick"
  >
    <Icon v-if="icon" :name="icon" />
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  disabled: false
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const computedClasses = computed(() => [
  'btn',
  `btn--${props.variant}`,
  `btn--${props.size}`,
  { 'btn--disabled': props.disabled }
]);

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>
```

### Activity Visualization Components
```vue
<!-- ActivityChart.vue -->
<template>
  <div class="activity-chart">
    <h3>{{ $t('charts.activity.title') }}</h3>
    <canvas ref="chartRef" />
    <div v-if="loading" class="loading">
      {{ $t('common.loading') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js';
import type { ActivityData } from '@/types/activity';

interface Props {
  data: ActivityData[];
  timeRange: '24h' | '7d' | '30d';
}

const props = defineProps<Props>();
const chartRef = ref<HTMLCanvasElement>();
const chart = ref<Chart>();

onMounted(() => {
  Chart.register(...registerables);
  initChart();
});

const initChart = () => {
  if (!chartRef.value) return;
  
  chart.value = new Chart(chartRef.value, {
    type: 'line',
    data: {
      labels: props.data.map(d => formatTime(d.timestamp)),
      datasets: [{
        label: t('charts.activity.dataset'),
        data: props.data.map(d => d.duration),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: 'var(--text-color)'
          }
        }
      }
    }
  });
};
</script>
```

## Theme ve Styling Standards

### CSS Custom Properties
```css
/* themes/light.css */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #333333;
  --text-secondary: #666666;
  --accent-primary: #007bff;
  --accent-secondary: #6c757d;
  --border-color: #dee2e6;
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* themes/dark.css */
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --accent-primary: #0d6efd;
  --accent-secondary: #6c757d;
  --border-color: #495057;
  --shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
```

### Component Styling Pattern
```scss
// ActivityCard.vue <style>
.activity-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: var(--shadow);
  
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  &__title {
    color: var(--text-primary);
    font-weight: 600;
    margin: 0;
  }
  
  &__duration {
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  &--focused {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
  }
}
```

## Responsive Design Guidelines

### Breakpoint System
```scss
// styles/mixins.scss
$breakpoints: (
  'mobile': 480px,
  'tablet': 768px,
  'desktop': 1024px,
  'wide': 1440px
);

@mixin respond-to($breakpoint) {
  @if map-has-key($breakpoints, $breakpoint) {
    @media (min-width: map-get($breakpoints, $breakpoint)) {
      @content;
    }
  }
}

// Usage
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  
  @include respond-to('tablet') {
    grid-template-columns: 1fr 1fr;
  }
  
  @include respond-to('desktop') {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
```

## Accessibility (a11y) Standards

### Semantic HTML ve ARIA
```vue
<template>
  <section class="activity-dashboard" role="main" aria-label="Activity Dashboard">
    <h1 id="dashboard-title">{{ $t('dashboard.title') }}</h1>
    
    <nav aria-label="Dashboard navigation">
      <ul role="list">
        <li v-for="item in navItems" :key="item.id">
          <router-link 
            :to="item.path"
            :aria-current="$route.path === item.path ? 'page' : undefined"
          >
            {{ $t(item.labelKey) }}
          </router-link>
        </li>
      </ul>
    </nav>
    
    <div 
      class="chart-container"
      role="img"
      :aria-labelledby="chartId"
    >
      <h2 :id="chartId">{{ $t('charts.activity.title') }}</h2>
      <ActivityChart :data="activityData" />
    </div>
  </section>
</template>
```

### Keyboard Navigation
```vue
<script setup lang="ts">
// Focus management
const focusableElements = ref<HTMLElement[]>([]);

onMounted(() => {
  focusableElements.value = Array.from(
    container.value?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) || []
  ) as HTMLElement[];
});

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeModal();
  } else if (event.key === 'Tab') {
    trapFocus(event);
  }
};

const trapFocus = (event: KeyboardEvent) => {
  const firstElement = focusableElements.value[0];
  const lastElement = focusableElements.value[focusableElements.value.length - 1];
  
  if (event.shiftKey && event.target === firstElement) {
    event.preventDefault();
    lastElement?.focus();
  } else if (!event.shiftKey && event.target === lastElement) {
    event.preventDefault();
    firstElement?.focus();
  }
};
</script>
```

## State Management Patterns

### Pinia Store Pattern
```typescript
// stores/activity.ts
import { defineStore } from 'pinia';
import type { ActivityEvent, ActivityFilter } from '@/types/activity';

export const useActivityStore = defineStore('activity', () => {
  const events = ref<ActivityEvent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filter = ref<ActivityFilter>({
    dateRange: '7d',
    categories: [],
    searchQuery: ''
  });

  const filteredEvents = computed(() => {
    return events.value.filter(event => {
      if (filter.value.searchQuery) {
        const query = filter.value.searchQuery.toLowerCase();
        return event.title?.toLowerCase().includes(query) ||
               event.app?.toLowerCase().includes(query);
      }
      return true;
    });
  });

  const fetchEvents = async (bucketId: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await activityApi.getEvents(bucketId, filter.value);
      events.value = response.data;
    } catch (err) {
      error.value = t('errors.fetch_failed');
      console.error('Failed to fetch events:', err);
    } finally {
      loading.value = false;
    }
  };

  return {
    events,
    loading,
    error,
    filter,
    filteredEvents,
    fetchEvents
  };
});
```

## Performance Optimization

### Component Lazy Loading
```typescript
// router/index.ts
const Dashboard = () => import('@/views/Dashboard.vue');
const Analytics = () => import('@/views/Analytics.vue');
const Settings = () => import('@/views/Settings.vue');

export const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/analytics',
    name: 'Analytics', 
    component: Analytics,
    meta: { requiresAuth: true }
  }
];
```

### Virtual Scrolling for Large Lists
```vue
<!-- VirtualActivityList.vue -->
<template>
  <div ref="container" class="virtual-list" @scroll="handleScroll">
    <div :style="{ height: totalHeight + 'px' }" class="virtual-list__spacer">
      <div 
        :style="{ 
          transform: `translateY(${offsetY}px)`,
          height: visibleHeight + 'px'
        }"
        class="virtual-list__content"
      >
        <ActivityItem
          v-for="item in visibleItems"
          :key="item.id"
          :activity="item"
          :style="{ height: itemHeight + 'px' }"
        />
      </div>
    </div>
  </div>
</template>
```
