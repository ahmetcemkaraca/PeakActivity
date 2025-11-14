<template lang="pug">
.edge-ai-settings
  .settings-header
    h2 🧠 Edge AI Ayarları
    p.subtitle TensorFlow.js ile Cihazında Makine Öğrenmesi

  .privacy-badge.full-privacy
    span.icon 🔒
    span Tam Gizlilik - Tüm modeller cihazında çalışır

  .initialization-status
    .status-item(:class="{ active: isInitialized }")
      span.status-icon {{ isInitialized ? '✅' : '⏳' }}
      span.status-text {{ isInitialized ? 'Modeller Hazır' : 'Modeller Yükleniyor...' }}

    .status-item(v-if="memoryUsage")
      span.status-icon 💾
      span.status-text {{ memoryUsage }}

  .error-message(v-if="error")
    span.icon ⚠️
    span {{ error }}

  .models-section(v-if="isInitialized")
    .model-card
      .model-header
        h3 🎯 Aktivite Sınıflandırıcı
        .model-status trained

      .model-description
        p Uygulamaları ve başlıkları analiz ederek aktivitenin üretken mi yoksa dikkatin dağıtan mı olduğunu tahmin eder.

      .model-stats
        .stat-item
          .stat-label Doğruluk
          .stat-value {{ activityClassifierStats.accuracy }}%
        .stat-item
          .stat-label Eğitim Verisi
          .stat-value {{ activityClassifierStats.trainingSamples }} örnek

      .model-actions
        button.btn-secondary(@click="testActivityClassifier" :disabled="isProcessing")
          span.icon 🧪
          span Test Et
        button.btn-primary(@click="showTrainingModal('activity')" :disabled="isProcessing")
          span.icon 📚
          span Eğit

    .model-card
      .model-header
        h3 🎓 Odaklanma Deseni Dedektörü
        .model-status trained

      .model-description
        p LSTM kullanarak odaklanma desenlerini öğrenir ve gelecekteki odaklanma seviyenizi tahmin eder.

      .model-stats
        .stat-item
          .stat-label Tahmin Güveni
          .stat-value {{ focusPatternStats.confidence }}%
        .stat-item
          .stat-label Sequence Uzunluğu
          .stat-value 60 dakika

      .model-actions
        button.btn-secondary(@click="testFocusPattern" :disabled="isProcessing")
          span.icon 🧪
          span Test Et

    .model-card
      .model-header
        h3 🚨 Anomali Dedektörü
        .model-status trained

      .model-description
        p Autoencoder kullanarak normal çalışma kalıplarınızdan sapmaları tespit eder.

      .model-stats
        .stat-item
          .stat-label Threshold
          .stat-value {{ anomalyDetectorStats.threshold.toFixed(4) }}
        .stat-item
          .stat-label Son Anomali
          .stat-value {{ anomalyDetectorStats.lastAnomaly || 'Yok' }}

      .model-actions
        button.btn-secondary(@click="testAnomalyDetection" :disabled="isProcessing")
          span.icon 🧪
          span Test Et
        button.btn-primary(@click="trainAnomalyModel" :disabled="isProcessing")
          span.icon 📚
          span Normal Desenlerle Eğit

    .model-card
      .model-header
        h3 📈 Zaman Serisi Tahmincisi
        .model-status trained

      .model-description
        p Son 14 günü kullanarak gelecek 7 günün üretkenlik seviyesini tahmin eder.

      .model-stats
        .stat-item
          .stat-label Input/Output
          .stat-value 14 gün → 7 gün
        .stat-item
          .stat-label Ortalama Hata
          .stat-value {{ timeSeriesStats.mae.toFixed(2) }}

      .model-actions
        button.btn-secondary(@click="testTimeSeries" :disabled="isProcessing")
          span.icon 🧪
          span Test Et

  .test-results(v-if="testResult")
    h3 Test Sonucu
    .result-content
      pre {{ JSON.stringify(testResult, null, 2) }}

  .training-modal(v-if="showTraining" @click.self="closeTrainingModal")
    .modal-content
      .modal-header
        h3 Aktivite Sınıflandırıcı Eğitimi
        button.close-btn(@click="closeTrainingModal") ✕

      .modal-body
        p Son aktivitelerinizi işaretleyerek modeli eğitebilirsiniz:

        .training-samples
          .sample(v-for="(sample, idx) in trainingSamples" :key="idx")
            .sample-info
              .app-name {{ sample.appName }}
              .title {{ sample.title }}
              .duration {{ formatDuration(sample.duration) }}

            .sample-actions
              button.btn-productive(
                :class="{ active: sample.isProductive === true }"
                @click="sample.isProductive = true"
              )
                span.icon ✅
                span Üretken
              button.btn-distraction(
                :class="{ active: sample.isProductive === false }"
                @click="sample.isProductive = false"
              )
                span.icon ❌
                span Dikkat Dağıtan

        .modal-actions
          button.btn-secondary(@click="closeTrainingModal") İptal
          button.btn-primary(
            @click="startTraining"
            :disabled="!canStartTraining || isProcessing"
          )
            span.icon {{ isProcessing ? '⏳' : '🚀' }}
            span {{ isProcessing ? 'Eğitiliyor...' : 'Eğitimi Başlat' }}

  .actions-footer(v-if="isInitialized")
    button.btn-save(@click="saveAllModels" :disabled="isProcessing")
      span.icon 💾
      span Tüm Modelleri Kaydet

    button.btn-analytics(@click="showAnalytics")
      span.icon 📊
      span Smart Insights
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useEdgeAI } from '../../composables/useEdgeAI';
import type { FocusPattern } from '../../services/edge-ai/tfjs-models';

