import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIInsightService } from '../src/services/ai-insight-service';
import { MLDataPreparationService } from '../src/services/ml-data-preparation-service';
import { LanguageServiceClient } from '@google-cloud/language';

// Mock dependencies
vi.mock('@google-cloud/language');
vi.mock('../src/services/ml-data-preparation-service');

const mockLanguageClient = {
  analyzeSentiment: vi.fn(),
  analyzeEntities: vi.fn()
} as unknown as LanguageServiceClient;

const mockMLDataPreparationService = {
  prepareDataForML: vi.fn()
} as unknown as MLDataPreparationService;

describe('AIInsightService', () => {
  let aiService: AIInsightService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(LanguageServiceClient).mockImplementation(() => mockLanguageClient);
    vi.mocked(mockMLDataPreparationService.prepareDataForML).mockResolvedValue({
      activities: [
        {
          app: 'code.exe',
          title: 'Working on PeakActivity',
          category: 'development'
        }
      ],
      projects: [],
      tasks: []
    });
    aiService = new AIInsightService();
  });

  it('should generate insights successfully', async () => {
    // Mock sentiment analysis
    vi.mocked(mockLanguageClient.analyzeSentiment).mockResolvedValue({
      documentSentiment: {
        score: 0.8,
        magnitude: 1.2
      }
    });

    // Mock entity analysis
    vi.mocked(mockLanguageClient.analyzeEntities).mockResolvedValue({
      entities: [
        {
          name: 'PeakActivity',
          type: 'ORGANIZATION',
          salience: 0.9
        }
      ]
    });

    const result = await aiService.generateInsights('user123', '2024-01-01', '2024-01-07');

    expect(result.summary).toContain('pozitif');
    expect(result.summary).toContain('PeakActivity');
    expect(result.insights).toHaveLength(2);
    expect(result.insights[0]).toContain('Duygu Analizi');
    expect(result.insights[1]).toContain('Varlık Çıkarma');
  });

  it('should handle no activities gracefully', async () => {
    vi.mocked(mockMLDataPreparationService.prepareDataForML).mockResolvedValue({
      activities: [],
      projects: [],
      tasks: []
    });

    const result = await aiService.generateInsights('user123', '2024-01-01', '2024-01-07');

    expect(result.summary).toContain('oluşturulamadı');
    expect(result.insights).toHaveLength(0);
  });

  it('should handle language client error', async () => {
    vi.mocked(mockLanguageClient.analyzeSentiment).mockRejectedValue(new Error('Language service unavailable'));

    await expect(aiService.generateInsights('user123', '2024-01-01', '2024-01-07')).rejects.toThrow();
  });

  it('should process top apps correctly', async () => {
    vi.mocked(mockMLDataPreparationService.prepareDataForML).mockResolvedValue({
      activities: [
        { app: 'code.exe', duration_sec: 3600 },
        { app: 'slack.exe', duration_sec: 1800 },
        { app: 'code.exe', duration_sec: 7200 }
      ],
      projects: [],
      tasks: []
    });

    // Mock sentiment and entity analysis to pass
    vi.mocked(mockLanguageClient.analyzeSentiment).mockResolvedValue({
      documentSentiment: { score: 0.5, magnitude: 1.0 }
    });
    vi.mocked(mockLanguageClient.analyzeEntities).mockResolvedValue({
      entities: []
    });

    const result = await aiService.generateInsights('user123', '2024-01-01', '2024-01-07');

    expect(result.summary).toContain('code.exe');
    expect(result.insights).toContain('Top Uygulama Kullanımı');
  });
});
