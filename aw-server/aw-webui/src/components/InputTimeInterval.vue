<template lang="pug">
div.aw-container
  div.mb-3(v-if="invalidDaterange || daterangeTooLong")
    b-alert(v-if="invalidDaterange", variant="warning", show)
      | Seçilen tarih aralığı geçersiz. İkinci tarih, ilk tarihten büyük veya eşit olmalıdır.
    b-alert(v-if="daterangeTooLong", variant="warning", show)
      | Seçilen tarih aralığı çok uzun. Maksimum {{ maxDuration/(24*60*60) }} gün.

  div.d-flex.flex-column.flex-md-row.justify-content-between.align-items-md-center
    div.mb-3.mb-md-0
      label.form-label.mr-2 Göster:
      .btn-group(role="group")
        template(v-for="(dur, idx) in durations")
          input(
            type="radio"
            :id="'dur' + idx"
            :value="dur.seconds"
            v-model="duration"
            @change="applyLastDuration"
          ).d-none
          label(:for="'dur' + idx" v-html="dur.label").btn.btn-outline-primary.btn-sm

    div.d-flex.align-items-center
      label.form-label.mr-2 Şuradan:
      input.form-control.form-control-sm.mr-2(type="date", v-model="start")
      label.form-label.mr-2 Şuraya:
      input.form-control.form-control-sm.mr-2(type="date", v-model="end")
      button.btn.btn-primary.btn-sm(
        type="button",
        :disabled="invalidDaterange || emptyDaterange || daterangeTooLong",
        @click="applyRange"
      ) Uygula

    div.text-muted.text-md-right.mt-3.mt-md-0(v-if="showUpdate")
      b-button.px-3(@click="refresh()", variant="outline-secondary", size="sm")
        icon(name="sync")
        span.ml-1 Yenile
      div.mt-2.small(v-if="lastUpdate")
        | Son güncelleme: #[time(:datetime="lastUpdate.format()") {{lastUpdate | friendlytime}}]
</template>

<style scoped lang="scss">
@import '../style/globals';

.btn-group {
  input[type='radio']:checked + label {
    background-color: $activeHighlightColor;
    border-color: $activeHighlightColor;
    color: white;
  }
}

.form-control-sm {
  max-width: 150px;
}
</style>

<script lang="ts">
import moment from 'moment';
import 'vue-awesome/icons/sync';
export default {
  name: 'input-timeinterval',
  props: {
    defaultDuration: {
      type: Number,
      default: 60 * 60,
    },
    maxDuration: {
      type: Number,
      default: null,
    },
    showUpdate: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      duration: null,
      mode: 'last_duration',
      start: null,
      end: null,
      lastUpdate: null,
      durations: [
        { seconds: 0.25 * 60 * 60, label: '&frac14;h' },
        { seconds: 0.5 * 60 * 60, label: '&frac12;h' },
        { seconds: 60 * 60, label: '1h' },
        { seconds: 2 * 60 * 60, label: '2h' },
        { seconds: 3 * 60 * 60, label: '3h' },
        { seconds: 4 * 60 * 60, label: '4h' },
        { seconds: 6 * 60 * 60, label: '6h' },
        { seconds: 12 * 60 * 60, label: '12h' },
        { seconds: 24 * 60 * 60, label: '24h' },
        { seconds: 48 * 60 * 60, label: '48h' },
      ],
    };
  },
  computed: {
    value: {
      get() {
        if (this.mode == 'range' && this.start && this.end) {
          return [moment(this.start), moment(this.end).add(1, 'day')];
        } else {
          return [moment().subtract(this.duration, 'seconds'), moment()];
        }
      },
    },
    emptyDaterange() {
      return !(this.start && this.end);
    },
    invalidDaterange() {
      return moment(this.start) > moment(this.end);
    },
    daterangeTooLong() {
      return moment(this.start).add(this.maxDuration, 'seconds').isBefore(moment(this.end));
    },
  },
  mounted() {
    this.duration = this.defaultDuration;
    this.valueChanged();

    // We want our lastUpdated text to update every ~500ms
    // We can do this by setting it to null and then the previous value.
    this.lastUpdateTimer = setInterval(() => {
      const _lastUpdate = this.lastUpdate;
      this.lastUpdate = null;
      this.lastUpdate = _lastUpdate;
    }, 500);
  },
  beforeDestroy() {
    clearInterval(this.lastUpdateTimer);
  },
  methods: {
    valueChanged() {
      if (
        this.mode == 'last_duration' ||
        (!this.emptyDaterange && !this.invalidDaterange && !this.daterangeTooLong)
      ) {
        this.lastUpdate = moment();
        this.$emit('input', this.value);
      }
    },
    refresh() {
      const tmpMode = this.mode;
      this.mode = '';
      this.mode = tmpMode;
      this.valueChanged();
    },
    applyRange() {
      this.mode = 'range';
      this.duration = 0;
      this.valueChanged();
    },
    applyLastDuration() {
      this.mode = 'last_duration';
      this.valueChanged();
    },
  },
};
</script>
