import { getClient } from './awclient';

export class AIFeatureService {
  static async fetchAnomalyDetectionInsight(userId: string, timeRange: string): Promise<any> {
    try {
      const client = getClient();
      const response = await client.post('/api/0/ai/anomaly-detection', { userId, timeRange });
      return response.data;
    } catch (error) {
      console.error('Anomali tespiti içgörüsü alınamadı:', error);
      throw error;
    }
  }

  static async fetchBehavioralTrendsInsight(userId: string, timeRange: string): Promise<any> {
    try {
      const client = getClient();
      const response = await client.post('/api/0/ai/behavioral-trends', { userId, timeRange });
      return response.data;
    } catch (error) {
      console.error('Davranışsal eğilimler içgörüsü alınamadı:', error);
      throw error;
    }
  }

  static async fetchFocusQualityScoreInsight(userId: string, timeRange: string): Promise<any> {
    try {
      const client = getClient();
      const response = await client.post('/api/0/ai/focus-quality-score', { userId, timeRange });
      return response.data;
    } catch (error) {
      console.error('Odak kalitesi skoru içgörüsü alınamadı:', error);
      throw error;
    }
  }
}
