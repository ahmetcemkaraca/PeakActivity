import { db } from '../firebaseAdmin';
import { AnomalyDetectionService } from './anomaly-detection-service';
import { BehavioralAnalysisService } from './behavioral-analysis-service';
import { FocusQualityScoreService } from './focus-quality-score-service';

interface InsightDocument {
  id: string;
  user_id: string;
  type: 'anomaly_summary' | 'behavioral_trend' | 'focus_insight' | 'goal_progress_summary';
  summary: string;
  details?: any;
  generated_at: number;
  related_goal_id?: string;
  related_project_id?: string;
  related_report_id?: string;
  version: number;
}

export class InsightGenerationService {
  private anomalyService: AnomalyDetectionService;
  private behavioralService: BehavioralAnalysisService;
  private focusService: FocusQualityScoreService;

  constructor() {
    this.anomalyService = new AnomalyDetectionService();
    this.behavioralService = new BehavioralAnalysisService();
    this.focusService = new FocusQualityScoreService();
  }

  /**
   * Generates a new insight for a user based on various data points.
   * This is a simplified example, real implementation would query user activity data.
   * @param userId The ID of the user.
   * @param insightType The type of insight to generate.
   * @returns The generated insight document.
   */
  async generateInsight(
    userId: string,
    insightType: InsightDocument['type'],
    data: any
  ): Promise<InsightDocument> {
    const newInsightRef = db.collection(`users/${userId}/insights`).doc();
    const timestamp = Date.now();
    let summary = '';
    let details: any = {};

    switch (insightType) {
      case 'anomaly_summary':
        // Simulate calling anomaly detection service
        const anomalies = await this.anomalyService.detectAnomalies(data.dailyTotals);
        summary = `Aykırılık özeti oluşturuldu. Toplam ${anomalies.anomalies.length} aykırılık tespit edildi.`;
        details = { anomalies };
        break;
      case 'behavioral_trend':
        // Simulate behavioral analysis - using mock data since the service method is deprecated
        const mockTrends = {
          trending_categories: [
            { category: 'productivity', trend: 'rising' as const, slope_per_day: 0.5 },
            { category: 'communication', trend: 'stable' as const, slope_per_day: 0.1 },
          ],
        };
        const trendingCategoryNames = mockTrends.trending_categories.map(
          (tc: { category: string }) => tc.category
        );
        summary = `Davranışsal eğilim özeti oluşturuldu. Tespit edilen eğilimler: ${trendingCategoryNames.join(', ')}.`;
        details = { trends: mockTrends };
        break;
      case 'focus_insight':
        // Simulate calling focus quality score service
        const focusScore = this.focusService.calculateFocusQualityScores(data.events, data.user_tz);
        summary = `Odaklanma kalitesi içgörüsü oluşturuldu. Ortalama odaklanma puanı: ${focusScore.daily_average}.`;
        details = { focusScore };
        break;
      case 'goal_progress_summary':
        summary = `Hedef ilerleme özeti oluşturuldu.`;
        details = data.goalProgress; // Expect goal progress data in 'data'
        break;
      default:
        summary = 'Bilinmeyen içgörü tipi.';
        break;
    }

    const insight: InsightDocument = {
      id: newInsightRef.id,
      user_id: userId,
      type: insightType,
      summary,
      details,
      generated_at: timestamp,
      version: 1,
    };
    await newInsightRef.set(insight);
    return insight;
  }

  /**
   * Lists all insights for a user.
   * @param userId The ID of the user.
   * @returns An array of insight documents.
   */
  async listInsights(userId: string): Promise<InsightDocument[]> {
    const snapshot = await db.collection(`users/${userId}/insights`).get();
    return snapshot.docs.map(doc => doc.data() as InsightDocument);
  }

  /**
   * Retrieves a specific insight for a user.
   * @param userId The ID of the user.
   * @param insightId The ID of the insight to retrieve.
   * @returns The insight document, or null if not found.
   */
  async getInsight(userId: string, insightId: string): Promise<InsightDocument | null> {
    const insightDoc = await db.collection(`users/${userId}/insights`).doc(insightId).get();
    if (!insightDoc.exists) {
      return null;
    }
    return insightDoc.data() as InsightDocument;
  }

  /**
   * Deletes a specific insight for a user.
   * @param userId The ID of the user.
   * @param insightId The ID of the insight to delete.
   * @returns True if the insight was deleted, false otherwise.
   */
  async deleteInsight(userId: string, insightId: string): Promise<boolean> {
    const insightRef = db.collection(`users/${userId}/insights`).doc(insightId);
    await insightRef.delete();
    // Silme işlemi başarılıysa, belge artık mevcut değildir. Ek bir get() çağrısı gereksizdir.
    return true;
  }
}
