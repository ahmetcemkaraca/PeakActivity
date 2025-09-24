import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-1.5-flash'),
});

export class GeminiService {
  async generateInsight(input: string): Promise<string> {
    try {
      const result = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: `Analyze this activity data and provide a productivity insight: ${input}`,
      });
      return result.text();
    } catch (error) {
      console.error('Gemini generation failed:', error);
      throw new Error('Failed to generate insight');
    }
  }

  async classifyActivity(context: string): Promise<{ category: string; confidence: number }> {
    try {
      const result = await ai.generate({
        model: 'gemini-1.5-flash',
        prompt: `Classify this activity context into one of these categories: coding, design, research, social, gaming, productivity, communication, shopping. Context: ${context}. Respond with only the category and confidence score (0-1). Format: category: confidence:`,
      });
      // Parse response, e.g., "coding: 0.85"
      const [category, confidenceStr] = result.text().split(':');
      return {
        category: category.trim(),
        confidence: parseFloat(confidenceStr.trim()) || 0.5,
      };
    } catch (error) {
      console.error('Gemini classification failed:', error);
      return { category: 'unknown', confidence: 0.0 };
    }
  }
}
