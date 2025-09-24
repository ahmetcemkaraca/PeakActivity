import { describe, it, expect, vi } from 'vitest';
import { AutoCategorizationService, autoCategorizeFlow } from '../src/services/auto-categorization-service';
import { genkitApp } from '../src/index';

// Mock GenKit
vi.mock('@genkit-ai/googleai', () => ({
  googleAI: {
    model: vi.fn(() => ({
      generate: vi.fn()
    }))
  }
}));

describe('AutoCategorizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('categorizeEvents', () => {
    it('should categorize events with keyword matching', async () => {
      const events = [
        {
          app: 'code.exe',
          title: 'Working on TypeScript project',
          url: 'https://github.com/peakactivity'
        },
        {
          app: 'chrome.exe',
          title: 'Stack Overflow - JavaScript help',
          url: 'https://stackoverflow.com/questions/javascript-help'
        }
      ];

      // Mock GenKit generate
      vi.spyOn(genkitApp, 'generate').mockResolvedValue({
        text: 'coding'
      } as any);

      const service = new AutoCategorizationService();
      const result = await service.categorizeEvents(events);

      expect(result.labels).toHaveLength(2);
      expect(result.labels[0].category).toBe('coding');
      expect(result.labels[0].confidence).toBeGreaterThan(0);
    });

    it('should use AI for low confidence cases', async () => {
      const events = [
        {
          app: 'unknown.exe',
          title: 'Unknown activity',
          url: 'https://unknown.com'
        }
      ];

      // Mock GenKit to return a valid category
      vi.spyOn(genkitApp, 'generate').mockResolvedValue({
        text: 'productivity'
      } as any);

      const service = new AutoCategorizationService();
      const result = await service.categorizeEvents(events);

      expect(result.labels[0].category).toBe('productivity');
      expect(result.labels[0].confidence).toBe(0.8);
    });

    it('should handle GenKit error and fallback to uncategorized', async () => {
      const events = [
        {
          app: 'test.exe',
          title: 'Test activity',
          url: 'https://test.com'
        }
      ];

      // Mock GenKit to throw error
      vi.spyOn(genkitApp, 'generate').mockRejectedValue(new Error('AI unavailable'));

      const service = new AutoCategorizationService();
      const result = await service.categorizeEvents(events);

      expect(result.labels[0].category).toBe('uncategorized');
      expect(result.labels[0].confidence).toBe(0.3);
    });
  });

  describe('autoCategorizeFlow', () => {
    it('should validate input schema', async () => {
      const invalidInput = { events: 'invalid' };

      await expect(autoCategorizeFlow(invalidInput as any)).rejects.toThrow();
    });

    it('should return correct output schema', async () => {
      const validInput = { 
        events: [
          { app: 'code.exe', title: 'Test', url: 'https://test.com' }
        ] 
      };

      // Mock generate
      vi.spyOn(genkitApp, 'generate').mockResolvedValue({
        text: 'coding'
      } as any);

      const result = await autoCategorizeFlow(validInput);

      expect(result).toHaveProperty('labels');
      expect(result.labels).toHaveLength(1);
    });
  });
});
