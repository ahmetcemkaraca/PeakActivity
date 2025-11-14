<template lang="pug">
.agent-schedules
  .schedules-header
    h2 ⏰ Agent Zamanlama
    p.subtitle Periyodik agent çalıştırma ve otomasyonlar

    button.btn-create(@click="showCreateModal = true")
      span.icon ➕
      span Yeni Zamanlama

  .stats-overview(v-if="stats")
    .stat-card
      .stat-icon 📊
      .stat-info
        .stat-value {{ stats.totalSchedules }}
        .stat-label Toplam Zamanlama

    .stat-card
      .stat-icon ✅
      .stat-info
        .stat-value {{ stats.enabledSchedules }}
        .stat-label Aktif

    .stat-card
      .stat-icon ⏸️
      .stat-info
        .stat-value {{ stats.disabledSchedules }}
        .stat-label Devre Dışı

    .stat-card
      .stat-icon 🔄
      .stat-info
        .stat-value {{ stats.totalRuns }}
        .stat-label Toplam Çalıştırma

    .stat-card.success
      .stat-icon ✅
      .stat-info
        .stat-value {{ stats.successfulRuns }}
        .stat-label Başarılı

    .stat-card.error
      .stat-icon ❌
      .stat-info
        .stat-value {{ stats.failedRuns }}
        .stat-label Başarısız

  .error-message(v-if="error")
    span.icon ⚠️
    span {{ error }}

  .schedules-list(v-if="schedules.length > 0")
    .schedule-card(
      v-for="schedule in schedules"
      :key="schedule.id"
      :class="{ disabled: !schedule.enabled }"
    )
      .schedule-header
        .schedule-title
          h3 {{ schedule.name }}
          .status-badge(:class="{ active: schedule.enabled }")
            | {{ schedule.enabled ? '✓ Aktif' : '⏸ Devre Dışı' }}

        .schedule-actions
          button.btn-icon(@click="toggleSchedule(schedule)" :title="schedule.enabled ? 'Devre Dışı Bırak' : 'Etkinleştir'")
            span {{ schedule.enabled ? '⏸️' : '▶️' }}
          button.btn-icon(@click="triggerNow(schedule)" :title="'Şimdi Çalıştır'" :disabled="!schedule.enabled")
            span 🚀
          button.btn-icon(@click="editSchedule(schedule)" :title="'Düzenle'")
            span ✏️
          button.btn-icon.danger(@click="deleteSchedule(schedule)" :title="'Sil'")
            span 🗑️

      .schedule-description(v-if="schedule.description")
        p {{ schedule.description }}

      .schedule-info
        .info-item
          .info-label 📋 Agent Topic
          .info-value {{ schedule.agentConfig.topic }}

        .info-item
          .info-label ⏰ Zamanlama
          .info-value {{ formatSchedule(schedule.schedule) }}

        .info-item(v-if="schedule.nextRun")
          .info-label 🕒 Sonraki Çalıştırma
          .info-value {{ formatTimestamp(schedule.nextRun) }}

        .info-item(v-if="schedule.lastRun")
          .info-label 🔄 Son Çalıştırma
          .info-value
            span {{ formatTimestamp(schedule.lastRun.timestamp) }}
            span.status-indicator(:class="schedule.lastRun.status")
              | {{ schedule.lastRun.status === 'completed' ? ' ✓' : ' ✗' }}

      .schedule-metadata(v-if="schedule.metadata")
        .metadata-item
          span.label Toplam:
          span.value {{ schedule.metadata.totalRuns }}

        .metadata-item.success
          span.label Başarılı:
          span.value {{ schedule.metadata.successfulRuns }}

        .metadata-item.error
          span.label Başarısız:
          span.value {{ schedule.metadata.failedRuns }}

        .metadata-item(v-if="schedule.metadata.lastError")
          span.label Son Hata:
          span.value.error-text {{ schedule.metadata.lastError }}

  .empty-state(v-else-if="!isLoading")
    span.icon 📅
    h3 Henüz zamanlama yok
    p Agent'larınızın periyodik olarak çalışması için zamanlama oluşturun
    button.btn-create(@click="showCreateModal = true")
      span.icon ➕
      span İlk Zamanlamayı Oluştur

  // Create/Edit Modal
  .modal(v-if="showCreateModal || editingSchedule" @click.self="closeModal")
    .modal-content
      .modal-header
        h3 {{ editingSchedule ? '✏️ Zamanlamayı Düzenle' : '➕ Yeni Zamanlama Oluştur' }}
        button.close-btn(@click="closeModal") ✕

      .modal-body
        .form-group
          label İsim *
          input(
            v-model="formData.name"
            type="text"
            placeholder="Örn: Günlük Üretkenlik Raporu"
            required
          )

        .form-group
          label Açıklama
          textarea(
            v-model="formData.description"
            rows="2"
            placeholder="Bu zamanlamanın ne yaptığını açıklayın"
          )

        .form-group
          label Agent Topic *
          input(
            v-model="formData.topic"
            type="text"
            placeholder="Örn: daily_productivity_report"
            required
          )

        .form-group
          label Agent Konfigürasyonu (YAML) *
          textarea(
            v-model="formData.agentConfigYaml"
            rows="10"
            placeholder="Agent configuration YAML..."
            required
          )
          .help-text Agent konfigürasyonunu YAML formatında girin

        .form-group
          label Zamanlama Tipi *
          select(v-model="formData.schedule.type" @change="onScheduleTypeChange")
            option(value="cron") Cron Expression
            option(value="interval") Periyodik Interval
            option(value="once") Tek Seferlik

        .form-group(v-if="formData.schedule.type === 'cron'")
          label Cron Expression *
          input(
            v-model="formData.schedule.expression"
            type="text"
            placeholder="0 9 * * * (Her gün saat 9:00)"
            required
          )
          .help-text
            | Örnekler:
            br
            code 0 0 * * *
            | - Her gece yarısı
            br
            code 0 9 * * *
            | - Her gün saat 9:00
            br
            code 0 0 * * 1
            | - Her Pazartesi gece yarısı
            br
            code */15 * * * *
            | - Her 15 dakikada bir

        .form-group(v-if="formData.schedule.type === 'interval'")
          label Interval (Dakika) *
          input(
            v-model.number="intervalMinutes"
            type="number"
            min="1"
            placeholder="60"
            required
          )
          .help-text Minimum 1 dakika

        .form-group(v-if="formData.schedule.type === 'once'")
          label Çalıştırma Zamanı *
          input(
            v-model="runAtDateTime"
            type="datetime-local"
            required
          )

        .form-group
          label
            input(type="checkbox" v-model="formData.enabled")
            span Hemen etkinleştir

      .modal-actions
        button.btn-secondary(@click="closeModal") İptal
        button.btn-primary(
          @click="saveSchedule"
          :disabled="!isFormValid || isLoading"
        )
          span.icon {{ isLoading ? '⏳' : '💾' }}
          span {{ isLoading ? 'Kaydediliyor...' : 'Kaydet' }}
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Timestamp } from 'firebase/firestore';

