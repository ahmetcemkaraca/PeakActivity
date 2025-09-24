import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnomalyDetectionService, detectAnomaliesFlow } from '../src/services/anomaly-detection-service';
import { genkitInstance } from '../src/index';

// Mock GenKit for testing
vi.mock('@genkit-ai/googleai', () => ({
  googleAI: {
    model: vi.fn(() => ({
      generate: vi.fn()
    }))
  }
}));

describe('AnomalyDetectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateMean', () => {
    it('should calculate the mean of an array of numbers', () => {
      const data = [1, 2, 3, 4, 5];
      const mean = AnomalyDetectionService.calculateMean(data);
      expect(mean).toBe(3);
    });

    it('should handle empty array', () => {
      const data: number[] = [];
      expect(() => AnomalyDetectionService.calculateMean(data)).toThrow();
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should calculate standard deviation correctly', () => {
      const data = [1, 2, 3, 4, 5];
      const mean = AnomalyDetectionService.calculateMean(data);
      const stdDev = AnomalyDetectionService.calculateStandardDeviation(data, mean);
      expect(stdDev).toBeCloseTo(1.5811, 4);
    });

    it('should handle single value array', () => {
      const data = [5];
      const mean = AnomalyDetectionService.calculateMean(data);
      const stdDev = AnomalyDetectionService.calculateStandardDeviation(data, mean);
      expect(stdDev).toBe(0);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies with sufficient data', async () => {
      const dailyTotals = [
        { date: '2024-01-01', total_seconds: 28800 },
        { date: '2024-01-02', total_seconds: 30000 },
        { date: '2024-01-03', total_seconds: 25000 },
        { date: '2024-01-04', total_seconds: 32000 },
        { date: '2024-01-05', total_seconds: 40000 }, // Anomaly
        { date: '2024-01-06', total_seconds: 29000 }
      ];

      // Mock GenKit generate
      vi.spyOn(genkitInstance, 'generate').mockResolvedValue({
        text: 'AI analysis: One anomaly detected on 2024-01-05 due to unusually high activity.'
      } as any);

      const service = new AnomalyDetectionService();
      const result = await service.detectAnomalies(dailyTotals);

      expect(result.anomalies).toHaveLength(1);
      expect(result.anomalies[0].date).toBe('2024-01-05');
      expect(result.anomalies[0].is_anomaly).toBe(true);
      expect(result.baseline_mean).toBeDefined();
      expect(result.baseline_stddev).toBeDefined();
      expect(result.explanation).toContain('AI analysis');
    });

    it('should return no anomalies with insufficient data', async () => {
      const dailyTotals = [
        { date: '2024-01-01', total_seconds: 28800 },
        { date: '2024-01-02', total_seconds: 30000 }
      ];

      // Mock GenKit
      vi.spyOn(genkitInstance, 'generate').mockResolvedValue({
        text: 'Insufficient data for analysis.'
      } as any);

      const service = new AnomalyDetectionService();
      const result = await service.detectAnomalies(dailyTotals);

      expect(result.anomalies).toHaveLength(0);
      expect(result.explanation).toContain('yeterli veri yok');
    });

    it('should handle GenKit error gracefully', async () => {
      const dailyTotals = [
        { date: '2024-01-01', total_seconds: 28800 },
        { date: '2024-01-02', total_seconds: 30000 },
        { date: '2024-01-03', total_seconds: 25000 },
        { date: '2024-01-04', total_seconds: 32000 },
        { date: '2024-01-05', total_seconds: 40000 }
      ];

      // Mock GenKit to throw error
      vi.spyOn(genkitInstance, 'generate').mockRejectedValue(new Error('AI service unavailable'));

      const service = new AnomalyDetectionService();
      const result = await service.detectAnomalies(dailyTotals);

      expect(result.anomalies).toHaveLength(1); // Still detects statistical anomaly
      expect(result.explanation).toContain('hata oluştu');
    });
  });

  describe('getAnomalyAlerts', () => {
    it('should fetch anomaly alerts from Firestore', async () => {
      // Mock Firestore
      const mockSnapshot = {
        docs: [
          {
            data: () => ({
              date: '2024-01-05',
              is_anomaly: true,
              anomaly_score: 0.85,
              deviation_percent: 25.5,
              explanation: 'High activity detected'
            })
          }
        ]
      };

      vi.spyOn(db.collection('users/test-user/anomalyAlerts'), 'orderBy').mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot)
        })
      } as any);

      const service = new AnomalyDetectionService();
      const alerts = await service.getAnomalyAlerts('test-user');

      expect(alerts).toHaveLength(1);
      expect(alerts[0].date).toBe('2024-01-05');
      expect(alerts[0].is_anomaly).toBe(true);
    });

    it('should handle empty alerts collection', async () => {
      const mockSnapshot = { docs: [] };

      vi.spyOn(db.collection('users/test-user/anomalyAlerts'), 'orderBy').mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockSnapshot)
        })
      } as any);

      const service = new AnomalyDetectionService();
      const alerts = await service.getAnomalyAlerts('test-user');

      expect(alerts).toHaveLength(0);
    });
  });

  describe('detectAnomaliesFlow', () => {
    it('should validate input schema', async () => {
      const invalidInput = { dailyTotals: 'invalid' };

      await expect(detectAnomaliesFlow(invalidInput as any)).rejects.toThrow();
    });

    it('should return correct output schema', async () => {
      const validInput = { 
        dailyTotals: [
          { date: '2024-01-01', total_seconds: 28800 }
        ] 
      };

      // Mock generate to avoid actual AI call
      vi.spyOn(genkitInstance, 'generate').mockResolvedValue({
        text: 'Test explanation'
      } as any);

      const result = await detectAnomaliesFlow(validInput);

      expect(result).toHaveProperty('anomalies');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('model_version');
    });
  });
});
