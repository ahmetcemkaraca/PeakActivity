<template lang="pug">
div.goals-container.aw-container
  .row.mb-4
    .col-12.text-center
      h2.display-4.mb-3 Hedef Takibi ve İlerleme Durumu
      p.lead.text-muted Hedeflerinizi belirleyin ve ilerlemenizi takip edin.

  // Yeni Hedef Ekle Formu
  .card.mb-4
    .card-header
      h3.card-title.mb-0 Yeni Hedef Ekle
    .card-body
      b-form(@submit.prevent="addGoal")
        .row
          .col-md-6
            b-form-group.mb-3(label="Hedef Başlığı:" label-for="goalTitle")
              b-form-input(type="text" id="goalTitle" v-model="newGoal.title" required)
            b-form-group.mb-3(label="Açıklama:" label-for="goalDescription")
              b-form-textarea(id="goalDescription" v-model="newGoal.description" rows="3")
            b-form-group.mb-3(label="Hedef Türü:" label-for="goalType")
              b-form-select(id="goalType" v-model="newGoal.type" required)
                b-form-select-option(value="") Seçiniz
                b-form-select-option(value="time_based") Süre Bazlı
                b-form-select-option(value="count_based") Sayı Bazlı
                b-form-select-option(value="habit_based") Alışkanlık Bazlı
                b-form-select-option(value="milestone_based") Kilometre Taşı Bazlı

          .col-md-6
            // Hedef Türüne Göre Dinamik Alanlar
            div(v-if="newGoal.type === 'time_based'")
              b-form-group.mb-3(label="Hedef Süre (saat):" label-for="targetDuration")
                b-form-input(type="number" id="targetDuration" v-model.number="newGoal.targetDuration" min="0")
              b-form-group.mb-3(label="Günlük Hedef Süre (saat):" label-for="targetDailyDuration")
                b-form-input(type="number" id="targetDailyDuration" v-model.number="newGoal.targetDailyDuration" min="0")
              b-form-group.mb-3(label="Haftalık Hedef Süre (saat):" label-for="targetWeeklyDuration")
                b-form-input(type="number" id="targetWeeklyDuration" v-model.number="newGoal.targetWeeklyDuration" min="0")
            div(v-else-if="newGoal.type === 'count_based'")
              b-form-group.mb-3(label="Hedef Sayı:" label-for="targetCount")
                b-form-input(type="number" id="targetCount" v-model.number="newGoal.targetCount" min="0")

            b-form-group.mb-3(label="Hedef Kriterleri (JSON):" label-for="targetCriteria")
              b-form-textarea(id="targetCriteria" v-model="newGoal.targetCriteria" required rows="5")
              small.form-text.text-muted Örn: `{"appNames": ["vscode"]}` veya `{"categories": ["development"]}`
            
        .d-flex.justify-content-end
          b-button.btn.btn-primary(type="submit" :disabled="addingGoal")
            span(v-if="addingGoal") Ekleniyor...
            span(v-else) Hedef Ekle
      b-alert(v-if="addGoalError" show variant="danger" class="mt-3") Hata: {{ addGoalError }}
      b-alert(v-if="addGoalSuccess" show variant="success" class="mt-3") Hedef başarıyla eklendi!

  // Mevcut Hedefler Listesi
  .card
    .card-header
      h3.card-title.mb-0 Mevcut Hedefler
    .card-body
      p(v-if="loadingGoals") Hedefler yükleniyor...
      p.error-message(v-if="loadGoalsError") {{ loadGoalsError }}
      .row(v-if="filteredGoals.length")
        .col-md-6.col-lg-4.mb-4(v-for="goal in filteredGoals" :key="goal.id")
          .card.h-100
            .card-body
              div(v-if="editingGoalId !== goal.id")
                h4.card-title.mb-2 {{ goal.title }}
                p.card-text #[strong Açıklama:] {{ goal.description || 'Yok' }}
                p.card-text #[strong Tür:] {{ goal.type | formatGoalType }}
                p.card-text(v-if="goal.type === 'time_based'")
                  #[strong Hedef Süre:] {{ formatDuration(goal.targetDuration) }} / Günlük: {{ formatDuration(goal.targetDailyDuration) }} / Haftalık: {{ formatDuration(goal.targetWeeklyDuration) }}
                p.card-text(v-if="goal.type === 'count_based'")
                  #[strong Hedef Sayı:] {{ goal.targetCount }}
                  br
                  #[strong Mevcut Sayı:] {{ goal.progress.currentCount || 0 }}
                p.card-text #[strong Kriterler:]
                  pre.json-display {{ JSON.stringify(goal.targetCriteria, null, 2) }}
                p.card-text #[strong Mevcut İlerleme:] {{ formatDuration(goal.progress.currentDuration) }}
                p.card-text #[strong Seri:] {{ goal.progress.currentStreak }} gün (En Uzun: {{ goal.progress.longestStreak }} gün)
                p.card-text #[strong Son Güncelleme:] {{ new Date(goal.progress.lastUpdated).toLocaleString() }}
                p.card-text.mb-3 #[strong İlerleme Yüzdesi:] {{ calculateProgress(goal).toFixed(2) }}%

                .progress.mb-3
                  .progress-bar(
                    role="progressbar"
                    :style="{ width: calculateProgress(goal) + '%' }"
                    :aria-valuenow="calculateProgress(goal)"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ) {{ calculateProgress(goal).toFixed(0) }}%

                .d-flex.justify-content-between
                  b-button.btn.btn-outline-primary.btn-sm(@click="startEdit(goal)") Düzenle
                  b-button.btn.btn-danger.btn-sm(@click="deleteGoal(goal.id)") Sil
              div(v-else)
                h4.card-title.mb-3 Hedefi Düzenle: {{ editingGoal.title }}
                b-form-group.mb-3(label="Başlık:" label-for="editGoalTitle")
                  b-form-input(type="text" id="editGoalTitle" v-model="editingGoal.title" required)
                b-form-group.mb-3(label="Açıklama:" label-for="editGoalDescription")
                  b-form-textarea(id="editGoalDescription" v-model="editingGoal.description" rows="3")
                b-form-group.mb-3(label="Hedef Türü:" label-for="editGoalType")
                  b-form-select(id="editGoalType" v-model="editingGoal.type" required)
                    b-form-select-option(value="") Seçiniz
                    b-form-select-option(value="time_based") Süre Bazlı
                    b-form-select-option(value="count_based") Sayı Bazlı
                    b-form-select-option(value="habit_based") Alışkanlık Bazlı
                    b-form-select-option(value="milestone_based") Kilometre Taşı Bazlı

                div(v-if="editingGoal.type === 'time_based'")
                  b-form-group.mb-3(label="Hedef Süre (saat):" label-for="editTargetDuration")
                    b-form-input(type="number" id="editTargetDuration" v-model.number="editingGoal.targetDuration" min="0")
                  b-form-group.mb-3(label="Günlük Hedef Süre (saat):" label-for="editTargetDailyDuration")
                    b-form-input(type="number" id="editTargetDailyDuration" v-model.number="editingGoal.targetDailyDuration" min="0")
                  b-form-group.mb-3(label="Haftalık Hedef Süre (saat):" label-for="editTargetWeeklyDuration")
                    b-form-input(type="number" id="editTargetWeeklyDuration" v-model.number="editingGoal.targetWeeklyDuration" min="0")
                div(v-else-if="editingGoal.type === 'count_based'")
                  b-form-group.mb-3(label="Hedef Sayı:" label-for="editTargetCount")
                    b-form-input(type="number" id="editTargetCount" v-model.number="editingGoal.targetCount" min="0")
                  b-form-group.mb-3(label="Mevcut Sayı:" label-for="editCurrentCount")
                    b-form-input(type="number" id="editCurrentCount" v-model.number="editingGoal.progress.currentCount" min="0")

                b-form-group.mb-3(label="Hedef Kriterleri (JSON):" label-for="editTargetCriteria")
                  b-form-textarea(id="editTargetCriteria" v-model="editingGoal.targetCriteria" required rows="5")
                
                .d-flex.justify-content-end
                  b-button.btn.btn-primary.mr-2(@click="updateGoal" :disabled="updatingGoal")
                    span(v-if="updatingGoal") Güncelleniyor...
                    span(v-else) Güncelle
                  b-button.btn.btn-outline-secondary(@click="cancelEdit") İptal
            b-alert(v-if="updateGoalError" show variant="danger" class="mt-3") Hata: {{ updateGoalError }}
      p(v-else-if="!loadingGoals && !loadGoalsError") Henüz hiç hedefiniz yok.
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import { httpsCallable } from 'firebase/functions';
import { functions } from '~/firebase';
import { useAuthStore } from '~/stores/auth';

interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'time_based' | 'count_based' | 'habit_based' | 'milestone_based';
  targetDuration?: number; // seconds
  targetDailyDuration?: number; // seconds
  targetWeeklyDuration?: number; // seconds
  targetCount?: number;
  currentCount?: number;
  targetCriteria: { [key: string]: any }; // JSON object
  progress: {
    currentDuration: number; // seconds
    currentStreak: number; // days
    longestStreak: number; // days
    lastUpdated: number; // timestamp
    currentCount?: number; // added for count_based goals within progress
  };
  createdAt: number;
  updatedAt: number;
  version: number;
}

export default defineComponent({
  name: 'Goals',
  setup() {
    const authStore = useAuthStore();

    const goals = ref<Goal[]>([]);
    const loadingGoals = ref(true);
    const loadGoalsError = ref<string | null>(null);

    const newGoal = ref<Partial<Goal>>({
      title: '',
      description: '',
      type: undefined,
      targetDuration: undefined,
      targetDailyDuration: undefined,
      targetWeeklyDuration: undefined,
      targetCount: undefined,
      targetCriteria: '{}', // String olarak başlat
    });
    const addingGoal = ref(false);
    const addGoalSuccess = ref(false);
    const addGoalError = ref<string | null>(null);

    const editingGoalId = ref<string | null>(null);
    const editingGoal = ref<Goal>({} as Goal);
    const updatingGoal = ref(false);
    const updateGoalError = ref<string | null>(null);

    // Firebase Cloud Functions references
    // T038'de tanımlanan fonksiyonları kullanacağız
    const createGoalCallable = httpsCallable(functions, 'createGoal');
    const getGoalsCallable = httpsCallable(functions, 'getGoals'); // veya getUserGoals
    const updateGoalCallable = httpsCallable(functions, 'updateGoal');
    const deleteGoalCallable = httpsCallable(functions, 'deleteGoal');

    const fetchGoals = async () => {
      if (!authStore.user) {
        goals.value = [];
        loadingGoals.value = false;
        return;
      }

      loadingGoals.value = true;
      loadGoalsError.value = null;

      try {
        // getUserGoals fonksiyonunu kullan
        const result = await getGoalsCallable({ userId: authStore.user.uid });
        // Hedeflerin doğrudan data.data içinde döndüğünü varsayıyorum
        goals.value = (result.data as { data: Goal[] }).data;
      } catch (e: any) {
        console.error('Hedefler alınırken hata oluştu:', e);
        loadGoalsError.value = e.message;
      } finally {
        loadingGoals.value = false;
      }
    };

    const addGoal = async () => {
      if (!authStore.user) {
        addGoalError.value = 'Hedef eklemek için giriş yapmalısınız.';
        return;
      }

      addingGoal.value = true;
      addGoalSuccess.value = false;
      addGoalError.value = null;

      try {
        let parsedCriteria = {};
        try {
          parsedCriteria = JSON.parse(newGoal.value.targetCriteria as string);
        } catch (e) {
          throw new Error('Hedef Kriterleri geçerli bir JSON olmalıdır.');
        }

        const goalDataToSend: Omit<
          Goal,
          'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version' | 'progress'
        > = {
          title: newGoal.value.title || '',
          description: newGoal.value.description,
          type: newGoal.value.type as Goal['type'],
          targetCriteria: parsedCriteria,
          // Süre bazlı hedefler için saatleri saniyeye çevir
          targetDuration:
            newGoal.value.type === 'time_based' && newGoal.value.targetDuration !== undefined
              ? newGoal.value.targetDuration * 3600
              : undefined,
          targetDailyDuration:
            newGoal.value.type === 'time_based' && newGoal.value.targetDailyDuration !== undefined
              ? newGoal.value.targetDailyDuration * 3600
              : undefined,
          targetWeeklyDuration:
            newGoal.value.type === 'time_based' && newGoal.value.targetWeeklyDuration !== undefined
              ? newGoal.value.targetWeeklyDuration * 3600
              : undefined,
          targetCount:
            newGoal.value.type === 'count_based' && newGoal.value.targetCount !== undefined
              ? newGoal.value.targetCount
              : undefined,
        } as Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version' | 'progress'>; // Tip dönüşümü eklendi

        const result = await createGoalCallable({ userId: authStore.user.uid, ...goalDataToSend });
        console.log('Hedef başarıyla eklendi:', result.data);
        addGoalSuccess.value = true;
        resetNewGoalForm();
        fetchGoals();
      } catch (e: any) {
        console.error('Hedef eklenirken hata oluştu:', e);
        addGoalError.value = e.message || 'Hedef eklenirken bir hata oluştu.';
      } finally {
        addingGoal.value = false;
      }
    };

    const startEdit = (goal: Goal) => {
      editingGoalId.value = goal.id;
      // Düzenleme için kriter JSON string'e çevriliyor
      editingGoal.value = {
        ...goal,
        targetCriteria: JSON.stringify(goal.targetCriteria, null, 2),
        // Süre bazlı hedefler için saniyeleri saate çevir
        targetDuration:
          goal.type === 'time_based' && goal.targetDuration !== undefined
            ? goal.targetDuration / 3600
            : undefined,
        targetDailyDuration:
          goal.type === 'time_based' && goal.targetDailyDuration !== undefined
            ? goal.targetDailyDuration / 3600
            : undefined,
        targetWeeklyDuration:
          goal.type === 'time_based' && goal.targetWeeklyDuration !== undefined
            ? goal.targetWeeklyDuration / 3600
            : undefined,
      };
    };

    const cancelEdit = () => {
      editingGoalId.value = null;
      updateGoalError.value = null;
    };

    const updateGoal = async () => {
      if (!authStore.user) {
        updateGoalError.value = 'Hedef düzenlemek için giriş yapmalısınız.';
        return;
      }
      if (!editingGoal.value.id) {
        updateGoalError.value = 'Güncellenecek hedef kimliği bulunamadı.';
        return;
      }

      updatingGoal.value = true;
      updateGoalError.value = null;

      try {
        let parsedCriteria = {};
        try {
          parsedCriteria = JSON.parse(editingGoal.value.targetCriteria as string);
        } catch (e) {
          throw new Error('Hedef Kriterleri geçerli bir JSON olmalıdır.');
        }

        const goalDataToSend = {
          ...editingGoal.value,
          targetCriteria: parsedCriteria,
          // Süre bazlı hedefler için saatleri saniyeye çevir
          targetDuration:
            editingGoal.value.type === 'time_based' &&
            editingGoal.value.targetDuration !== undefined
              ? editingGoal.value.targetDuration * 3600
              : undefined,
          targetDailyDuration:
            editingGoal.value.type === 'time_based' &&
            editingGoal.value.targetDailyDuration !== undefined
              ? editingGoal.value.targetDailyDuration * 3600
              : undefined,
          targetWeeklyDuration:
            editingGoal.value.type === 'time_based' &&
            editingGoal.value.targetWeeklyDuration !== undefined
              ? editingGoal.value.targetWeeklyDuration * 3600
              : undefined,
        } as Partial<Goal>; // Tip dönüşümü eklendi

        await updateGoalCallable({
          goalId: editingGoal.value.id,
          userId: authStore.user.uid,
          updates: goalDataToSend,
        });
        console.log('Hedef başarıyla güncellendi.');
        cancelEdit();
        fetchGoals();
      } catch (e: any) {
        console.error('Hedef güncellenirken hata oluştu:', e);
        updateGoalError.value = e.message || 'Hedef güncellenirken bir hata oluştu.';
      } finally {
        updatingGoal.value = false;
      }
    };

    const deleteGoal = async (goalId: string) => {
      if (!authStore.user) {
        alert('Hedef silmek için giriş yapmalısınız.');
        return;
      }
      if (!confirm('Bu hedefi silmek istediğinizden emin misiniz?')) {
        return;
      }

      try {
        await deleteGoalCallable({ goalId, userId: authStore.user.uid });
        console.log('Hedef başarıyla silindi.');
        fetchGoals();
      } catch (e: any) {
        console.error('Hedef silinirken hata oluştu:', e);
        alert('Hedef silinirken hata oluştu: ' + (e.message || 'Bilinmeyen Hata'));
      }
    };

    const resetNewGoalForm = () => {
      newGoal.value = {
        title: '',
        description: '',
        type: undefined,
        targetDuration: undefined,
        targetDailyDuration: undefined,
        targetWeeklyDuration: undefined,
        targetCount: undefined,
        targetCriteria: {}, // Boş obje olarak başlat
      };
    };

    const formatDuration = (seconds: number | undefined): string => {
      if (seconds === undefined || seconds === null) return 'Yok';
      const hours = seconds / 3600;
      if (hours < 1) {
        return `${(seconds / 60).toFixed(0)} dk`;
      } else if (hours < 24) {
        return `${hours.toFixed(1)} sa`;
      } else {
        return `${(hours / 24).toFixed(1)} gün`;
      }
    };

    const calculateProgress = (goal: Goal): number => {
      if (
        goal.type === 'time_based' &&
        goal.targetDuration !== undefined &&
        goal.targetDuration > 0
      ) {
        return (goal.progress.currentDuration / goal.targetDuration) * 100;
      } else if (
        goal.type === 'count_based' &&
        goal.targetCount !== undefined &&
        goal.targetCount > 0
      ) {
        return ((goal.progress.currentCount || 0) / goal.targetCount) * 100;
      }
      // Diğer hedef türleri veya tanımsız hedefler için varsayılan ilerleme
      return 0;
    };

    const filteredGoals = computed(() => {
      // Gelecekte filtreleme eklenebilir
      return goals.value;
    });

    onMounted(() => {
      authStore.initAuthService();
      fetchGoals();
    });

    return {
      goals,
      loadingGoals,
      loadGoalsError,
      newGoal,
      addingGoal,
      addGoalSuccess,
      addGoalError,
      editingGoalId,
      editingGoal,
      updatingGoal,
      updateGoalError,
      filteredGoals,
      addGoal,
      startEdit,
      cancelEdit,
      updateGoal,
      deleteGoal,
      formatDuration,
      calculateProgress,
    };
  },
  filters: {
    formatGoalType(type: string | undefined): string {
      switch (type) {
        case 'time_based':
          return 'Süre Bazlı';
        case 'count_based':
          return 'Sayı Bazlı';
        case 'habit_based':
          return 'Alışkanlık Bazlı';
        case 'milestone_based':
          return 'Kilometre Taşı Bazlı';
        default:
          return type || '';
      }
    },
  },
});
</script>

