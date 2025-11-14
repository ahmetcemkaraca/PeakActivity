import { db } from "../firebaseAdmin";
import { MLDataPreparationService } from './ml-data-preparation-service';

/**
 * Task Completion Prediction Service
 * Provides statistical-based predictions for task completion times
 * 
 * Note: TensorFlow.js has been moved to client-side (Edge AI) for better performance and privacy.
 * This service now uses statistical methods for server-side predictions.
 */
export class TaskCompletionPredictionService {
  private db: any;
  private mlDataPreparationService: MLDataPreparationService;

  constructor() {
    this.db = db;
    this.mlDataPreparationService = new MLDataPreparationService();
  }

  /**
   * Calculate linear regression coefficients
   */
  private linearRegression(data: Array<[number, number]>): { slope: number; intercept: number } {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (const [x, y] of data) {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Görev tamamlama süresini tahmin eden fonksiyon.
   * Statistical approach using historical activity data
   * 
   * @param userId Tahmin yapılacak kullanıcının Firebase UID'si.
   * @param projectId Tahmin yapılacak projenin ID'si.
   * @returns Tahmini tamamlama süresi (saat cinsinden) ve ek istatistikler.
   */
  async predictTaskCompletion(userId: string, projectId: string) {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const preparedData = await this.mlDataPreparationService.prepareDataForML(userId, startDate, endDate);
      console.log(`Tahmin için hazırlanan veri boyutu: Aktivite: ${preparedData.activities.length}, Projeler: ${preparedData.projects.length}, Görevler: ${preparedData.tasks.length}`);

      const relevantActivities = preparedData.activities.filter(activity =>
        preparedData.projects.some(p => p.id === projectId && (p.title.includes(activity.app) || p.title.includes(activity.title)))
      );

      // Calculate total duration and activity count
      const totalDurationSec = relevantActivities.reduce((sum, activity) => sum + (activity.duration_sec || 0), 0);
      const activityCount = relevantActivities.length;

      let predictedCompletionHours = 0;
      let confidence = 0.5;

      if (activityCount > 0) {
        // Statistical estimation based on historical data
        // Formula: predicted_hours = (total_duration_sec / activity_count) * complexity_factor / 3600
        
        const avgDurationPerActivity = totalDurationSec / activityCount;
        const complexityFactor = this.calculateComplexityFactor(relevantActivities);
        
        // Estimate remaining work based on patterns
        predictedCompletionHours = (avgDurationPerActivity * complexityFactor) / 3600;
        
        // Confidence increases with more data points
        confidence = Math.min(0.95, 0.5 + (activityCount / 100) * 0.45);
        
        // Apply bounds to prediction
        predictedCompletionHours = Math.max(0.5, Math.min(predictedCompletionHours, 200));
      } else {
        // Default estimation when no historical data available
        predictedCompletionHours = 8; // Default to 1 day
        confidence = 0.3;
      }

      return {
        predictedCompletionHours: Math.round(predictedCompletionHours * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        details: `Bu tahmin, ${activityCount} aktivite kaydına dayanmaktadır. İstatistiksel analiz kullanılmıştır.`,
        methodology: 'statistical_regression',
        dataPoints: activityCount
      };

    } catch (error) {
      console.error(`Görev tamamlama tahmini yapılırken hata oluştu:`, error);
      throw error;
    }
  }

  /**
   * Calculate complexity factor based on activity patterns
   */
  private calculateComplexityFactor(activities: any[]): number {
    if (activities.length === 0) return 1.0;

    // Factors that increase complexity:
    // - Many different apps used (context switching)
    // - Irregular duration patterns
    // - Frequent short sessions

    const uniqueApps = new Set(activities.map(a => a.app)).size;
    const avgDuration = activities.reduce((sum, a) => sum + (a.duration_sec || 0), 0) / activities.length;
    const shortSessions = activities.filter(a => (a.duration_sec || 0) < 300).length; // < 5 minutes

    let complexityFactor = 1.0;

    // More apps = more complexity
    if (uniqueApps > 5) complexityFactor += 0.2;
    if (uniqueApps > 10) complexityFactor += 0.3;

    // Very short average duration = fragmented work
    if (avgDuration < 600) complexityFactor += 0.3; // < 10 minutes average

    // Many short sessions = interruptions
    if (shortSessions > activities.length * 0.3) complexityFactor += 0.2;

    return Math.min(complexityFactor, 2.5); // Cap at 2.5x
  }
} 