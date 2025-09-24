import { db } from '../firebaseAdmin';
import { genkitInstance } from '../index';
import { z } from 'zod'; // Zod'u import et
import { googleAI } from '@genkit-ai/googleai'; // Google AI'yı import et

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
    // GenKit akışını çağır
    const result = await detectAnomaliesFlow({ dailyTotals });
    return result;
  }

  /**
   * Kullanıcının anomali uyarılarını Firestore'dan alır.
   * @param userId Kullanıcı ID'si.
   * @returns Anomali uyarıları dizisi.
   */
  public async getAnomalyAlerts(userId: string): Promise<AnomalyResult[]> {
    const snapshot = await db
      .collection(`users/${userId}/anomalyAlerts`)
      .orderBy('date', 'desc')
      .limit(20) // En son 20 uyarıyı getir
      .get();

    return snapshot.docs.map(doc => doc.data() as AnomalyResult);
  }
}

// GenKit anomali tespiti akışı
export const detectAnomaliesFlow = genkitInstance.defineFlow(
  {
    name: 'detectAnomalies',
    inputSchema: z.object({ dailyTotals: z.array(DailyTotalSchema) }),
    outputSchema: AnomalyOutputSchema,
  },
  async ({ dailyTotals }: { dailyTotals: DailyTotal[] }) => {
    const totalSecondsValues = dailyTotals.map((d: DailyTotal) => d.total_seconds);

    if (totalSecondsValues.length < 5) {
      return {
        anomalies: [],
        baseline_mean: 0,
        baseline_stddev: 0,
        explanation:
          'Anomali tespiti için yeterli veri yok. En az 5 günlük veri gereklidir. Gelişmiş anomali tespiti için daha fazla veri önerilir.',
        model_version: 'v1.0-statistical',
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
      let explanationText = '';

      if (stdDev === 0) {
        if (dailyTotal.total_seconds !== mean) {
          isAnomaly = true;
          anomalyScore = 1.0;
          deviationPercent = ((dailyTotal.total_seconds - mean) / (mean || 1)) * 100;
          explanationText = 'Tüm değerler aynıyken farklı bir aktivite tespit edildi.';
        }
      } else {
        const zScore = (dailyTotal.total_seconds - mean) / stdDev;
        if (Math.abs(zScore) >= 2) {
          // Z-skoru eşiği (ayarlanabilir)
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

    // GenKit'in AI modelini kullanarak ek analiz veya açıklama alma (placeholder)
    // Bu kısım, AI modelinin daha karmaşık anomali kalıplarını tanıması için kullanılabilir.
    let aiExplanation = 'Yapay zeka analizi bekleniyor...';
    try {
      const prompt = `Aşağıdaki günlük aktivite verilerini inceleyin ve herhangi bir anormallik olup olmadığını, nedenini ve potansiyel etkilerini açıklayın: ${JSON.stringify(dailyTotals)}. Anomali olarak kabul edilecek bir durum, normalden önemli ölçüde sapan bir aktivite süresi olacaktır.`;
      const { text } = await genkitInstance.generate({
        model: googleAI.model('gemini-2.5-flash'), // GenKit içinde tanımlanan modeli kullan
        prompt: prompt,
        config: {
          temperature: 0.2, // Daha tutarlı sonuçlar için düşük sıcaklık
        },
      });
      aiExplanation = text;
    } catch (error) {
      console.error('GenKit AI analizi sırasında hata oluştu:', error);
      aiExplanation = 'Yapay zeka analizi sırasında bir hata oluştu.';
    }

    return {
      anomalies: anomalies.slice(0, 10),
      baseline_mean: parseFloat(mean.toFixed(2)),
      baseline_stddev: parseFloat(stdDev.toFixed(2)),
      explanation:
        anomalies.length > 0
          ? 'Belirlenen aktivite verilerinde anormal günler tespit edildi. ' + aiExplanation
          : 'Anormal aktivite verisi tespit edilmedi. ' + aiExplanation,
      model_version: 'v2.0-genkit-statistical-hybrid',
    };
  }
);
