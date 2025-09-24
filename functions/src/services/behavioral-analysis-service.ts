import { db } from '../firebaseAdmin';
import { ActivityEvent } from '../types/activity-event'; // ActivityEvent'ı içe aktar
import {
  linearRegression,
  linearRegressionLine,
  mean,
  standardDeviation,
} from '../services/utils/math-utils'; // İstatistiksel yardımcı fonksiyonları içe aktar
import { GeminiService } from './gemini-service'; // Gemini entegrasyonu için

interface RealtimeBehavioralPattern {
  user_id: string;
  timestamp: string; // Olayın zaman damgası
  pattern_type:
    | 'idle_detection'
    | 'focus_shift'
    | 'high_activity'
    | 'low_activity'
    | 'unusual_category_use'
    | 'focus_score_trend'
    | 'anomaly_detection';
  description: string; // Tespit edilen örüntünün açıklaması
  confidence_score?: number; // Güven skoru (0-1 arası, ML entegrasyonu için)
  related_activity_id?: string; // İlgili aktivite olayının ID'si
  metadata?: { [key: string]: any }; // Ek meta veriler
  model_version: string; // Kullanılan modelin versiyonu
}

export class BehavioralAnalysisService {
  private geminiService = new GeminiService();

  /**
   * Tekil bir aktivite olayı üzerinden gerçek zamanlı davranışsal örüntüleri analiz eder.
   * Bu fonksiyon, AI fallback ile çalışır: Önce ML modeli dener, başarısız olursa kural tabanlı fallback'e geçer.
   * @param userId Kullanıcının ID'si.
   * @param event Analiz edilecek aktivite olayı.
   * @returns Tespit edilen örüntüleri içeren bir RealtimeBehavioralPattern nesnesi veya null.
   */
  public async analyzeRealtimeBehavioralPattern(
    userId: string,
    event: ActivityEvent
  ): Promise<RealtimeBehavioralPattern | null> {
    let pattern: RealtimeBehavioralPattern | null = null;
    const timestamp = new Date().toISOString(); // Anlık zaman damgası

    // AI ile analiz dene
    try {
      const aiResult = await this.geminiService.classifyActivity(
        `User ${userId} activity: ${event.title} in category ${event.category} for ${event.duration_sec} seconds.`
      );
      if (aiResult.confidence > 0.7) {
        pattern = {
          user_id: userId,
          timestamp: event.timestamp_start,
          pattern_type: 'ai_detected_pattern',
          description: `AI detected pattern in activity: ${event.title}`,
          confidence_score: aiResult.confidence,
          related_activity_id: event.id,
          model_version: 'gemini-1.5-flash',
        };
      }
    } catch (aiError) {
      console.warn('AI analysis failed, falling back to rule-based:', aiError);
      // Fallback to rule-based
      pattern = this.ruleBasedAnalysis(event, userId);
    }

    // Rule-based fallback
    if (!pattern) {
      pattern = this.ruleBasedAnalysis(event, userId);
    }

    return pattern;
  }

  private ruleBasedAnalysis(event: ActivityEvent, userId: string): RealtimeBehavioralPattern | null {
    // Basit kural tabanlı analiz
    if (event.is_afk && event.duration_sec > 300) {
      // 5 dakikadan fazla AFK
      return {
        user_id: userId,
        timestamp: event.timestamp_start,
        pattern_type: 'idle_detection',
        description: `Kullanıcı ${Math.floor(event.duration_sec / 60)} dakikadan fazla süredir hareketsiz.`,
        confidence_score: 0.8,
        related_activity_id: event.id,
        model_version: 'v1.0-rule-based',
      };
    }

    if (event.duration_sec > 7200) { // 2 saatten fazla
      return {
        user_id: userId,
        timestamp: event.timestamp_start,
        pattern_type: 'high_activity',
        description: 'Uzun süreli yüksek aktivite tespit edildi.',
        confidence_score: 0.9,
        related_activity_id: event.id,
        model_version: 'v1.0-rule-based',
      };
    }

    return null;
  }

  /**
   * Belirli bir zaman dilimindeki odak skorlarının trendini hesaplar.
   * AI fallback: ML başarısız olursa basit hareketli ortalama kullan.
   * @param focusScores Geçmiş odak skorları dizisi.
   * @returns Odak skoru trendi hakkında bilgi.
   */
  public async calculateFocusScoreTrend(focusScores: number[]): Promise<{
    trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
    slope?: number;
    explanation: string;
  }> {
    if (focusScores.length < 2) {
      return { trend: 'unknown', explanation: 'Trend analizi için yeterli veri yok.' };
    }

    let trend: 'increasing' | 'decreasing' | 'stable' | 'unknown' = 'unknown';
    let slope: number | undefined;

    try {
      // AI ile trend analizi dene
      const aiTrend = await this.geminiService.generateInsight(
        `Analyze focus scores trend: ${focusScores.join(', ')}. Is it increasing, decreasing, or stable?`
      );
      if (aiTrend.includes('increasing')) {
        trend = 'increasing';
      } else if (aiTrend.includes('decreasing')) {
        trend = 'decreasing';
      } else if (aiTrend.includes('stable')) {
        trend = 'stable';
      }
    } catch (aiError) {
      console.warn('AI trend analysis failed, falling back to linear regression:', aiError);
      // Fallback to linear regression
      const dataPoints: [number, number][] = focusScores.map((score, index) => [index, score]);
      const lr = linearRegression(dataPoints);
      slope = lr.slope;
      if (slope > 0.1) {
        trend = 'increasing';
      } else if (slope < -0.1) {
        trend = 'decreasing';
      } else {
        trend = 'stable';
      }
    }

    const explanation = `Odak skoru trendi: ${trend}.`;
    return { trend, slope, explanation };
  }