interface Schedule {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  agentConfig: {
    agentConfigYaml: string;
    topic: string;
  };
  schedule: {
    type: 'cron' | 'interval' | 'once';
    expression?: string;
    intervalMs?: number;
    runAt?: Timestamp;
  };
  enabled: boolean;
  lastRun?: {
    runId: string;
    timestamp: Timestamp;
    status: 'completed' | 'failed';
  };
  nextRun?: Timestamp;
  metadata?: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    lastError?: string;
  };
}

interface Stats {
  totalSchedules: number;
  enabledSchedules: number;
  disabledSchedules: number;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
}

const functions = getFunctions();

const schedules = ref<Schedule[]>([]);
const stats = ref<Stats | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

const showCreateModal = ref(false);
const editingSchedule = ref<Schedule | null>(null);

const formData = ref({
  name: '',
  description: '',
  topic: '',
  agentConfigYaml: '',
  schedule: {
    type: 'cron' as 'cron' | 'interval' | 'once',
    expression: '0 9 * * *'
  },
  enabled: true
});

const intervalMinutes = ref(60);
const runAtDateTime = ref('');

const isFormValid = computed(() => {
  if (!formData.value.name || !formData.value.topic || !formData.value.agentConfigYaml) {
    return false;
  }

  if (formData.value.schedule.type === 'cron') {
    return !!formData.value.schedule.expression;
  } else if (formData.value.schedule.type === 'interval') {
    return intervalMinutes.value >= 1;
  } else if (formData.value.schedule.type === 'once') {
    return !!runAtDateTime.value;
  }

  return false;
});

onMounted(async () => {
  await loadSchedules();
  await loadStats();
});

const loadSchedules = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const listSchedules = httpsCallable(functions, 'listAgentSchedules');
    const result = await listSchedules({});
    schedules.value = (result.data as any).schedules || [];
  } catch (err: any) {
    error.value = `Zamanlamalar yüklenemedi: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
};

const loadStats = async () => {
  try {
    const getStats = httpsCallable(functions, 'getAgentScheduleStats');
    const result = await getStats({});
    stats.value = (result.data as any).stats || null;
  } catch (err: any) {
    console.error('Stats yüklenemedi:', err);
  }
};

const toggleSchedule = async (schedule: Schedule) => {
  isLoading.value = true;
  error.value = null;

  try {
    const updateSchedule = httpsCallable(functions, 'updateAgentSchedule');
    await updateSchedule({
      scheduleId: schedule.id,
      enabled: !schedule.enabled
    });

    await loadSchedules();
    await loadStats();
  } catch (err: any) {
    error.value = `Zamanlama güncellenemedi: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
};

