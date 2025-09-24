import { logger } from 'firebase-functions';

interface PerformanceMetric {
  metricName: string;
  value: number;
  unit: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

export class MonitoringService {
  static async logPerformance(metric: PerformanceMetric): Promise<void> {
    try {
      logger.info('Performance metric logged', {
        metricName: metric.metricName,
        value: metric.value,
        unit: metric.unit,
        timestamp: new Date(metric.timestamp).toISOString(),
        userId: metric.userId,
        sessionId: metric.sessionId,
      });
      // In production, send to monitoring service like Sentry or Datadog
    } catch (error) {
      logger.error('Failed to log performance metric', { error: error.message });
    }
  }

  static async logError(error: Error, context: { userId?: string; sessionId?: string }): Promise<void> {
    logger.error('Error logged', {
      error: error.message,
      stack: error.stack,
      userId: context.userId,
      sessionId: context.sessionId,
    });
    // In production, send to error tracking service
  }

  static async trackA/BTest(userId: string, variant: string, metric: string, value: number): Promise<void> {
    logger.info('A/B test tracked', {
      userId,
      variant,
      metric,
      value,
    });
    // Store in Firestore for analysis
  }
}
