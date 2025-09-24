---
applyTo: 'functions/src/services/ai/**/*.ts,**/*ai*.ts'
description: 'AI service integration patterns and machine learning guidelines'
---

# AI Özellikleri Geliştirme Kılavuzu

Bu dosya, PeakActivity'deki yapay zeka özelliklerinin geliştirilmesi için teknik
rehberlik sağlar.

## Edge AI vs Cloud AI Architecture

### Edge AI (TensorFlow.js) - Gizlilik Odaklı

```typescript
// Yerel aktivite sınıflandırması
class EdgeAIService {
  private model: tf.LayersModel;

  async classifyActivity(
    windowTitle: string,
    appName: string,
    duration: number
  ) {
    const features = this.extractFeatures(windowTitle, appName, duration);
    const prediction = await this.model.predict(features);
    return this.interpretPrediction(prediction);
  }

  private extractFeatures(title: string, app: string, duration: number) {
    // Feature engineering for local classification
    const titleTokens = this.tokenize(title);
    const appCategory = this.getAppCategory(app);
    return tf.tensor([[titleTokens.length, appCategory, duration]]);
  }
}
```

### Cloud AI (Gemini/OpenAI) - Gelişmiş Analizler

```typescript
// GenKit flow for AI insights
export const generateInsightFlow = ai.defineFlow(
  {
    name: 'generateInsight',
    inputSchema: z.object({
      activityData: z.array(
        z.object({
          timestamp: z.string(),
          duration: z.number(),
          category: z.string(),
        })
      ),
    }),
    outputSchema: z.object({
      insights: z.array(z.string()),
      recommendations: z.array(z.string()),
      score: z.number(),
    }),
  },
  async input => {
    const { text } = await ai.generate(`
    Analyze the following activity data and provide insights:
    ${JSON.stringify(input.activityData)}
    
    Focus on:
    - Productivity patterns
    - Focus quality metrics  
    - Behavioral insights
    - Actionable recommendations
  `);

    return JSON.parse(text);
  }
);
```

## Anomaly Detection Implementation

### Z-Score Based Detection

```typescript
interface AnomalyDetectionInput {
  daily_totals: Array<{
    date: string;
    total_seconds: number;
  }>;
}

interface AnomalyDetectionOutput {
  anomalies: Array<{
    date: string;
    z_score: number;
    deviation_percent: number;
  }>;
  baseline_mean: number;
  baseline_stddev: number;
  explanation: string;
}

export function detectAnomalies(
  input: AnomalyDetectionInput
): AnomalyDetectionOutput {
  const values = input.daily_totals.map(d => d.total_seconds);
  const mean = values.reduce((a, b) => a + b) / values.length;
  const stddev = Math.sqrt(
    values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
  );

  const anomalies = input.daily_totals
    .map(day => ({
      date: day.date,
      z_score: (day.total_seconds - mean) / stddev,
      deviation_percent: ((day.total_seconds - mean) / mean) * 100,
    }))
    .filter(item => Math.abs(item.z_score) >= 2)
    .sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score))
    .slice(0, 10);

  return {
    anomalies,
    baseline_mean: mean,
    baseline_stddev: stddev,
    explanation: `${anomalies.length} adet anomali tespit edildi. Ortalamadan %2+ sapma gösteren günler.`,
  };
}
```

## Automatic Categorization System

### TF-IDF Based Classification

```typescript
class AutoCategorizationService {
  private tfidfVectorizer: TFIDFVectorizer;
  private categoryMapping: Map<string, string>;

  async categorizeEvents(events: ActivityEvent[]): Promise<CategoryLabel[]> {
    return events.map((event, index) => {
      const features = this.extractTextFeatures(event);
      const scores = this.tfidfVectorizer.transform(features);
      const category = this.predictCategory(scores);
      const confidence = this.calculateConfidence(scores);

      return {
        index,
        category,
        confidence,
      };
    });
  }

  private extractTextFeatures(event: ActivityEvent): string {
    const titleTokens = this.tokenize(event.title || '');
    const domain = this.extractDomain(event.url || '');
    const appCategory = this.categoryMapping.get(event.app) || 'unknown';

    return `${titleTokens.join(' ')} ${domain} ${appCategory}`;
  }

  private predictCategory(scores: number[]): string {
    const categories = [
      'coding',
      'design',
      'research',
      'social',
      'gaming',
      'productivity',
      'communication',
    ];
    const maxIndex = scores.indexOf(Math.max(...scores));
    return categories[maxIndex];
  }
}
```

## AI Model Performance Guidelines

### Metrikler

- **Accuracy**: >85% aktivite sınıflandırma
- **Prediction Precision**: >80% verimlilik tahmini
- **User Satisfaction**: >4.0/5.0 öneriler
- **Response Time**: <200ms gerçek zamanlı analiz

### System Constraints

- **CPU Usage**: <5% background processing
- **RAM Usage**: <100MB AI modelleri
- **Network Traffic**: <10MB/gün cloud sync
- **Battery Impact**: <2% mobile

## Privacy-First AI Design

### Local Processing Priority

```typescript
class HybridAIService {
  async processActivity(event: ActivityEvent): Promise<ProcessedActivity> {
    // 1. Try local classification first
    try {
      const localResult = await this.edgeAI.classifyActivity(event);
      if (localResult.confidence > 0.8) {
        return localResult;
      }
    } catch (error) {
      logger.warn('Local AI failed, falling back to cloud', error);
    }

    // 2. Fallback to cloud with anonymized data
    const anonymizedEvent = this.anonymizeEvent(event);
    return await this.cloudAI.classifyActivity(anonymizedEvent);
  }

  private anonymizeEvent(event: ActivityEvent): AnonymizedEvent {
    return {
      app_category: this.getAppCategory(event.app),
      domain: this.extractDomain(event.url),
      title_length: event.title?.length || 0,
      duration: event.duration,
      time_of_day: new Date(event.timestamp).getHours(),
    };
  }
}
```

## Error Handling ve Logging

```typescript
// AI service error handling pattern
try {
  const result = await aiService.generateInsight(data);
  logger.info('AI insight generated', { userId, insightType: result.type });
  return result;
} catch (error) {
  logger.error('AI insight generation failed', {
    userId,
    error: error.message,
    data: this.sanitizeForLogging(data),
  });

  // Fallback to rule-based insights
  return this.generateRuleBasedInsight(data);
}
```