<style lang="scss" scoped>
@import '../../style/globals';

.goals-container {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.display-4 {
  color: var(--active-highlight-color);
  font-weight: 700;
}

.lead {
  color: var(--text-color-light);
}

.card {
  background-color: var(--background-color);
  border: 1px solid var(--light-border-color);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;

  .card-header {
    background-color: var(--card-header-bg);
    border-bottom: 1px solid var(--light-border-color);
    .card-title {
      color: var(--active-highlight-color);
      font-size: 1.5em;
    }
  }

  .card-body {
    color: var(--text-color);
  }

  .card-title {
    color: var(--active-highlight-color);
    font-size: 1.2em;
    font-weight: bold;
  }

  .form-label {
    color: var(--text-color);
  }

  .form-control,
  .b-form-input,
  .b-form-textarea,
  .b-form-select {
    border-color: var(--light-border-color);
    background-color: var(--input-bg-color);
    color: var(--text-color);
    &:focus {
      border-color: var(--active-highlight-color);
      box-shadow: 0 0 0 0.2rem rgba(var(--active-highlight-color), 0.25);
    }
  }

  .json-display {
    background-color: var(--code-bg-color);
    color: var(--code-text-color);
    border: 1px solid var(--light-border-color);
    padding: 10px;
    border-radius: 5px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .progress {
    height: 25px;
    background-color: var(--progress-bg-color);
    .progress-bar {
      background-color: var(--active-highlight-color);
      color: white;
      font-weight: bold;
      line-height: 25px;
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

  .btn-outline-primary {
    color: var(--active-highlight-color);
    border-color: var(--active-highlight-color);
    &:hover {
      background-color: var(--active-highlight-color);
      color: white;
    }
  }

  .btn-danger {
    background-color: var(--danger-color);
    border-color: var(--danger-color);
    color: white;
    &:hover {
      background-color: darken(var(--danger-color), 10%);
      border-color: darken(var(--danger-color), 10%);
    }
  }

  .btn-outline-secondary {
    color: var(--secondary-color);
    border-color: var(--secondary-color);
    &:hover {
      background-color: var(--secondary-color);
      color: white;
    }
  }
}

.error-message {
  color: red;
  font-weight: bold;
}
</style>
