/**
 * Edge AI Composable
 * Vue composable for using TensorFlow.js models in components
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  EdgeAIModelManager,
  ActivityClassificationInput,
  FocusPattern,
  AnomalyDetectionResult,
  TimeSeriesPrediction
} from '../services/edge-ai/tfjs-models';

export function useEdgeAI() {
  const modelManager = new EdgeAIModelManager();

  const isInitialized = ref(false);
  const isProcessing = ref(false);
  const error = ref<string | null>(null);
  const memoryUsage = ref<string>('');

  // Initialize models on mount
  onMounted(async () => {
    try {
      await modelManager.initializeAll();
      isInitialized.value = true;
      updateMemoryUsage();
    } catch (err: any) {
      error.value = `Failed to initialize Edge AI: ${err.message}`;
      console.error('Edge AI initialization error:', err);
    }
  });

  // Cleanup on unmount
  onUnmounted(async () => {
    try {
      await modelManager.saveAll();
    } catch (err: any) {
      console.error('Failed to save models:', err);
    }
  });

  const updateMemoryUsage = () => {
    memoryUsage.value = modelManager.getMemoryUsage();
  };

  /**
   * Classify an activity as productive or not
   */
  const classifyActivity = async (
    appName: string,
    title: string,
    duration: number
  ): Promise<{ isProductive: boolean; confidence: number } | null> => {
    if (!isInitialized.value) {
      error.value = 'Models not initialized';
      return null;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const now = new Date();
      const input: ActivityClassificationInput = {
        appName,
        title,
        duration,
        timeOfDay: now.getHours(),
        dayOfWeek: now.getDay()
      };

      const result = await modelManager.getActivityClassifier().classify(input);
      updateMemoryUsage();
      return result;
    } catch (err: any) {
      error.value = `Classification error: ${err.message}`;
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Train activity classifier with user feedback
   */
  const trainActivityClassifier = async (
    trainingData: { appName: string; title: string; duration: number; isProductive: boolean }[]
  ): Promise<{ loss: number; accuracy: number } | null> => {
    if (!isInitialized.value) {
      error.value = 'Models not initialized';
      return null;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const now = new Date();
      const formattedData = trainingData.map(item => ({
        input: {
          appName: item.appName,
          title: item.title,
          duration: item.duration,
          timeOfDay: now.getHours(),
          dayOfWeek: now.getDay()
        },
        label: item.isProductive ? 1 : 0
      }));

      const result = await modelManager.getActivityClassifier().train(formattedData);
      await modelManager.getActivityClassifier().save();
      updateMemoryUsage();

      return result;
    } catch (err: any) {
      error.value = `Training error: ${err.message}`;
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Detect focus patterns and predict next focus level
   */
  const detectFocusPattern = async (
    history: FocusPattern[]
  ): Promise<{
    nextFocusScore: number;
    nextDistractionScore: number;
    nextAppSwitchFrequency: number;
    confidence: number;
  } | null> => {
    if (!isInitialized.value) {
      error.value = 'Models not initialized';
      return null;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const result = await modelManager.getFocusPatternDetector().detectPattern(history);
      updateMemoryUsage();
      return result;
    } catch (err: any) {
      error.value = `Pattern detection error: ${err.message}`;
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Detect anomalies in daily activity pattern
   */
  const detectAnomalies = async (hourlyActivity: number[]): Promise<AnomalyDetectionResult | null> => {
    if (!isInitialized.value) {
      error.value = 'Models not initialized';
      return null;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const result = await modelManager.getAnomalyDetector().detect(hourlyActivity);
      updateMemoryUsage();
      return result;
    } catch (err: any) {
      error.value = `Anomaly detection error: ${err.message}`;
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Train anomaly detector on normal patterns
   */
  const trainAnomalyDetector = async (normalPatterns: number[][]): Promise<void> => {
    if (!isInitialized.value) {
      error.value = 'Models not initialized';
      return;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      await modelManager.getAnomalyDetector().trainOnNormalData(normalPatterns);
      await modelManager.getAnomalyDetector().save();
      updateMemoryUsage();
    } catch (err: any) {
      error.value = `Anomaly detector training error: ${err.message}`;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Predict future productivity
   */
  const predictProductivity = async (
    historicalData: number[]
  ): Promise<TimeSeriesPrediction | null> => {
    if (!isInitialized.value) {
      error.value = 'Models not initialized';
      return null;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const result = await modelManager.getTimeSeriesPredictor().predict(historicalData);
      updateMemoryUsage();
      return result;
    } catch (err: any) {
      error.value = `Prediction error: ${err.message}`;
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Save all models to localStorage
   */
  const saveModels = async (): Promise<boolean> => {
    if (!isInitialized.value) {
      error.value = 'Models not initialized';
      return false;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      await modelManager.saveAll();
      return true;
    } catch (err: any) {
      error.value = `Save error: ${err.message}`;
      return false;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Batch classify multiple activities
   */
  const batchClassifyActivities = async (
    activities: Array<{ appName: string; title: string; duration: number }>
  ): Promise<Array<{ isProductive: boolean; confidence: number }>> => {
    const results = [];

    for (const activity of activities) {
      const result = await classifyActivity(
        activity.appName,
        activity.title,
        activity.duration
      );

      if (result) {
        results.push(result);
      } else {
        results.push({ isProductive: false, confidence: 0 });
      }
    }

    return results;
  };

  /**
   * Get smart insights from Edge AI models
   */
  const getSmartInsights = async (activityData: {
    recentActivities: Array<{ appName: string; title: string; duration: number }>;
    focusHistory: FocusPattern[];
    hourlyPattern: number[];
    productivityHistory: number[];
  }): Promise<{
    productivity: { isProductive: boolean; confidence: number }[];
    focusPrediction: {
      nextFocusScore: number;
      nextDistractionScore: number;
      nextAppSwitchFrequency: number;
      confidence: number;
    } | null;
    anomaly: AnomalyDetectionResult | null;
    prediction: TimeSeriesPrediction | null;
  } | null> => {
    if (!isInitialized.value) {
      error.value = 'Models not initialized';
      return null;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      // Run all analyses in parallel for speed
      const [productivity, focusPrediction, anomaly, prediction] = await Promise.all([
        batchClassifyActivities(activityData.recentActivities),
        detectFocusPattern(activityData.focusHistory),
        detectAnomalies(activityData.hourlyPattern),
        predictProductivity(activityData.productivityHistory)
      ]);

      updateMemoryUsage();

      return {
        productivity,
        focusPrediction,
        anomaly,
        prediction
      };
    } catch (err: any) {
      error.value = `Smart insights error: ${err.message}`;
      return null;
    } finally {
      isProcessing.value = false;
    }
  };

  return {
    // State
    isInitialized,
    isProcessing,
    error,
    memoryUsage,

    // Computed
    isReady: computed(() => isInitialized.value && !isProcessing.value),

    // Methods
    classifyActivity,
    trainActivityClassifier,
    detectFocusPattern,
    detectAnomalies,
    trainAnomalyDetector,
    predictProductivity,
    saveModels,
    batchClassifyActivities,
    getSmartInsights,

    // Utilities
    updateMemoryUsage
  };
}