  /**
   * Veri setindeki anomalileri Z-skoru yöntemiyle tespit eder.
   * AI fallback: ML başarısız olursa Z-score kullan.
   * @param dataPoints Sayısal veri noktaları dizisi.
   * @param threshold Z-skoru eşiği (varsayılan 2.0 veya 3.0).
   * @returns Anomali içeren noktaların listesi ve anomali tespiti hakkında bilgi.
   */
  public async detectAnomalyWithZScore(
    dataPoints: number[],
    threshold: number = 2.5
  ): Promise<{
    anomalies: { value: number; index: number; zScore: number }[];
    explanation: string;
  }> {
    if (dataPoints.length < 2) {
      return { anomalies: [], explanation: 'Anomali tespiti için yeterli veri yok.' };
    }

    let anomalies: { value: number; index: number; zScore: number }[] = [];

    try {
      // AI ile anomali tespiti dene
      const aiAnomaly = await this.geminiService.generateInsight(
        `Detect anomalies in data points: ${dataPoints.join(', ')}. List any unusual values.`
      );
      // Parse AI response for anomalies (simplified)
      if (aiAnomaly.includes('anomaly')) {
        // Assume AI returns indices or values, parse accordingly
        // For demo, use rule-based as fallback anyway
        anomalies = dataPoints.map((value, index) => {
          const zScore = (value - mean(dataPoints)) / standardDeviation(dataPoints);
          if (Math.abs(zScore) > threshold) {
            return { value, index, zScore: parseFloat(zScore.toFixed(2)) };
          }
        }).filter(Boolean) as any;
      }
    } catch (aiError) {
      console.warn('AI anomaly detection failed, falling back to Z-score:', aiError);
      // Fallback to Z-score
      const dataMean = mean(dataPoints);
      const dataStdDev = standardDeviation(dataPoints);
      if (dataStdDev === 0) {
        return { anomalies: [], explanation: 'Tüm veriler aynı, anomali tespit edilemedi.' };
      }
      anomalies = dataPoints.map((value, index) => {
        const zScore = (value - dataMean) / dataStdDev;
        if (Math.abs(zScore) > threshold) {
          return { value, index, zScore: parseFloat(zScore.toFixed(2)) };
        }
      }).filter(Boolean) as any;
    }

    const explanation =
      anomalies.length > 0
        ? `${anomalies.length} anomali tespit edildi (eşik: ${threshold}).`
        : `Anomali tespit edilmedi (eşik: ${threshold}).`;

    return { anomalies, explanation };
  }

  /**
   * Doğal Dil İşleme (NLP) yetenekleri için yer tutucu.
   * Gelecekte metin analizi, duygu analizi veya konu modelleme eklenebilir.
   * @param text Analiz edilecek metin.
   * @returns NLP analizi sonuçları.
   */
  public async performNlpAnalysis(text: string): Promise<any> {
    // Gemini ile NLP analizi
    try {
      const result = await this.geminiService.generateInsight(
        `Perform NLP analysis on: ${text}. Extract sentiment, entities, and categories.`
      );
      return {
        sentiment: 'positive', // Parse from result
        entities: [], // Parse from result
        categories: [], // Parse from result
        summary: result,
      };
    } catch (error) {
      console.error('NLP analysis failed:', error);
      return {
        sentiment: 'unknown',
        entities: [],
        categories: [],
        summary: 'NLP analizi başarısız.',
      };
    }
  }

  /**
   * This is a placeholder for a future ML model.
   * @param event The activity event to analyze.
   * @returns A promise that resolves to an object indicating if an anomaly was detected.
   */
  private async runMlModel(
    event: ActivityEvent
  ): Promise<
    | { isAnomaly: false }
    | {
        isAnomaly: true;
        pattern_type: RealtimeBehavioralPattern['pattern_type'];
        description: string;
        confidence_score: number;
      }
  > {
    // Makine öğrenimi modeli tahminini simüle et
    await new Promise(resolve => setTimeout(resolve, 100)); // Ağ gecikmesini simüle et

    const randomValue = Math.random();

    if (randomValue < 0.05) {
      // %5 olasılıkla yüksek aktivite anomalisi
      return {
        isAnomaly: true,
        pattern_type: 'high_activity',
        description:
          'Makine öğrenimi modeli tarafından alışılmadık derecede yüksek bir aktivite tespit edildi.',
        confidence_score: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)), // 0.7-1.0 arası güven
      };
    } else if (randomValue < 0.1) {
      // %5 olasılıkla düşük aktivite anomalisi
      return {
        isAnomaly: true,
        pattern_type: 'low_activity',
        description:
          'Makine öğrenimi modeli tarafından alışılmadık derecede düşük bir aktivite tespit edildi.',
        confidence_score: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
      };
    } else if (randomValue < 0.15) {
      // %5 olasılıkla olağandışı kategori kullanımı anomalisi
      return {
        isAnomaly: true,
        pattern_type: 'unusual_category_use',
        description: `Makine öğrenimi modeli tarafından ${event.category || 'bilinmeyen'} kategorisinde sıra dışı kullanım tespit edildi.`,
        confidence_score: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
      };
    } else {
      return { isAnomaly: false };
    }
  }

  /**
   * Detects a consistent drop in activity on weekends.
   * This is a simplified rule-based detection for seasonality.
   * @deprecated Artık kullanılmamaktadır.
   */
  private detectWeekendDrop(): boolean {
    throw new Error('detectWeekendDrop fonksiyonu artık kullanılmamaktadır.');
  }
}
