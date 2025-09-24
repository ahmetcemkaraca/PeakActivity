/**
 * AI Store Module
 *
 * AI servisleri ve machine learning state management için AI store modülü.
 * Predictions, insights, automation ve agent management için merkezi store.
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// AI prediction and insights store
export const useAIInsightsStore = defineStore('aiInsights', () => {
  // State
  const insights = ref<
    Array<{
      id: string;
      type: 'productivity' | 'focus' | 'behavioral' | 'anomaly';
      title: string;
      description: string;
      confidence: number;
      data: any;
      timestamp: Date;
      read: boolean;
    }>
  >([]);

  const processingStatus = ref<
    Map<
      string,
      {
        inProgress: boolean;
        progress: number;
        lastUpdate: Date;
      }
    >
  >(new Map());

  // Computed
  const unreadInsights = computed(() => insights.value.filter(insight => !insight.read));

  const insightsByType = computed(() => {
    const groups: Record<string, typeof insights.value> = {};
    insights.value.forEach(insight => {
      if (!groups[insight.type]) {
        groups[insight.type] = [];
      }
      groups[insight.type].push(insight);
    });
    return groups;
  });

  const highConfidenceInsights = computed(() =>
    insights.value.filter(insight => insight.confidence >= 0.8)
  );

  // Actions
  const addInsight = (
    insight: Omit<(typeof insights.value)[0], 'id' | 'timestamp' | 'read'>
  ): void => {
    const newInsight = {
      ...insight,
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    insights.value.unshift(newInsight);
  };

  const markInsightAsRead = (insightId: string): void => {
    const insight = insights.value.find(i => i.id === insightId);
    if (insight) {
      insight.read = true;
    }
  };

  const markAllInsightsAsRead = (): void => {
    insights.value.forEach(insight => {
      insight.read = true;
    });
  };

  const removeInsight = (insightId: string): void => {
    const index = insights.value.findIndex(i => i.id === insightId);
    if (index > -1) {
      insights.value.splice(index, 1);
    }
  };

  const clearOldInsights = (daysOld: number = 30): void => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    insights.value = insights.value.filter(insight => insight.timestamp > cutoffDate);
  };

  const startProcessing = (processId: string): void => {
    processingStatus.value.set(processId, {
      inProgress: true,
      progress: 0,
      lastUpdate: new Date(),
    });
  };

  const updateProcessingProgress = (processId: string, progress: number): void => {
    const status = processingStatus.value.get(processId);
    if (status) {
      status.progress = Math.max(0, Math.min(100, progress));
      status.lastUpdate = new Date();
    }
  };

  const completeProcessing = (processId: string): void => {
    const status = processingStatus.value.get(processId);
    if (status) {
      status.inProgress = false;
      status.progress = 100;
      status.lastUpdate = new Date();
    }
  };

  return {
    // State
    insights,
    processingStatus,

    // Computed
    unreadInsights,
    insightsByType,
    highConfidenceInsights,

    // Actions
    addInsight,
    markInsightAsRead,
    markAllInsightsAsRead,
    removeInsight,
    clearOldInsights,
    startProcessing,
    updateProcessingProgress,
    completeProcessing,
  };
});

// AI automation and rules store
export const useAIAutomationStore = defineStore('aiAutomation', () => {
  // State
  const automationRules = ref<
    Array<{
      id: string;
      name: string;
      description: string;
      enabled: boolean;
      triggers: Array<{
        type: 'time' | 'activity' | 'focus' | 'category';
        condition: any;
      }>;
      actions: Array<{
        type: 'notification' | 'block' | 'suggest' | 'track';
        parameters: any;
      }>;
      lastTriggered?: Date;
      triggerCount: number;
    }>
  >([]);

  const ruleExecutionLog = ref<
    Array<{
      id: string;
      ruleId: string;
      timestamp: Date;
      success: boolean;
      result: any;
      error?: string;
    }>
  >([]);

  // Computed
  const activeRules = computed(() => automationRules.value.filter(rule => rule.enabled));

  const ruleExecutionStats = computed(() => {
    const stats: Record<string, { total: number; success: number; lastRun?: Date }> = {};

    ruleExecutionLog.value.forEach(log => {
      if (!stats[log.ruleId]) {
        stats[log.ruleId] = { total: 0, success: 0 };
      }
      stats[log.ruleId].total++;
      if (log.success) {
        stats[log.ruleId].success++;
      }
      if (!stats[log.ruleId].lastRun || log.timestamp > stats[log.ruleId].lastRun!) {
        stats[log.ruleId].lastRun = log.timestamp;
      }
    });

    return stats;
  });

  // Actions
  const addAutomationRule = (
    rule: Omit<(typeof automationRules.value)[0], 'id' | 'triggerCount'>
  ): string => {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    automationRules.value.push({
      ...rule,
      id,
      triggerCount: 0,
    });
    return id;
  };

  const updateAutomationRule = (
    ruleId: string,
    updates: Partial<(typeof automationRules.value)[0]>
  ): void => {
    const rule = automationRules.value.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
    }
  };

  const toggleRule = (ruleId: string): void => {
    const rule = automationRules.value.find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
    }
  };

  const deleteRule = (ruleId: string): void => {
    const index = automationRules.value.findIndex(r => r.id === ruleId);
    if (index > -1) {
      automationRules.value.splice(index, 1);
    }
  };

  const logRuleExecution = (
    ruleId: string,
    success: boolean,
    result: any,
    error?: string
  ): void => {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    ruleExecutionLog.value.push({
      id: logId,
      ruleId,
      timestamp: new Date(),
      success,
      result,
      ...(error !== undefined && { error }),
    });

    // Update rule trigger count
    const rule = automationRules.value.find(r => r.id === ruleId);
    if (rule) {
      rule.triggerCount++;
      rule.lastTriggered = new Date();
    }

    // Keep log limited to last 1000 entries
    if (ruleExecutionLog.value.length > 1000) {
      ruleExecutionLog.value = ruleExecutionLog.value.slice(-1000);
    }
  };

  const clearExecutionLog = (): void => {
    ruleExecutionLog.value = [];
  };

  return {
    // State
    automationRules,
    ruleExecutionLog,

    // Computed
    activeRules,
    ruleExecutionStats,

    // Actions
    addAutomationRule,
    updateAutomationRule,
    toggleRule,
    deleteRule,
    logRuleExecution,
    clearExecutionLog,
  };
});

// AI model and service management store
export const useAIServiceStore = defineStore('aiService', () => {
  // State
  const availableModels = ref<
    Array<{
      id: string;
      name: string;
      type: 'edge' | 'cloud';
      status: 'available' | 'loading' | 'error' | 'unavailable';
      capabilities: string[];
      performance: {
        accuracy: number;
        speed: number;
        memoryUsage: number;
      };
    }>
  >([]);

  const activeModel = ref<string | null>(null);
  const modelSettings = ref<Record<string, any>>({});

  // Computed
  const availableEdgeModels = computed(() =>
    availableModels.value.filter(model => model.type === 'edge' && model.status === 'available')
  );

  const availableCloudModels = computed(() =>
    availableModels.value.filter(model => model.type === 'cloud' && model.status === 'available')
  );

  const currentModel = computed(() =>
    availableModels.value.find(model => model.id === activeModel.value)
  );

  // Actions
  const registerModel = (model: (typeof availableModels.value)[0]): void => {
    const existingIndex = availableModels.value.findIndex(m => m.id === model.id);
    if (existingIndex > -1) {
      availableModels.value[existingIndex] = model;
    } else {
      availableModels.value.push(model);
    }
  };

  const setActiveModel = (modelId: string): boolean => {
    const model = availableModels.value.find(m => m.id === modelId);
    if (model && model.status === 'available') {
      activeModel.value = modelId;
      return true;
    }
    return false;
  };

  const updateModelStatus = (
    modelId: string,
    status: (typeof availableModels.value)[0]['status']
  ): void => {
    const model = availableModels.value.find(m => m.id === modelId);
    if (model) {
      model.status = status;
    }
  };

  const updateModelSettings = (settings: Record<string, any>): void => {
    modelSettings.value = { ...modelSettings.value, ...settings };
  };

  const getModelSetting = (key: string): any => {
    return modelSettings.value[key];
  };

  return {
    // State
    availableModels,
    activeModel,
    modelSettings,

    // Computed
    availableEdgeModels,
    availableCloudModels,
    currentModel,

    // Actions
    registerModel,
    setActiveModel,
    updateModelStatus,
    updateModelSettings,
    getModelSetting,
  };
});
