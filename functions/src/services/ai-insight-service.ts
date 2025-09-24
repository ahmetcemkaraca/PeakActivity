import { db } from '../firebaseAdmin';
import { MLDataPreparationService } from './ml-data-preparation-service';
import { LanguageServiceClient } from '@google-cloud/language';

export class AIInsightService {
  private db: any;
  private mlDataPreparationService: MLDataPreparationService;
  private languageClient: LanguageServiceClient;

  constructor() {
    this.db = db;
    this.mlDataPreparationService = new MLDataPreparationService();
    this.languageClient = new LanguageServiceClient();
  }

  /**
   * Kullanıcı aktivite ve proje verilerini analiz ederek AI destekli özetler ve içgörüler oluşturur.
   * @param userId Analiz edilecek kullanıcının Firebase UID'si.
   * @param startDate Analiz edilecek verilerin başlangıç tarihi (ISO string).
   * @param endDate Analiz edilecek verilerin bitiş tarihi (ISO string).
   * @returns Oluşturulan özetler ve içgörüler.
   */
  async generateInsights(userId: string, startDate: string, endDate: string) {
    try {
      const preparedData = await this.mlDataPreparationService.prepareDataForML(
        userId,
        startDate,
        endDate
      );
      console.log(
        `İçgörü oluşturmak için hazırlanan veri: Aktivite: ${preparedData.activities.length}, Projeler: ${preparedData.projects.length}, Görevler: ${preparedData.tasks.length}`
      );

      let summary = '';
      const insights: string[] = [];

      if (preparedData.activities.length > 0) {
        // Duygu analizi ve varlık çıkarma için metinleri birleştir
        const activityTexts = preparedData.activities
          .map(
            activity => `${activity.app || ''} ${activity.title || ''} ${activity.category || ''}`
          )
          .join('. ');

        if (activityTexts.length > 0) {
          const document = { content: activityTexts, type: 'PLAIN_TEXT' as const };
          const [sentimentResult] = await this.languageClient.analyzeSentiment({ document });
          const [entityResult] = await this.languageClient.analyzeEntities({ document });

          if (sentimentResult.documentSentiment) {
            const score = sentimentResult.documentSentiment.score || 0;
            const magnitude = sentimentResult.documentSentiment.magnitude || 0;
            summary += `Genel olarak aktivitelerinizde ${score >= 0.2 ? 'pozitif' : score <= -0.2 ? 'negatif' : 'nötr'} bir duygu tonu (${score.toFixed(2)} skor, ${magnitude.toFixed(2)} yoğunluk) gözlemlenmiştir.`;
            insights.push(
              `Duygu Analizi: Kullanıcının genel aktivite duygu skoru: ${score.toFixed(2)} (Yoğunluk: ${magnitude.toFixed(2)})`
            );
          }

          if (entityResult.entities && entityResult.entities.length > 0) {
            const topEntities = entityResult.entities
              .sort((a, b) => (b.salience || 0) - (a.salience || 0))
              .slice(0, 5);
            summary += ` Anahtar odak alanlarınız: ${topEntities.map(e => e.name).join(', ')}.`;
            insights.push(
              `Varlık Çıkarma: Başlıca odak alanları: ${topEntities.map(e => `${e.name} (${e.type})`).join(', ')}`
            );
          }
        }

        const topApps = preparedData.activities.reduce(
          (acc: { [key: string]: number }, activity) => {
            const app = activity.app || 'Bilinmeyen Uygulama';
            acc[app] = (acc[app] || 0) + (activity.duration_sec || 0);
            return acc;
          },
          {}
        );
        const sortedApps = Object.entries(topApps).sort(([, a], [, b]) => b - a);

        if (sortedApps.length > 0) {
          summary += ` Kullanıcı son ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} günde en çok ${sortedApps[0][0]} uygulamasını kullanmıştır.`;
          insights.push(
            `Top Uygulama Kullanımı: En çok kullanılan uygulama: ${sortedApps[0][0]} (Toplam süre: ${(sortedApps[0][1] / 3600).toFixed(2)} saat)`
          );
        }
      }
      if (preparedData.projects.length > 0) {
        const activeProjects = preparedData.projects.filter(p => p.status === 'active');
        if (activeProjects.length > 0) {
          summary += ` Şu anda ${activeProjects.length} aktif projesi bulunmaktadır.`;
          insights.push(`Aktif Projeler: Kullanıcının ${activeProjects.length} aktif projesi var.`);
        }
      }

      return {
        summary: summary || 'Belirtilen dönem için AI içgörüleri oluşturulamadı.',
        trends: [], // Daha fazla analiz için eklenebilir
        anomalies: [], // Anomali tespiti servisi ile entegre edilebilir
        recommendations: [], // Öneri servisi ile entegre edilebilir
        insights: insights, // Oluşturulan içgörüleri listele
      };
    } catch (error) {
      console.error(`AI içgörüleri oluşturulurken hata oluştu:`, error);
      throw error;
    }
  }
}
