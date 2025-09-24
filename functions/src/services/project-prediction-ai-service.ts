import { db } from '../firebaseAdmin';
import { ProjectPredictionService } from './project-prediction-service';
import { AnomalyDetectionService } from './anomaly-detection-service';
import { BehavioralAnalysisService } from './behavioral-analysis-service';
import { FocusQualityScoreService } from './focus-quality-score-service';
import { ActivityService } from './activity-service';

interface ProjectDocument {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'cancelled';
  start_date: number;
  due_date?: number;
  completion_date?: number;
  total_tracked_duration: number;
  estimated_remaining_duration?: number;
  progress_percentage: number;
  associated_goals?: string[];
  associated_tasks?: string[];
  activity_breakdown?: { [category: string]: number };
  focus_score_average?: number;
  created_at: number;
  updated_at: number;
  version: number;
}

interface ProjectCompletionPrediction {
  estimated_completion_date: number; // Unix timestamp
  confidence_score: number; // 0-100
  rationale: string; // Explanation for the prediction
}

export class ProjectPredictionAIService {
  private db: any;
  private projectService: ProjectPredictionService;
  private anomalyService: AnomalyDetectionService;
  private behavioralService: BehavioralAnalysisService;
  private focusService: FocusQualityScoreService;
  private activityService: ActivityService;

  constructor() {
    this.db = db;
    this.projectService = new ProjectPredictionService();
    this.anomalyService = new AnomalyDetectionService();
    this.behavioralService = new BehavioralAnalysisService();
    this.focusService = new FocusQualityScoreService();
    this.activityService = new ActivityService();
  }