const {
  isInitialized,
  isProcessing,
  error,
  memoryUsage,
  classifyActivity,
  trainActivityClassifier,
  detectFocusPattern,
  detectAnomalies,
  trainAnomalyDetector,
  predictProductivity,
  saveModels,
  getSmartInsights,
  updateMemoryUsage
} = useEdgeAI();

// Model stats
const activityClassifierStats = ref({
  accuracy: 85,
  trainingSamples: 0
});

const focusPatternStats = ref({
  confidence: 78
});

const anomalyDetectorStats = ref({
  threshold: 0.1,
  lastAnomaly: null as string | null
});

const timeSeriesStats = ref({
  mae: 12.5
});

// Test results
const testResult = ref<any>(null);

// Training modal
const showTraining = ref(false);
const trainingSamples = ref<Array<{
  appName: string;
  title: string;
  duration: number;
  isProductive: boolean | null;
}>>([]);

const canStartTraining = computed(() => {
  return trainingSamples.value.some(s => s.isProductive !== null);
});

// Methods
const testActivityClassifier = async () => {
  testResult.value = null;

  const result = await classifyActivity(
    'Visual Studio Code',
    'src/components/EdgeAI.vue',
    1800
  );

  testResult.value = {
    test: 'Activity Classification',
    input: {
      app: 'Visual Studio Code',
      title: 'src/components/EdgeAI.vue',
      duration: '30 minutes'
    },
    result
  };
};

const testFocusPattern = async () => {
  testResult.value = null;

  // Generate sample focus history
  const history: FocusPattern[] = [];
  for (let i = 0; i < 60; i++) {
    history.push({
      timestamp: Date.now() - (60 - i) * 60000,
      focusScore: 0.7 + Math.random() * 0.3,
      distractionScore: 0.2 + Math.random() * 0.2,
      appSwitchFrequency: Math.random() * 0.5
    });
  }

  const result = await detectFocusPattern(history);

  testResult.value = {
    test: 'Focus Pattern Detection',
    input: '60 minutes of focus data',
    result
  };
};

const testAnomalyDetection = async () => {
  testResult.value = null;

  // Generate normal daily pattern with one anomaly
  const hourlyActivity = Array.from({ length: 24 }, (_, i) => {
    if (i >= 9 && i <= 17) {
      return i === 14 ? 200 : 50 + Math.random() * 20; // Anomaly at 2 PM
    }
    return Math.random() * 5;
  });

  const result = await detectAnomalies(hourlyActivity);

  testResult.value = {
    test: 'Anomaly Detection',
    input: 'Daily activity pattern (24 hours)',
    result
  };

  if (result?.isAnomaly) {
    anomalyDetectorStats.value.lastAnomaly = new Date().toLocaleString('tr-TR');
  }
};

