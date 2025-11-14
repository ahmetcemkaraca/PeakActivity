/**
 * Server-Side AI Analysis API (Fallback)
 * Provides AI analysis when user doesn't have their own API key
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { requireAuth } from '../middlewares/requireAuth';

const geminiApiKey = defineSecret('GEMINI_API_KEY');

interface AIAnalysisRequest {
  type: 'focus_analysis' | 'productivity_report' | 'behavior_patterns' | 'anomaly_detection' | 'goal_suggestions' | 'custom';
  data: any;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Analyze data using server-side AI (Gemini)
 * This is a fallback when users don't have their own API keys
 */
export const analyzeWithAI = onCall(
  {
    secrets: [geminiApiKey],
    enforceAppCheck: true,
    timeoutSeconds: 60,
    memory: '256MiB'
  },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;
    const data = request.data as AIAnalysisRequest;

    // Validate input
    if (!data.type || !data.prompt) {
      throw new HttpsError('invalid-argument', 'Analysis type and prompt are required');
    }

    // TODO: Check user's subscription tier and rate limiting
    // For now, allow all authenticated users

    const startTime = Date.now();

    try {
      // Call Google AI (Gemini) API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${geminiApiKey.value()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: data.prompt }]
            }],
            systemInstruction: {
              parts: [{
                text: data.systemPrompt || 'You are a helpful AI assistant for productivity analysis. Respond in Turkish.'
              }]
            },
            generationConfig: {
              temperature: data.temperature ?? 0.7,
              maxOutputTokens: data.maxTokens ?? 2000
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error('Gemini API error:', error);
        throw new HttpsError('internal', `AI analysis failed: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      const processingTime = Date.now() - startTime;

      // Extract text from response
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Try to extract structured data
      let structuredData = null;
      try {
        const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) ||
                         generatedText.match(/```\s*([\s\S]*?)\s*```/);

        if (jsonMatch) {
          structuredData = JSON.parse(jsonMatch[1]);
        } else {
          structuredData = JSON.parse(generatedText);
        }
      } catch {
        // Not JSON, that's okay
      }

      // Calculate token usage
      const tokensUsed = {
        input: result.usageMetadata?.promptTokenCount || 0,
        output: result.usageMetadata?.candidatesTokenCount || 0,
        total: result.usageMetadata?.totalTokenCount || 0
      };

      logger.info('AI analysis completed', {
        userId,
        type: data.type,
        tokensUsed: tokensUsed.total,
        processingTime
      });

      return {
        success: true,
        result: generatedText,
        structuredData,
        tokensUsed,
        processingTime,
        metadata: {
          provider: 'server',
          model: 'gemini-1.5-flash-8b',
          processedLocally: false
        }
      };

    } catch (error: any) {
      logger.error('AI analysis error', {
        userId,
        type: data.type,
        error: error.message
      });

      throw new HttpsError('internal', `AI analysis failed: ${error.message}`);
    }
  }
);

/**
 * Get AI usage statistics for the user
 */
export const getAIUsageStats = onCall(
  {
    enforceAppCheck: true
  },
  async (request) => {
    requireAuth(request);

    const userId = request.auth!.uid;

    // TODO: Implement actual usage tracking in Firestore
    // For now, return mock data

    return {
      success: true,
      stats: {
        totalAnalyses: 0,
        totalTokens: 0,
        totalCost: 0,
        thisMonth: {
          analyses: 0,
          tokens: 0,
          cost: 0
        },
        limits: {
          freeMonthlyAnalyses: 50,
          freeMonthlyTokens: 100000,
          remainingAnalyses: 50,
          remainingTokens: 100000
        }
      }
    };
  }
);
