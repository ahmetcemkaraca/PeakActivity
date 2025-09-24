import { db } from '../firebaseAdmin';
import { ActivityEvent } from '../types/activity-event'; // ActivityEvent'ı içe aktar
import {
  linearRegression,
  linearRegressionLine,
  mean,
  standardDeviation,
} from '../services/utils/math-utils'; // İstatistiksel yardımcı fonksiyonları içe aktar

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
  /**
   * Tekil bir aktivite olayı üzerinden gerçek zamanlı davranışsal örüntüleri analiz eder.
   * Bu fonksiyon, gelecekte daha gelişmiş makine öğrenimi modellerinin entegrasyonu için bir yer tutucudur.
   * Şimdilik basit kurallara dayalı tespitler yapar.
   * @param userId Kullanıcının ID'si.
   * @param event Analiz edilecek aktivite olayı.
   * @returns Tespit edilen örüntüleri içeren bir RealtimeBehavioralPattern nesnesi veya null.
   */
  public async analyzeRealtimeBehavioralPattern(
    userId: string,
    event: ActivityEvent
  ): Promise<RealtimeBehavioralPattern | null> {
    // Gelecekteki makine öğrenimi modeli entegrasyon noktası.
    // Buraya TensorFlow.js veya başka bir ML modeli ile gerçek zamanlı sınıflandırma/tespit algoritmaları eklenebilir.
    // Örneğin, kullanıcının o anki aktivitesini geçmiş desenlerle karşılaştıran bir model.

    let pattern: RealtimeBehavioralPattern | null = null;
    const timestamp = new Date().toISOString(); // Anlık zaman damgası

    // Örnek: Yüksek AFK süresi tespiti (basit kural tabanlı)
    if (event.is_afk && event.duration_sec > 300) {
      // 5 dakikadan fazla AFK
      pattern = {
        user_id: userId,
        timestamp: event.timestamp_start,
        pattern_type: 'idle_detection',
        description: `Kullanıcı ${Math.floor(event.duration_sec / 60)} dakikadan fazla süredir hareketsiz.`, // Türkçeleştirilmiş açıklama
        confidence_score: 0.8,
        related_activity_id: event.id, // Eğer ActivityEvent'ta id varsa
        model_version: 'v1.0-rule-based',
      };
    }

    // ML entegrasyonu için yer tutucu:
    const mlModelPrediction = await this.runMlModel(event);
    if (mlModelPrediction.isAnomaly) {
      pattern = {
        user_id: userId,
        timestamp: event.timestamp_start,
        pattern_type: mlModelPrediction.pattern_type,
        description: mlModelPrediction.description,
        confidence_score: mlModelPrediction.confidence_score,
        related_activity_id: event.id,
        model_version: 'v2.0-ml-powered',
      };
    }

    return pattern;
  }

  /**
   * Belirli bir zaman dilimindeki odak skorlarının trendini hesaplar.
   * Geçmiş odak skorlarını alır ve lineer regresyon veya hareketli ortalama gibi yöntemlerle trendi belirler.
   * @param focusScores Geçmiş odak skorları dizisi.
   * @returns Odak skoru trendi hakkında bilgi.
   */
  public calculateFocusScoreTrend(focusScores: number[]): {
    trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
    slope?: number;
    explanation: string;
  } {
    if (focusScores.length < 2) {
      return { trend: 'unknown', explanation: 'Trend analizi için yeterli veri yok.' };
    }

    // Basit lineer regresyon ile trend tespiti
    const dataPoints: [number, number][] = focusScores.map((score, index) => [index, score]);
    const lr = linearRegression(dataPoints);
    const slope = lr.slope;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (slope > 0.1) {
      // Eşik değeri ayarlanabilir
      trend = 'increasing';
    } else if (slope < -0.1) {
      // Eşik değeri ayarlanabilir
      trend = 'decreasing';
    }

    const explanation = `Odak skoru trendi: ${trend}. Eğim: ${slope.toFixed(2)}.`;
    return { trend, slope, explanation };
  }

  /**
   * Veri setindeki anomalileri Z-skoru yöntemiyle tespit eder.
   * @param dataPoints Sayısal veri noktaları dizisi.
   * @param threshold Z-skoru eşiği (varsayılan 2.0 veya 3.0).
   * @returns Anomali içeren noktaların listesi ve anomali tespiti hakkında bilgi.
   */
  public detectAnomalyWithZScore(
    dataPoints: number[],
    threshold: number = 2.5
  ): {
    anomalies: { value: number; index: number; zScore: number }[];
    explanation: string;
  } {
    if (dataPoints.length < 2) {
      return { anomalies: [], explanation: 'Anomali tespiti için yeterli veri yok.' };
    }

    const dataMean = mean(dataPoints);
    const dataStdDev = standardDeviation(dataPoints);

    const anomalies: { value: number; index: number; zScore: number }[] = [];

    if (dataStdDev === 0) {
      return { anomalies: [], explanation: 'Tüm veriler aynı, anomali tespit edilemedi.' };
    }

    dataPoints.forEach((value, index) => {
      const zScore = (value - dataMean) / dataStdDev;
      if (Math.abs(zScore) > threshold) {
        anomalies.push({ value, index, zScore: parseFloat(zScore.toFixed(2)) });
      }
    });

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
    // Buraya Google Cloud Natural Language API veya benzeri bir NLP servisi entegre edilebilir.
    // Şimdilik sadece bir yer tutucu.
    return {
      sentiment: 'neutral',
      entities: [],
      categories: [],
      summary: 'Bu metin için NLP analizi henüz uygulanmadı.',
    };
  }

  /**
   * Bu fonksiyonun artık kullanılmadığını belirtmek için yeniden adlandırıldı.
   * Yeni gerçek zamanlı analiz için analyzeRealtimeBehavioralPattern kullanın.
   * @deprecated Artık kullanılmamaktadır. analyzeRealtimeBehavioralPattern kullanın.
   */
  public analyzeBehavioralPatterns(): never {
    throw new Error(
      'analyzeBehavioralPatterns fonksiyonu artık kullanılmamaktadır. Lütfen analyzeRealtimeBehavioralPattern kullanın.'
    );
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
        description: `Makine öğrenimi modeli tarafından ${event.category || 'bilinmeyen'} kategorisinde sıra dışı kullanım tespit edildi.`, // Türkçeleştirilmiş açıklama
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