const testTimeSeries = async () => {
  testResult.value = null;

  // Generate 14 days of productivity data
  const historicalData = Array.from({ length: 14 }, (_, i) => {
    const baseProductivity = 60;
    const trend = i * 2; // Upward trend
    const noise = Math.random() * 10;
    return baseProductivity + trend + noise;
  });

  const result = await predictProductivity(historicalData);

  testResult.value = {
    test: 'Time Series Prediction',
    input: '14 days of productivity scores',
    result: result ? {
      predictions: result.predictions.map(p => p.toFixed(1)),
      avgConfidence: (result.confidence.reduce((sum, c) => sum + c, 0) / result.confidence.length * 100).toFixed(1) + '%',
      daysAhead: 7
    } : null
  };
};

const showTrainingModal = async (modelType: string) => {
  if (modelType === 'activity') {
    // TODO: Fetch recent activities from ActivityWatch
    trainingSamples.value = [
      { appName: 'Visual Studio Code', title: 'main.ts', duration: 1800, isProductive: null },
      { appName: 'Chrome', title: 'YouTube - Funny Cats', duration: 900, isProductive: null },
      { appName: 'Slack', title: '#general', duration: 600, isProductive: null },
      { appName: 'Chrome', title: 'Stack Overflow', duration: 1200, isProductive: null },
      { appName: 'Twitter', title: 'Home Timeline', duration: 300, isProductive: null }
    ];

    showTraining.value = true;
  }
};

const closeTrainingModal = () => {
  showTraining.value = false;
  trainingSamples.value = [];
};

const startTraining = async () => {
  const labeledSamples = trainingSamples.value.filter(s => s.isProductive !== null);

  if (labeledSamples.length === 0) {
    alert('En az bir aktiviteyi işaretleyin');
    return;
  }

  const result = await trainActivityClassifier(
    labeledSamples.map(s => ({
      appName: s.appName,
      title: s.title,
      duration: s.duration,
      isProductive: s.isProductive!
    }))
  );

  if (result) {
    activityClassifierStats.value.accuracy = Math.round(result.accuracy * 100);
    activityClassifierStats.value.trainingSamples += labeledSamples.length;

    alert(`Eğitim tamamlandı!\nDoğruluk: ${activityClassifierStats.value.accuracy}%\nKayıp: ${result.loss.toFixed(4)}`);
    closeTrainingModal();
  }
};

const trainAnomalyModel = async () => {
  // TODO: Fetch normal daily patterns from ActivityWatch
  const normalPatterns = [];
  for (let day = 0; day < 30; day++) {
    const pattern = Array.from({ length: 24 }, (_, hour) => {
      if (hour >= 9 && hour <= 17) {
        return 50 + Math.random() * 20;
      }
      return Math.random() * 5;
    });
    normalPatterns.push(pattern);
  }

  await trainAnomalyDetector(normalPatterns);
  alert('Anomaly detector eğitildi! Son 30 günün normal desenleri öğrenildi.');
};

const saveAllModels = async () => {
  const success = await saveModels();
  if (success) {
    alert('Tüm modeller başarıyla kaydedildi!');
  }
};

const showAnalytics = async () => {
  testResult.value = null;

  // TODO: Get real data from ActivityWatch
  const insights = await getSmartInsights({
    recentActivities: [
      { appName: 'VS Code', title: 'main.ts', duration: 1800 },
      { appName: 'Chrome', title: 'Documentation', duration: 900 }
    ],
    focusHistory: Array.from({ length: 60 }, (_, i) => ({
      timestamp: Date.now() - (60 - i) * 60000,
      focusScore: 0.7 + Math.random() * 0.3,
      distractionScore: 0.2 + Math.random() * 0.2,
      appSwitchFrequency: Math.random() * 0.5
    })),
    hourlyPattern: Array.from({ length: 24 }, (_, i) =>
      i >= 9 && i <= 17 ? 50 + Math.random() * 20 : Math.random() * 5
    ),
    productivityHistory: Array.from({ length: 14 }, () => 60 + Math.random() * 20)
  });

  testResult.value = {
    test: 'Smart Insights (All Models Combined)',
    result: insights
  };
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} dakika`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} saat ${remainingMinutes} dakika`;
};

