import { db } from "../firebaseAdmin";
import { z } from 'zod'; // Zod'u import et

interface DailyTotal {
  date: string;
  total_seconds: number;
}

interface AnomalyResult {
  date: string;
  is_anomaly: boolean; // Anomalinin olup olmadığını belirten yeni alan
  anomaly_score?: number; // Anomali skoru (örneğin, 0-1 arası bir değer)
  deviation_percent?: number; // Sapma yüzdesi (isteğe bağlı)
  explanation?: string; // Anomaliye ilişkin açıklama veya içgörü
}

interface AnomalyOutput {
  anomalies: AnomalyResult[];
  baseline_mean?: number;
  baseline_stddev?: number;
  explanation: string;
  model_version: string; // Kullanılan modelin versiyonu
}

// Zod şemalarını tanımla
const DailyTotalSchema = z.object({
  date: z.string(),
  total_seconds: z.number(),
});

const AnomalyResultSchema = z.object({
  date: z.string(),
  is_anomaly: z.boolean(),
  anomaly_score: z.number().optional(),
  deviation_percent: z.number().optional(),
  explanation: z.string().optional(),
});

const AnomalyOutputSchema = z.object({
  anomalies: z.array(AnomalyResultSchema),
  baseline_mean: z.number().optional(),
  baseline_stddev: z.number().optional(),
  explanation: z.string(),
  model_version: z.string(),
});

export class AnomalyDetectionService {
  /**
   * Calculates the mean of an array of numbers.
   * @param data The array of numbers.
   * @returns The mean.
   */
  public static calculateMean(data: number[]): number {
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
  }

  /**
   * Calculates the standard deviation of an array of numbers.
   * @param data The array of numbers.
   * @param mean The pre-calculated mean of the data.
   * @returns The standard deviation.
   */
  public static calculateStandardDeviation(data: number[], mean: number): number {
    const squaredDifferences = data.map(val => Math.pow(val - mean, 2));
    const sumOfSquaredDifferences = squaredDifferences.reduce((acc, val) => acc + val, 0);
    return Math.sqrt(sumOfSquaredDifferences / data.length);
  }

  /**
   * Aktivite verilerinde gelişmiş anomali tespiti yapar.
   * GenKit ve AI modeli entegrasyonu için akış olarak yeniden düzenlendi.
   * @param dailyTotals Günlük aktivite toplamlarını içeren bir dizi.
   * @returns Tespit edilen anomalileri ve model istatistiklerini içeren bir AnomalyOutput nesnesi.
   */
  public async detectAnomalies(dailyTotals: DailyTotal[]): Promise<AnomalyOutput> {
    // Call statistical detection function
    const result = await detectAnomaliesFlow(dailyTotals);
    return result;
  }

  /**
   * Kullanıcının anomali uyarılarını Firestore'dan alır.
   * @param userId Kullanıcı ID'si.
   * @returns Anomali uyarıları dizisi.
   */
  public async getAnomalyAlerts(userId: string): Promise<AnomalyResult[]> {
    const snapshot = await db.collection(`users/${userId}/anomalyAlerts`)
      .orderBy("date", "desc")
      .limit(20) // En son 20 uyarıyı getir
      .get();
    
    return snapshot.docs.map(doc => doc.data() as AnomalyResult);
  }
}

/**
 * Statistical anomaly detection function (GenKit-free implementation)
 * Detects anomalies using Z-score statistical method
 */
export async function detectAnomaliesFlow(dailyTotals: DailyTotal[]): Promise<AnomalyOutput> {
    const totalSecondsValues = dailyTotals.map((d: DailyTotal) => d.total_seconds);

    if (totalSecondsValues.length < 5) {
      return {
        anomalies: [],
        baseline_mean: 0,
        baseline_stddev: 0,
        explanation: "Anomali tespiti için yeterli veri yok. En az 5 günlük veri gereklidir. Gelişmiş anomali tespiti için daha fazla veri önerilir.",
        model_version: "v1.0-statistical"
      };
    }

    // Mevcut istatistiksel anomali tespiti mantığı
    const mean = AnomalyDetectionService.calculateMean(totalSecondsValues);
    const stdDev = AnomalyDetectionService.calculateStandardDeviation(totalSecondsValues, mean);

    const anomalies: AnomalyResult[] = [];

    for (const dailyTotal of dailyTotals) {
      let isAnomaly = false;
      let anomalyScore = 0;
      let deviationPercent = 0;
      let explanationText = "";

      if (stdDev === 0) {
        if (dailyTotal.total_seconds !== mean) {
          isAnomaly = true;
          anomalyScore = 1.0;
          deviationPercent = ((dailyTotal.total_seconds - mean) / (mean || 1)) * 100;
          explanationText = "Tüm değerler aynıyken farklı bir aktivite tespit edildi.";
        }
      } else {
        const zScore = (dailyTotal.total_seconds - mean) / stdDev;
        if (Math.abs(zScore) >= 2) { // Z-skoru eşiği (ayarlanabilir)
          isAnomaly = true;
          anomalyScore = Math.min(1.0, Math.abs(zScore) / 3); // Skoru 0-1 arasına normalize etmeye çalış
          deviationPercent = ((dailyTotal.total_seconds - mean) / mean) * 100;
          explanationText = `Aykırı aktivite tespit edildi: ${deviationPercent.toFixed(2)}% sapma (Z-skoru: ${zScore.toFixed(2)}).`;
        }
      }

      if (isAnomaly) {
        anomalies.push({
          date: dailyTotal.date,
          is_anomaly: true,
          anomaly_score: parseFloat(anomalyScore.toFixed(2)),
          deviation_percent: parseFloat(deviationPercent.toFixed(2)),
          explanation: explanationText,
        });
      }
    }

    anomalies.sort((a, b) => (b.anomaly_score || 0) - (a.anomaly_score || 0));

    // Statistical summary without AI (GenKit removed for compatibility)
    const avgHours = (mean / 3600).toFixed(2);
    const stdDevHours = (stdDev / 3600).toFixed(2);
    
    let explanation = `${anomalies.length} adet anomali tespit edildi. Ortalama: ${avgHours} saat, Standart sapma: ${stdDevHours} saat.`;
    
    if (anomalies.length > 0) {
      explanation += ` En yüksek anomali skoru: ${anomalies[0].anomaly_score}`;
    } else {
      explanation += " Tüm aktiviteler normal aralıkta.";
    }

    return {
      anomalies: anomalies.slice(0, 10),
      baseline_mean: parseFloat(mean.toFixed(2)),
      baseline_stddev: parseFloat(stdDev.toFixed(2)),
      explanation,
      model_version: "v2.0-statistical"
    };
} 