const triggerNow = async (schedule: Schedule) => {
  if (!confirm(`"${schedule.name}" zamanlamasını şimdi çalıştırmak istediğinize emin misiniz?`)) {
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const trigger = httpsCallable(functions, 'triggerAgentSchedule');
    await trigger({ scheduleId: schedule.id });

    alert('Agent başarıyla çalıştırıldı!');
    await loadSchedules();
    await loadStats();
  } catch (err: any) {
    error.value = `Agent çalıştırılamadı: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
};

const editSchedule = (schedule: Schedule) => {
  editingSchedule.value = schedule;
  formData.value = {
    name: schedule.name,
    description: schedule.description || '',
    topic: schedule.agentConfig.topic,
    agentConfigYaml: schedule.agentConfig.agentConfigYaml,
    schedule: {
      type: schedule.schedule.type,
      expression: schedule.schedule.expression || '0 9 * * *'
    },
    enabled: schedule.enabled
  };

  if (schedule.schedule.intervalMs) {
    intervalMinutes.value = schedule.schedule.intervalMs / 60000;
  }
};

const deleteSchedule = async (schedule: Schedule) => {
  if (!confirm(`"${schedule.name}" zamanlamasını silmek istediğinize emin misiniz?`)) {
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const deleteFunc = httpsCallable(functions, 'deleteAgentSchedule');
    await deleteFunc({ scheduleId: schedule.id });

    await loadSchedules();
    await loadStats();
  } catch (err: any) {
    error.value = `Zamanlama silinemedi: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
};

const saveSchedule = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const scheduleData: any = {
      name: formData.value.name,
      description: formData.value.description,
      topic: formData.value.topic,
      agentConfigYaml: formData.value.agentConfigYaml,
      schedule: {
        type: formData.value.schedule.type
      },
      enabled: formData.value.enabled
    };

    if (formData.value.schedule.type === 'cron') {
      scheduleData.schedule.expression = formData.value.schedule.expression;
    } else if (formData.value.schedule.type === 'interval') {
      scheduleData.schedule.intervalMs = intervalMinutes.value * 60000;
    } else if (formData.value.schedule.type === 'once') {
      const runAt = new Date(runAtDateTime.value);
      scheduleData.schedule.runAt = { seconds: Math.floor(runAt.getTime() / 1000) };
    }

    if (editingSchedule.value) {
      const updateFunc = httpsCallable(functions, 'updateAgentSchedule');
      await updateFunc({
        scheduleId: editingSchedule.value.id,
        ...scheduleData
      });
    } else {
      const createFunc = httpsCallable(functions, 'createAgentSchedule');
      await createFunc(scheduleData);
    }

    closeModal();
    await loadSchedules();
    await loadStats();
  } catch (err: any) {
    error.value = `Zamanlama kaydedilemedi: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingSchedule.value = null;
  formData.value = {
    name: '',
    description: '',
    topic: '',
    agentConfigYaml: '',
    schedule: {
      type: 'cron',
      expression: '0 9 * * *'
    },
    enabled: true
  };
  intervalMinutes.value = 60;
  runAtDateTime.value = '';
};

const onScheduleTypeChange = () => {
  // Reset type-specific fields
  if (formData.value.schedule.type === 'cron') {
    formData.value.schedule.expression = '0 9 * * *';
  }
};

const formatSchedule = (schedule: Schedule['schedule']): string => {
  if (schedule.type === 'cron') {
    const common = {
      '0 0 * * *': 'Her gün gece yarısı',
      '0 9 * * *': 'Her gün saat 9:00',
      '0 * * * *': 'Her saat başı',
      '*/15 * * * *': 'Her 15 dakikada',
      '0 0 * * 1': 'Her Pazartesi gece yarısı',
      '0 0 1 * *': 'Her ayın 1. günü'
    };
    return common[schedule.expression!] || schedule.expression || '';
  } else if (schedule.type === 'interval') {
    const minutes = (schedule.intervalMs || 0) / 60000;
    if (minutes < 60) {
      return `Her ${minutes} dakikada`;
    }
    const hours = minutes / 60;
    return `Her ${hours} saatte`;
  } else if (schedule.type === 'once') {
    return 'Tek seferlik';
  }
  return '';
};

const formatTimestamp = (timestamp: Timestamp): string => {
  if (!timestamp) return '';
  const date = new Date((timestamp as any).seconds * 1000);
  return date.toLocaleString('tr-TR');
};
</script>

<style scoped lang="scss">
.agent-schedules {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;

  .schedules-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    h2 {
      font-size: 2rem;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #666;
      margin: 0;
    }

    .btn-create {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s;

      &:hover {
        background: #5568d3;
      }

      .icon {
        font-size: 1.125rem;
      }
    }
  }

  .stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 0.75rem;
      transition: box-shadow 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.success {
        border-color: #10b981;
        background: linear-gradient(135deg, #ffffff 0%, #d1fae5 100%);
      }

      &.error {
        border-color: #ef4444;
        background: linear-gradient(135deg, #ffffff 0%, #fee 100%);
      }

      .stat-icon {
        font-size: 2rem;
      }

      .stat-info {
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #666;
        }
      }
    }
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 0.5rem;
    color: #c33;
    margin-bottom: 2rem;

    .icon {
      font-size: 1.5rem;
    }
  }

  .schedules-list {
    display: grid;
    gap: 1.5rem;

    .schedule-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 1rem;
      padding: 1.5rem;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.disabled {
        opacity: 0.6;
        background: #f9f9f9;
      }

      .schedule-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        .schedule-title {
          display: flex;
          align-items: center;
          gap: 1rem;

          h3 {
            margin: 0;
            font-size: 1.25rem;
          }

          .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            background: #e0e0e0;
            color: #666;

            &.active {
              background: #d1fae5;
              color: #065f46;
            }
          }
        }

        .schedule-actions {
          display: flex;
          gap: 0.5rem;

          .btn-icon {
            width: 2.5rem;
            height: 2.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: #f0f0f0;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1.125rem;

            &:hover:not(:disabled) {
              background: #e0e0e0;
            }

            &:disabled {
              opacity: 0.4;
              cursor: not-allowed;
            }

            &.danger:hover:not(:disabled) {
              background: #fee;
              color: #c33;
            }
          }
        }
      }

      .schedule-description {
        margin-bottom: 1rem;

        p {
          color: #666;
          font-size: 0.95rem;
          margin: 0;
        }
      }

      .schedule-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;

        .info-item {
          padding: 0.75rem;
          background: #f9f9f9;
          border-radius: 0.5rem;

          .info-label {
            font-size: 0.75rem;
            color: #999;
            margin-bottom: 0.25rem;
          }

          .info-value {
            font-size: 0.95rem;
            font-weight: 500;

            .status-indicator {
              &.completed {
                color: #10b981;
              }

              &.failed {
                color: #ef4444;
              }
            }
          }
        }
      }

      .schedule-metadata {
        display: flex;
        gap: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid #e0e0e0;

        .metadata-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;

          .label {
            color: #999;
          }

          .value {
            font-weight: 600;
          }

          &.success .value {
            color: #10b981;
          }

          &.error .value {
            color: #ef4444;
          }

          .error-text {
            color: #ef4444;
            font-size: 0.75rem;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: #f9f9f9;
    border: 2px dashed #e0e0e0;
    border-radius: 1rem;

    .icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    p {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .btn-create {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s;

      &:hover {
        background: #5568d3;
      }
    }
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .modal-content {
      background: white;
      border-radius: 1rem;
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e0e0e0;

        h3 {
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          transition: background 0.3s;

          &:hover {
            background: #f0f0f0;
          }
        }
      }

      .modal-body {
        padding: 1.5rem;
        overflow-y: auto;

        .form-group {
          margin-bottom: 1.5rem;

          label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;

            input[type="checkbox"] {
              margin-right: 0.5rem;
            }
          }

          input[type="text"],
          input[type="number"],
          input[type="datetime-local"],
          select,
          textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #e0e0e0;
            border-radius: 0.5rem;
            font-family: inherit;
            font-size: 1rem;

            &:focus {
              outline: none;
              border-color: #667eea;
            }
          }

          textarea {
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.875rem;
          }

          .help-text {
            margin-top: 0.5rem;
            font-size: 0.875rem;
            color: #666;

            code {
              background: #f0f0f0;
              padding: 0.125rem 0.25rem;
              border-radius: 0.25rem;
              font-family: 'Monaco', monospace;
            }
          }
        }
      }

      .modal-actions {
        display: flex;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid #e0e0e0;

        button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          &.btn-primary {
            background: #667eea;
            color: white;

            &:hover:not(:disabled) {
              background: #5568d3;
            }
          }

          &.btn-secondary {
            background: #e0e0e0;
            color: #333;

            &:hover:not(:disabled) {
              background: #d0d0d0;
            }
          }
        }
      }
    }
  }
}
</style>