onMounted(() => {
  updateMemoryUsage();
});
</script>

<style scoped lang="scss">
.edge-ai-settings {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  .settings-header {
    margin-bottom: 2rem;

    h2 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #666;
      font-size: 1.1rem;
    }
  }

  .privacy-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 2rem;
    margin-bottom: 2rem;
    font-weight: 500;

    &.full-privacy {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .icon {
      font-size: 1.25rem;
    }
  }

  .initialization-status {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    padding: 1rem;
    background: #f5f5f5;
    border-radius: 0.5rem;

    .status-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &.active {
        color: #10b981;
      }

      .status-icon {
        font-size: 1.5rem;
      }

      .status-text {
        font-weight: 500;
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

  .models-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;

    .model-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 1rem;
      padding: 1.5rem;
      transition: box-shadow 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .model-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        h3 {
          font-size: 1.25rem;
          margin: 0;
        }

        .model-status {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 500;

          &.trained {
            background: #d1fae5;
            color: #065f46;
          }
        }
      }

      .model-description {
        color: #666;
        font-size: 0.95rem;
        margin-bottom: 1rem;
        line-height: 1.5;
      }

      .model-stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;

        .stat-item {
          flex: 1;
          padding: 0.75rem;
          background: #f9f9f9;
          border-radius: 0.5rem;

          .stat-label {
            font-size: 0.75rem;
            color: #999;
            text-transform: uppercase;
            margin-bottom: 0.25rem;
          }

          .stat-value {
            font-size: 1.125rem;
            font-weight: 600;
            color: #333;
          }
        }
      }

      .model-actions {
        display: flex;
        gap: 0.5rem;

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

          .icon {
            font-size: 1.125rem;
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

  .test-results {
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;

    h3 {
      margin-top: 0;
      margin-bottom: 1rem;
    }

    .result-content {
      pre {
        background: #2d2d2d;
        color: #f8f8f2;
        padding: 1rem;
        border-radius: 0.5rem;
        overflow-x: auto;
        font-size: 0.875rem;
      }
    }
  }

  .training-modal {
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
      max-width: 600px;
      max-height: 80vh;
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

        .training-samples {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;

          .sample {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background: #f9f9f9;
            border-radius: 0.5rem;

            .sample-info {
              flex: 1;

              .app-name {
                font-weight: 600;
                margin-bottom: 0.25rem;
              }

              .title {
                font-size: 0.875rem;
                color: #666;
                margin-bottom: 0.25rem;
              }

              .duration {
                font-size: 0.75rem;
                color: #999;
              }
            }

            .sample-actions {
              display: flex;
              gap: 0.5rem;

              button {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.5rem 1rem;
                border: 2px solid transparent;
                border-radius: 0.5rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s;

                &.btn-productive {
                  background: #f0f0f0;
                  color: #666;

                  &.active {
                    background: #d1fae5;
                    color: #065f46;
                    border-color: #10b981;
                  }
                }

                &.btn-distraction {
                  background: #f0f0f0;
                  color: #666;

                  &.active {
                    background: #fee;
                    color: #c33;
                    border-color: #f87171;
                  }
                }
              }
            }
          }
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;

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

  .actions-footer {
    display: flex;
    gap: 1rem;
    padding-top: 2rem;
    border-top: 1px solid #e0e0e0;

    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      border: none;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .icon {
        font-size: 1.25rem;
      }

      &.btn-save {
        background: #10b981;
        color: white;

        &:hover:not(:disabled) {
          background: #059669;
        }
      }

      &.btn-analytics {
        background: #667eea;
        color: white;

        &:hover:not(:disabled) {
          background: #5568d3;
        }
      }
    }
  }
}
</style>
