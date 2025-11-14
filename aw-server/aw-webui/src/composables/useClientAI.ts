/**
 * Client-Side AI Composable
 * Provides AI analysis capabilities with automatic server/client decision
 */

import { ref, computed } from 'vue';
import { ClientLLMService } from '../services/llm/client-llm-service';
import { UserApiKeyService } from '../services/llm/user-api-key-service';
import { LLMProvider } from '../services/llm/llm-providers';
import type { AnalysisRequest, AnalysisResult } from '../services/llm/client-llm-service';

export function useClientAI() {
  const llmService = new ClientLLMService();
  const apiKeyService = new UserApiKeyService();

  const isAnalyzing = ref(false);
  const lastAnalysis = ref<AnalysisResult | null>(null);
  const analysisHistory = ref<AnalysisResult[]>([]);

  // Computed properties
  const currentProvider = computed(() => {
    const config = apiKeyService.getLLMConfig();
    return config?.provider || 'server';
  });

  const isUsingClientSide = computed(() => {
    return currentProvider.value !== 'server';
  });

  const hasConfiguredProvider = computed(() => {
    const provider = currentProvider.value;
    if (provider === 'server' || provider === 'local') return true;
    return apiKeyService.hasApiKey(provider);
  });

  /**
   * Perform focus analysis on activity data
   */
  async function analyzeFocus(activityData: any): Promise<AnalysisResult> {
    isAnalyzing.value = true;

    try {
      const result = await llmService.analyze({
        type: 'focus_analysis',
        data: activityData,
        systemPrompt: `Sen bir üretkenlik analiz asistanısın. Kullanıcının aktivite verilerini analiz ederek odaklanma kalitesi hakkında içgörüler sunuyorsun.`,
        userPrompt: `Aşağıdaki aktivite verilerini analiz et ve odaklanma kalitesi hakkında kısa bir özet (max 200 kelime) ve iyileştirme önerileri sun:

${JSON.stringify(activityData, null, 2)}

JSON formatında şu yapıda yanıt ver:
{
  "focusScore": 0-100 arası puan,
  "summary": "Kısa özet",
  "distractions": ["dikkat dağıtıcı 1", "dikkat dağıtıcı 2"],
  "recommendations": ["öneri 1", "öneri 2"]
}`,
        temperature: 0.7,
        maxTokens: 1000
      });

      lastAnalysis.value = result;
      if (result.success) {
        analysisHistory.value.unshift(result);
      }

      return result;
    } finally {
      isAnalyzing.value = false;
    }
  }

  /**
   * Generate productivity report
   */
  async function generateProductivityReport(timeRange: string, activities: any[]): Promise<AnalysisResult> {
    isAnalyzing.value = true;

    try {
      const result = await llmService.analyze({
        type: 'productivity_report',
        data: { timeRange, activities },
        systemPrompt: 'Sen bir üretkenlik koçusun. Kullanıcının çalışma verilerini analiz ederek detaylı raporlar oluşturuyorsun.',
        userPrompt: `${timeRange} için üretkenlik raporu oluştur. ${activities.length} aktivite kaydı var.

Aktiviteler:
${JSON.stringify(activities.slice(0, 100), null, 2)}

Şu başlıkları içeren bir rapor oluştur:
1. Genel Özet
2. Üretken vs Üretken Olmayan Zaman
3. En Verimli Saatler
4. Dikkat Dağıtıcılar
5. İyileştirme Önerileri

Markdown formatında yanıt ver.`,
        temperature: 0.7,
        maxTokens: 2000
      });

      lastAnalysis.value = result;
      if (result.success) {
        analysisHistory.value.unshift(result);
      }

      return result;
    } finally {
      isAnalyzing.value = false;
    }
  }

  /**
   * Analyze behavior patterns
   */
  async function analyzeBehaviorPatterns(historicalData: any): Promise<AnalysisResult> {
    isAnalyzing.value = true;

    try {
      const result = await llmService.analyze({
        type: 'behavior_patterns',
        data: historicalData,
        systemPrompt: 'Sen bir davranış analisti ve veri bilimcisin. Kullanıcının çalışma alışkanlıklarını analiz ederek desenler buluyorsun.',
        userPrompt: `Aşağıdaki tarihsel çalışma verilerini analiz et ve tekrarlayan davranış desenlerini belirle:

${JSON.stringify(historicalData, null, 2)}

JSON formatında yanıt ver:
{
  "patterns": [
    {
      "type": "günlük/haftalık/aylık",
      "description": "Açıklama",
      "frequency": "sıklık",
      "impact": "pozitif/negatif/nötr"
    }
  ],
  "insights": ["içgörü 1", "içgörü 2"],
  "recommendations": ["öneri 1", "öneri 2"]
}`,
        temperature: 0.8,
        maxTokens: 1500
      });

      lastAnalysis.value = result;
      if (result.success) {
        analysisHistory.value.unshift(result);
      }

      return result;
    } finally {
      isAnalyzing.value = false;
    }
  }

  /**
   * Detect anomalies in activity data
   */
  async function detectAnomalies(recentData: any, baselineData: any): Promise<AnalysisResult> {
    isAnalyzing.value = true;

    try {
      const result = await llmService.analyze({
        type: 'anomaly_detection',
        data: { recent: recentData, baseline: baselineData },
        systemPrompt: 'Sen bir anomali tespit uzmanısın. Normal davranış kalıplarından sapmaları tespit ediyorsun.',
        userPrompt: `Şu anki aktivite verilerini normal baseline ile karşılaştır ve anormallikleri tespit et:

Son Veriler:
${JSON.stringify(recentData, null, 2)}

Baseline (Normal):
${JSON.stringify(baselineData, null, 2)}

JSON formatında yanıt ver:
{
  "anomalies": [
    {
      "type": "anomali türü",
      "severity": "düşük/orta/yüksek",
      "description": "Açıklama",
      "suggestion": "Ne yapmalı"
    }
  ],
  "overallStatus": "normal/dikkat/kritik"
}`,
        temperature: 0.5,
        maxTokens: 1000
      });

      lastAnalysis.value = result;
      if (result.success) {
        analysisHistory.value.unshift(result);
      }

      return result;
    } finally {
      isAnalyzing.value = false;
    }
  }

  /**
   * Suggest goals based on activity patterns
   */
  async function suggestGoals(activitySummary: any): Promise<AnalysisResult> {
    isAnalyzing.value = true;

    try {
      const result = await llmService.analyze({
        type: 'goal_suggestions',
        data: activitySummary,
        systemPrompt: 'Sen bir üretkenlik koçusun. Kullanıcının çalışma verilerine dayanarak gerçekçi ve ulaşılabilir hedefler öneriyorsun.',
        userPrompt: `Şu aktivite özetine dayanarak kullanıcı için hedefler öner:

${JSON.stringify(activitySummary, null, 2)}

JSON formatında 3-5 hedef öner:
{
  "goals": [
    {
      "title": "Hedef başlığı",
      "description": "Detaylı açıklama",
      "targetValue": sayısal değer,
      "timeframe": "günlük/haftalık/aylık",
      "difficulty": "kolay/orta/zor",
      "reasoning": "Neden bu hedef önerildi"
    }
  ]
}`,
        temperature: 0.8,
        maxTokens: 1500
      });

      lastAnalysis.value = result;
      if (result.success) {
        analysisHistory.value.unshift(result);
      }

      return result;
    } finally {
      isAnalyzing.value = false;
    }
  }

  /**
   * Custom analysis with user-provided prompt
   */
  async function customAnalysis(
    data: any,
    prompt: string,
    systemPrompt?: string
  ): Promise<AnalysisResult> {
    isAnalyzing.value = true;

    try {
      const result = await llmService.analyze({
        type: 'custom',
        data,
        systemPrompt: systemPrompt || 'Sen yardımsever bir AI asistanısın.',
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 2000
      });

      lastAnalysis.value = result;
      if (result.success) {
        analysisHistory.value.unshift(result);
      }

      return result;
    } finally {
      isAnalyzing.value = false;
    }
  }

  /**
   * Get analysis statistics
   */
  function getAnalysisStats() {
    const totalAnalyses = analysisHistory.value.length;
    const successfulAnalyses = analysisHistory.value.filter(a => a.success).length;
    const totalTokens = analysisHistory.value.reduce((sum, a) => {
      return sum + (a.metadata.tokensUsed?.total || 0);
    }, 0);
    const totalCost = analysisHistory.value.reduce((sum, a) => {
      return sum + (a.metadata.cost || 0);
    }, 0);
    const avgProcessingTime = analysisHistory.value.reduce((sum, a) => {
      return sum + a.metadata.processingTime;
    }, 0) / (totalAnalyses || 1);

    const localAnalyses = analysisHistory.value.filter(a => a.metadata.processedLocally).length;
    const serverAnalyses = totalAnalyses - localAnalyses;

    return {
      totalAnalyses,
      successfulAnalyses,
      failedAnalyses: totalAnalyses - successfulAnalyses,
      successRate: totalAnalyses > 0 ? (successfulAnalyses / totalAnalyses) * 100 : 0,
      totalTokens,
      totalCost,
      avgProcessingTime,
      localAnalyses,
      serverAnalyses,
      costSavings: serverAnalyses * 0.001 // Estimated savings vs always using server
    };
  }

  /**
   * Clear analysis history
   */
  function clearHistory() {
    analysisHistory.value = [];
    lastAnalysis.value = null;
  }

  return {
    // State
    isAnalyzing,
    lastAnalysis,
    analysisHistory,

    // Computed
    currentProvider,
    isUsingClientSide,
    hasConfiguredProvider,

    // Methods
    analyzeFocus,
    generateProductivityReport,
    analyzeBehaviorPatterns,
    detectAnomalies,
    suggestGoals,
    customAnalysis,
    getAnalysisStats,
    clearHistory
  };
}
