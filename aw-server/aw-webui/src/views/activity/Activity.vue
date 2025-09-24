<template lang="pug">
div.activity-container.aw-container
  .row.mb-4
    .col-12
      h3.mb-0.text-center Aktivite Özeti
      p.lead.text-center.text-muted Etkinlik verileriniz ve içgörüleriniz.

  .row.mb-4
    .col-md-6.mb-3.mb-md-0
      .card.h-100
        .card-body
          h5.card-title.mb-3 Zaman Dönemi Ayarları
          div.d-flex.align-items-center.mb-3
            b-button.px-2(@click="setDate(previousPeriod(), periodLength)", variant="outline-primary")
              icon(name="arrow-left")
            b-select.mx-2.flex-grow-1(:value="periodLength", :options="periodLengths",
                     @change="(periodLength) => setDate(_date, periodLength)")
            b-button.px-2(@click="setDate(nextPeriod(), periodLength)",
                          :disabled="nextPeriod() > today", variant="outline-primary")
              icon(name="arrow-right")

          div.mt-3(v-if="periodLength === 'day'")
            label.form-label(for="date") Tarih Seç:
            input.form-control(id="date" type="date" :value="_date" :max="today"
                               @change="setDate($event.target.value, periodLength)")
          
          .text-muted.small.mt-3(v-if="periodIsBrowseable") {{ timeperiod | friendlyperiod }}
          .text-muted.small(v-else) {{ {"last7d": "son 7 gün", "last30d": "son 30 gün"}[periodLength] }}
          .text-muted.small(v-if="periodLength != 'day'") Sorgu aralığı: {{ periodReadableRange }}

    .col-md-6.mb-3.mb-md-0
      .card.h-100
        .card-body
          h5.card-title.mb-3 Filtreler ve Seçenekler
          b-button.btn.btn-outline-primary.mb-3(@click="showOptions = !showOptions")
            icon(name="filter")
            span.ml-2 Filtreler
            b-badge(pill, variant="secondary" v-if="filters_set > 0).ml-2 {{ filters_set }}

          b-collapse(v-model="showOptions")
            .mt-3
              b-form-checkbox(v-model="filter_afk")
                | AFK zamanını hariç tut
                icon#filterAFKHelp(name="question-circle" style="opacity: 0.4")
                b-tooltip(target="filterAFKHelp" v-b-tooltip.hover title="AFK izleyicisinin herhangi bir girdi algılamadığı zamanı filtrele.")
              b-form-checkbox(v-model="include_audible" :disabled="!filter_afk")
                | Sesli tarayıcı sekmesini aktif say
                icon#includeAudibleHelp(name="question-circle" style="opacity: 0.4")
                b-tooltip(target="includeAudibleHelp" v-b-tooltip.hover title="Aktif pencere sesli bir tarayıcı sekmesi ise, aktif say. Bir tarayıcı izleyicisi gerektirir.")

              b-form-checkbox(v-if="devmode" v-model="include_stopwatch")
                | Manuel olarak kaydedilen olayları dahil et (kronometre)
                br
                | #[b Not:] WIP, aw-server-rust'ı kötü bir şekilde bozar. Yalnızca geliştirme modunda gösterilir.

            .mt-3
              b-form-group(label="Kategoriyi Göster")
                b-form-select(v-model="filter_category", :options="categoryStore.category_select(true)")
              b-button.btn.btn-primary.mt-3(@click="refresh(true)")
                icon(name="sync")
                span.ml-2 Yenile

  aw-periodusage.mt-4(:periodusage_arr="periodusage", @update="setDate")

  aw-uncategorized-notification()

  ul.nav.nav-tabs.mt-4.justify-content-center
    li.nav-item(v-for="view in views" :key="view.id")
      router-link.nav-link(:to="{ name: 'activity-view', params: {...$route.params, view_id: view.id}, query: $route.query}" :class="{'router-link-exact-active': currentView.id == view.id}")
        h6 {{view.name}}

    li.nav-item.ml-auto
      a.nav-link(@click="$refs.new_view.show()")
        h6
          icon(name="plus")
          span.d-none.d-md-inline Yeni görünüm

  b-modal(id="new_view" ref="new_view" title="Yeni görünüm" @show="resetModal" @hidden="resetModal" @ok="handleOk")
    div.my-1
      b-input-group.my-1(prepend="ID")
        b-form-input(v-model="new_view.id")
      b-input-group.my-1(prepend="Ad")
        b-form-input(v-model="new_view.name")

  div.mt-4
    router-view

  aw-devonly
    b-btn(id="load-demo", @click="load_demo")
      | Demo verilerini yükle
</template>

<style lang="scss" scoped>
@import '../../style/globals';

.activity-container {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.nav {
  border-bottom: 1px solid var(--light-border-color);

  .nav-item {
    margin-bottom: 0px;

    &:first-child {
      margin-left: 0;
    }

    .nav-link {
      padding: 0.5rem 1rem; // Daha fazla dikey boşluk
      color: var(--text-color);
      cursor: pointer;
      border: none;
      transition: all 0.3s ease; // Animasyon geçişleri

      &:hover {
        color: var(--active-highlight-color) !important;
        border-bottom: 3px solid var(--active-highlight-color);
        border-radius: 0;
        background-color: transparent; // Hover durumunda arka plan rengi olmasın
      }

      &.router-link-exact-active {
        color: var(--active-highlight-color) !important;
        border-bottom: 3px solid var(--active-highlight-color);
        border-radius: 0;
        font-weight: bold;
        background-color: transparent;

        &:hover {
          background-color: transparent;
        }
      }
    }
  }
}

.card {
  background-color: var(--background-color);
  border: 1px solid var(--light-border-color);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.card-title {
  color: var(--active-highlight-color);
  font-size: 1.4em;
  font-weight: bold;
}

.form-control,
.b-form-select {
  border-color: var(--light-border-color);
  &:focus {
    border-color: var(--active-highlight-color);
    box-shadow: 0 0 0 0.2rem rgba(var(--active-highlight-color), 0.25);
  }
}

.btn-outline-primary {
  color: var(--active-highlight-color);
  border-color: var(--active-highlight-color);
  &:hover {
    background-color: var(--active-highlight-color);
    color: white;
  }
}

.btn-primary {
  background-color: var(--active-highlight-color);
  border-color: var(--active-highlight-color);
  color: white;
  &:hover {
    background-color: darken(var(--active-highlight-color), 10%);
    border-color: darken(var(--active-highlight-color), 10%);
  }
}
</style>

<script lang="ts">
import { mapState } from 'pinia';
import moment from 'moment';
import { get_day_start_with_offset, get_today_with_offset } from '~/util/time';
import { periodLengthConvertMoment } from '~/util/timeperiod';
import _ from 'lodash';

import 'vue-awesome/icons/arrow-left';
import 'vue-awesome/icons/arrow-right';
import 'vue-awesome/icons/sync';
import 'vue-awesome/icons/plus';
import 'vue-awesome/icons/edit';
import 'vue-awesome/icons/times';
import 'vue-awesome/icons/save';
import 'vue-awesome/icons/question-circle';
import 'vue-awesome/icons/filter';

import { useSettingsStore } from '~/stores/settings';
import { useCategoryStore } from '~/stores/categories';
import { useActivityStore, QueryOptions } from '~/stores/activity';
import { useViewsStore } from '~/stores/views';

export default {
  name: 'Activity',
  components: {
    'aw-uncategorized-notification': () => import('~/components/UncategorizedNotification.vue'),
  },
  props: {
    host: String,
    date: {
      type: String,
      // NOTE: This does not work as you'd might expect since the default is set on
      // initialization, which would lead to the same date always being returned,
      // even if the day has changed.
      // Instead, use the computed _date.
      //default: get_today(),
    },
    periodLength: {
      type: String,
      default: 'day',
    },
  },
  data: function () {
    return {
      activityStore: useActivityStore(),
      categoryStore: useCategoryStore(),
      viewsStore: useViewsStore(),
      settingsStore: useSettingsStore(),

      today: null,
      showOptions: false,

      include_audible: true,
      include_stopwatch: false,
      filter_afk: true,
      new_view: {},
    };
  },
  computed: {
    ...mapState(useViewsStore, ['views']),
    ...mapState(useSettingsStore, ['devmode']),
    ...mapState(useSettingsStore, ['always_active_pattern']),

    // number of filters currently set (different from defaults)
    filters_set() {
      return (this.filter_category ? 1 : 0) + (!this.filter_afk ? 1 : 0);
    },

    // getter and setter for filter_category, getting and setting $route.query
    filter_category: {
      get() {
        if (!this.$route.query.category) return null;
        return this.$route.query.category.split('>');
      },
      set(value) {
        if (value == null) {
          this.$router.push({ query: _.omit(this.$route.query, 'category') });
        } else {
          this.$router.push({ query: { ...this.$route.query, category: value.join('>') } });
        }
      },
    },

    periodLengths: function () {
      const settingsStore = useSettingsStore();
      let periods: Record<string, string> = {
        day: 'day',
        week: 'week',
        month: 'month',
      };
      if (settingsStore.showYearly) {
        periods['year'] = 'year';
      }
      periods = {
        ...periods,
        last7d: '7 days',
        last30d: '30 days',
      };
      return periods;
    },
    periodIsBrowseable: function () {
      return ['day', 'week', 'month', 'year'].includes(this.periodLength);
    },
    currentView: function () {
      return this.views.find(v => v.id == this.$route.params.view_id) || this.views[0];
    },
    currentViewId: function () {
      // If localStore is not yet initialized, then currentView can be undefined. In that case, we return an empty string (which should route to the default view)
      return this.currentView !== undefined ? this.currentView.id : '';
    },
    _date: function () {
      const offset = this.settingsStore.startOfDay;
      return this.date || get_today_with_offset(offset);
    },
    subview: function () {
      return this.$route.meta.subview;
    },
    filter_categories: function () {
      if (this.filter_category) {
        const cats = this.categoryStore.all_categories;
        const isChild = p => c => c.length > p.length && _.isEqual(p, c.slice(0, p.length));
        const children = _.filter(cats, isChild(this.filter_category));
        return [this.filter_category].concat(children);
      } else {
        return null;
      }
    },
    link_prefix: function () {
      return `/activity/${this.host}/${this.periodLength}`;
    },
    periodusage: function () {
      return this.activityStore.getActiveHistoryAroundTimeperiod(this.timeperiod);
    },
    timeperiod: function () {
      const settingsStore = useSettingsStore();

      if (this.periodIsBrowseable) {
        return {
          start: get_day_start_with_offset(this._date, settingsStore.startOfDay),
          length: [1, this.periodLength],
        };
      } else {
        const len = { last7d: [7, 'days'], last30d: [30, 'days'] }[this.periodLength];
        return {
          start: get_day_start_with_offset(
            moment(this._date).subtract(len[0] - 1, len[1]),
            settingsStore.startOfDay
          ),
          length: len,
        };
      }
    },
    periodReadableRange: function () {
      const periodStart = moment(this.timeperiod.start);
      const dateFormatString = 'YYYY-MM-DD';

      // it's helpful to render a range for the week as opposed to just the start of the week
      // or the number of the week so users can easily determine (a) if we are using monday/sunday as the week
      // start and exactly when the week ends. The formatting code ends up being a bit more wonky, but it's
      // worth the tradeoff. https://github.com/ActivityWatch/aw-webui/pull/284

      let periodLength;
      if (this.periodIsBrowseable) {
        periodLength = [1, this.periodLength];
      } else {
        if (this.periodLength === 'last7d') {
          periodLength = [7, 'day'];
        } else if (this.periodLength === 'last30d') {
          periodLength = [30, 'day'];
        } else {
          throw 'unknown periodLength';
        }
      }

      const startOfPeriod = periodStart.format(dateFormatString);
      const endOfPeriod = periodStart.add(...periodLength).format(dateFormatString);
      return `${startOfPeriod}—${endOfPeriod}`;
    },
  },
  watch: {
    host: function () {
      this.refresh();
    },
    timeperiod: function () {
      this.refresh();
    },
    filter_category: function () {
      this.refresh();
    },
    filter_afk: function () {
      this.refresh();
    },
    include_audible: function () {
      this.refresh();
    },
  },

  mounted: async function () {
    this.viewsStore.load();
    this.categoryStore.load();
    try {
      await this.refresh();
    } catch (e) {
      if (e.message !== 'canceled') {
        console.error(e);
        throw e;
      }
    }
  },

  beforeDestroy: async function () {
    // Cancels pending requests and resets store
    await this.activityStore.reset();
  },

  methods: {
    previousPeriod: function () {
      return moment(this._date)
        .subtract(
          this.timeperiod.length[0],
          this.timeperiod.length[1] as moment.unitOfTime.DurationConstructor
        )
        .format('YYYY-MM-DD');
    },
    nextPeriod: function () {
      return moment(this._date)
        .add(
          this.timeperiod.length[0],
          this.timeperiod.length[1] as moment.unitOfTime.DurationConstructor
        )
        .format('YYYY-MM-DD');
    },

    setDate: function (date, periodLength) {
      // periodLength is an optional argument, default to this.periodLength
      if (!periodLength) {
        periodLength = this.periodLength;
      }

      const momentJsDate = moment(date);
      if (!momentJsDate.isValid()) {
        return;
      }

      let new_date;
      if (periodLength == '7 days') {
        periodLength = 'last7d';
        new_date = momentJsDate.add(1, 'days').format('YYYY-MM-DD');
      } else if (periodLength == '30 days') {
        periodLength = 'last30d';
        new_date = momentJsDate.add(1, 'days').format('YYYY-MM-DD');
      } else {
        const new_period_length_moment = periodLengthConvertMoment(periodLength);
        new_date = momentJsDate.startOf(new_period_length_moment).format('YYYY-MM-DD');
      }
      const path = `/activity/${this.host}/${periodLength}/${new_date}/${this.subview}/${this.currentViewId}`;
      if (this.$route.path !== path) {
        this.$router.push({
          path,
          query: this.$route.query,
        });
      }
    },

    refresh: async function (force) {
      const queryOptions: QueryOptions = {
        timeperiod: this.timeperiod,
        host: this.host,
        force: force,
        filter_afk: this.filter_afk,
        include_audible: this.include_audible,
        include_stopwatch: this.include_stopwatch,
        filter_categories: this.filter_categories,
        always_active_pattern: this.always_active_pattern,
      };
      await this.activityStore.ensure_loaded(queryOptions);
    },

    load_demo: async function () {
      await this.activityStore.load_demo();
    },

    checkFormValidity() {
      // All checks must be false for check to pass
      const checks = {
        // Check if view id is unique
        'ID is not unique': this.viewsStore.views.map(v => v.id).includes(this.new_view.id),
        'Missing ID': this.new_view.id === '',
        'Missing name': this.new_view.name === '',
      };
      const errors = Object.entries(checks)
        .filter(([_k, v]) => v)
        .map(([k, _v]) => k);
      const valid = errors.length == 0;
      if (!valid) {
        alert(`Invalid form input: ${errors}`);
      }
      return valid;
    },

    handleOk(event) {
      // Prevent modal from closing
      event.preventDefault();
      // Trigger submit handler
      this.handleSubmit();
    },

    handleSubmit() {
      // Exit when the form isn't valid
      const valid = this.checkFormValidity();
      if (!valid) {
        return;
      }

      const viewsStore = useViewsStore();
      viewsStore.addView({ id: this.new_view.id, name: this.new_view.name, elements: [] });
      viewsStore.save();

      // Hide the modal manually
      this.$nextTick(() => {
        this.$refs.new_view.hide();
      });
    },

    resetModal() {
      this.new_view = {
        id: '',
        name: '',
      };
    },
  },
};
</script>
