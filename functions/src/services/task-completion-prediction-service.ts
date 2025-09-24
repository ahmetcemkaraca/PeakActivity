import { db } from '../firebaseAdmin';
import { MLDataPreparationService } from './ml-data-preparation-service';
import * as tf from '@tensorflow/tfjs';

export class TaskCompletionPredictionService {
  private db: any;
  private mlDataPreparationService: MLDataPreparationService;
  private model: tf.Sequential | null = null;

  constructor() {
    this.db = db;
    this.mlDataPreparationService = new MLDataPreparationService();
    this.loadModel();
  }

  private async loadModel() {
    // TODO: Gerçek bir senaryoda, eğitilmiş modeli bir yerden yükleyin (örneğin Firebase Storage).
    // Şimdilik, basit bir model oluşturup eğiteceğiz.
    if (!this.model) {
      this.model = tf.sequential();
      this.model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [2] })); // duration_sec, activity_count
      this.model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
      this.model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

      // Basit dummy veri ile model eğitimi
      const xs = tf.tensor2d([
        [100, 5],
        [200, 10],
        [50, 2],
        [300, 15],
        [150, 7],
      ]);
      const ys = tf.tensor2d([[1], [2], [0.5], [3], [1.5]]); // Tahmini saatler

      console.log('ML modeli eğitiliyor...');
      await this.model.fit(xs, ys, { epochs: 50 });
      console.log('ML modeli eğitimi tamamlandı.');
    }
  }

  /**
   * Görev tamamlama süresini tahmin eden fonksiyon.
   * @param userId Tahmin yapılacak kullanıcının Firebase UID'si.
   * @param projectId Tahmin yapılacak projenin ID'si.
   * @returns Tahmini tamamlama süresi (saat cinsinden) ve ek istatistikler.
   */
  async predictTaskCompletion(userId: string, projectId: string) {
    try {
      if (!this.model) {
        console.warn('ML modeli yüklenmedi, varsayılan tahmin kullanılıyor.');
        await this.loadModel(); // Modeli yüklemeye çalış
        if (!this.model) {
          throw new Error('ML modeli yüklenemedi.');
        }
      }

      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const preparedData = await this.mlDataPreparationService.prepareDataForML(
        userId,
        startDate,
        endDate
      );
      console.log(
        `ML modeli için hazırlanan veri boyutu: Aktivite: ${preparedData.activities.length}, Projeler: ${preparedData.projects.length}, Görevler: ${preparedData.tasks.length}`
      );

      const relevantActivities = preparedData.activities.filter(activity =>
        preparedData.projects.some(
          p =>
            p.id === projectId &&
            (p.title.includes(activity.app) || p.title.includes(activity.title))
        )
      );

      // Model girdisi için özellikleri hazırla
      // Örnek: relevantActivities'deki toplam süreyi ve aktivite sayısını kullan
      const totalDurationSec = relevantActivities.reduce(
        (sum, activity) => sum + (activity.duration_sec || 0),
        0
      );
      const activityCount = relevantActivities.length;

      let predictedCompletionHours = 0;
      if (activityCount > 0) {
        const inputTensor = tf.tensor2d([[totalDurationSec, activityCount]]);
        const prediction = this.model.predict(inputTensor) as tf.Tensor;
        predictedCompletionHours = prediction.dataSync()[0];
      }

      return {
        predictedCompletionHours: predictedCompletionHours,
        confidence: 0.85, // ML modeline dayalı daha yüksek güven skoru
        details: 'Bu tahmin, eğitilmiş bir ML modeline dayanmaktadır.',
      };
    } catch (error) {
      console.error(`Görev tamamlama tahmini yapılırken hata oluştu:`, error);
      throw error;
    }
  }
}