  /**
   * Simulates project completion prediction based on available data.
   * This is a simplified model for demonstration purposes, mimicking AI insights.
   * In a real scenario, this would involve a trained ML model (e.g., via Vertex AI).
   * @param userId The ID of the user.
   * @param projectId The ID of the project to predict.
   * @returns A ProjectCompletionPrediction object.
   */
  async predictProjectCompletion(
    userId: string,
    projectId: string
  ): Promise<ProjectCompletionPrediction> {
    const project = await this.projectService.getProject(userId, projectId);
    if (!project) {
      throw new Error('Project not found.');
    }

    const now = Date.now();
    const startDate = new Date(project.start_date).toISOString();
    const endDate = new Date(now).toISOString();

    const relevantActivityEvents = await this.activityService.getActivitiesInInterval(
      userId,
      startDate,
      endDate
    );

    let estimatedRemainingDuration = project.estimated_remaining_duration || 0;
    let progressPercentage = project.progress_percentage || 0;
    let rationale = `Proje tahmini: ${project.title}.`;
    let confidenceScore = 75; // Default confidence

    // Simulate influence of behavioral analysis and focus scores
    if (relevantActivityEvents.length > 0) {
      // Example: If average focus score is high, decrease estimated time
      const focusQualityScores = this.focusService.calculateFocusQualityScores(
        relevantActivityEvents,
        'Europe/Istanbul'
      ); // Using a default timezone for simulation
      if (focusQualityScores.daily_average !== null && focusQualityScores.daily_average > 80) {
        estimatedRemainingDuration *= 0.9; // 10% faster
        confidenceScore += 5;
        rationale += ' Yüksek odak kalitesi nedeniyle daha hızlı tamamlanması bekleniyor.';
      } else if (
        focusQualityScores.daily_average !== null &&
        focusQualityScores.daily_average < 50
      ) {
        estimatedRemainingDuration *= 1.1; // 10% slower
        confidenceScore -= 5;
        rationale += ' Düşük odak kalitesi nedeniyle daha yavaş tamamlanması bekleniyor.';
      }

      // Example: If there are recent anomalies, adjust confidence
      const dailyTotalsForAnomaly: { date: string; total_seconds: number }[] = [];
      const dailyCategoryTotalsForBehavioral: {
        date: string;
        categories: { [key: string]: number };
      }[] = [];

      // Populate dailyTotalsForAnomaly and dailyCategoryTotalsForBehavioral
      const dailyTotalsMap = new Map<string, number>();
      const dailyCategoryTotalsMap = new Map<string, { [category: string]: number }>();

      for (const event of relevantActivityEvents) {
        const eventDate = new Date(event.timestamp_start).toISOString().split('T')[0]; // YYYY-MM-DD
        const duration = event.duration_sec || 0;

        // For Anomaly Detection
        dailyTotalsMap.set(eventDate, (dailyTotalsMap.get(eventDate) || 0) + duration);

        // For Behavioral Analysis
        if (event.category) {
          const categoryTotals = dailyCategoryTotalsMap.get(eventDate) || {};
          categoryTotals[event.category] = (categoryTotals[event.category] || 0) + duration;
          dailyCategoryTotalsMap.set(eventDate, categoryTotals);
        }
      }

      dailyTotalsMap.forEach((total_seconds, date) => {
        dailyTotalsForAnomaly.push({ date, total_seconds });
      });
      dailyCategoryTotalsMap.forEach((categories, date) => {
        dailyCategoryTotalsForBehavioral.push({ date, categories });
      });

      if (dailyTotalsForAnomaly.length > 0) {
        const anomalies = await this.anomalyService.detectAnomalies(dailyTotalsForAnomaly);
        if (anomalies.anomalies.length > 0) {
          confidenceScore -= anomalies.anomalies.length * 2; // Lose 2 points per anomaly
          rationale += ' Son aktivitede anormallikler tespit edildi.';
        }
      }

      if (dailyCategoryTotalsForBehavioral.length > 0) {
        // Mock behavioral trends since the service method is deprecated
        const mockBehavioralTrends = {
          trending_categories: [
            { category: 'coding', trend: 'stable' as const, slope_per_day: 0.0 },
          ],
        };
        if (
          mockBehavioralTrends.trending_categories.some(
            (t: { trend: string; category: string }) =>
              t.trend === 'falling' && t.category === 'coding'
          )
        ) {
          estimatedRemainingDuration *= 1.05; // Slightly slower if coding is falling
          rationale += ' Kodlama aktivitelerinde düşüş trendi var.';
        }
      }
    }

    // Simple linear projection (placeholder for a real ML model)
    const daysSinceStart = (Date.now() - project.start_date) / (1000 * 60 * 60 * 24);
    let predictedDaysToCompletion = 0;

    if (project.total_tracked_duration > 0 && progressPercentage > 0) {
      const totalProjectedDuration = project.total_tracked_duration / (progressPercentage / 100);
      const remainingDuration = totalProjectedDuration - project.total_tracked_duration;
      // Assume average daily work from historical data or a fixed rate
      const averageDailyWorkSeconds =
        project.total_tracked_duration / daysSinceStart || 8 * 60 * 60; // 8 hours if no data
      predictedDaysToCompletion = remainingDuration / averageDailyWorkSeconds;
    } else if (project.due_date) {
      // If no progress, base on due date and past average work rate
      const daysUntilDue = (project.due_date - Date.now()) / (1000 * 60 * 60 * 24);
      predictedDaysToCompletion = daysUntilDue; // Simplistic: assume due date is the target
      rationale += ' İlerleme olmadığı için bitiş tarihi hedef olarak alındı.';
    } else {
      // Fallback: Default estimated duration if no data
      predictedDaysToCompletion = 30; // Assume 30 days for new projects
      rationale += ' Yeterli veri olmadığı için varsayılan bir tamamlama süresi kullanıldı.';
      confidenceScore = 50;
    }

    const estimatedCompletionDate = Date.now() + predictedDaysToCompletion * 1000 * 60 * 60 * 24;

    return {
      estimated_completion_date: Math.round(estimatedCompletionDate),
      confidence_score: Math.max(0, Math.min(100, Math.round(confidenceScore))),
      rationale: rationale,
    };
  }
}
