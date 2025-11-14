/**
 * Server-Side AI Analysis API (Fallback)
 * Provides AI analysis when user doesn't have their own API key
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { requireAuth } from '../middlewares/requireAuth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const geminiApiKey = defineSecret('GEMINI_API_KEY');
const db = getFirestore();

// Subscription tier limits
const SUBSCRIPTION_LIMITS = {
  free: {
    monthlyAnalyses: 50,
    monthlyTokens: 100000,
    maxTokensPerRequest: 2000,
    rateLimit: 10 // requests per hour
  },
  premium: {
    monthlyAnalyses: 500,
    monthlyTokens: 1000000,
    maxTokensPerRequest: 4000,
    rateLimit: 100
  },
  pro: {
    monthlyAnalyses: 5000,
    monthlyTokens: 10000000,
    maxTokensPerRequest: 8000,
    rateLimit: 1000
  }
};

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

    // Check user's subscription tier and limits
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const subscriptionTier = userData?.subscription?.tier || 'free';
    const limits = SUBSCRIPTION_LIMITS[subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS] || SUBSCRIPTION_LIMITS.free;

    // Check rate limiting
    const rateLimitKey = `ai_rate_limit:${userId}`;
    const rateLimitDoc = await db.collection('rate_limits').doc(rateLimitKey).get();
    const rateLimitData = rateLimitDoc.data();
    
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    if (rateLimitData && rateLimitData.timestamp > oneHourAgo) {
      if (rateLimitData.count >= limits.rateLimit) {
        throw new HttpsError(
          'resource-exhausted',
          `Rate limit exceeded. Maximum ${limits.rateLimit} requests per hour allowed.`
        );
      }
    }

    // Get current month's usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageDoc = await db
      .collection('users')
      .doc(userId)
      .collection('ai_usage')
      .doc(currentMonth)
      .get();
    
    const currentUsage = usageDoc.data() || { analyses: 0, tokens: 0 };

    // Check monthly limits
    if (currentUsage.analyses >= limits.monthlyAnalyses) {
      throw new HttpsError(
        'resource-exhausted',
        `Monthly analysis limit reached. Upgrade your plan for more analyses.`
      );
    }

    if (currentUsage.tokens >= limits.monthlyTokens) {
      throw new HttpsError(
        'resource-exhausted',
        `Monthly token limit reached. Upgrade your plan for more tokens.`
      );
    }

    // Validate max tokens per request
    if (data.maxTokens && data.maxTokens > limits.maxTokensPerRequest) {
      throw new HttpsError(
        'invalid-argument',
        `Maximum ${limits.maxTokensPerRequest} tokens per request allowed for your plan.`
      );
    }

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
        const error: any = await response.json();
        logger.error('Gemini API error:', error);
        throw new HttpsError('internal', `AI analysis failed: ${error.error?.message || 'Unknown error'}`);
      }

      const result: any = await response.json();
      const processingTime = Date.now() - startTime;

      // Extract text from response
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Try to extract structured data
      let structuredData: any = null;
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

      // Update usage tracking
      await updateUsageTracking(userId, tokensUsed.total, currentMonth);

      // Update rate limiting
      await updateRateLimiting(userId, rateLimitKey, now);

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
 * Update usage tracking in Firestore
 */
async function updateUsageTracking(userId: string, tokensUsed: number, currentMonth: string): Promise<void> {
  const usageRef = db
    .collection('users')
    .doc(userId)
    .collection('ai_usage')
    .doc(currentMonth);

  await usageRef.set({
    analyses: FieldValue.increment(1),
    tokens: FieldValue.increment(tokensUsed),
    lastUpdated: Timestamp.now()
  }, { merge: true });

  // Also update aggregate stats
  await db.collection('users').doc(userId).set({
    ai_stats: {
      totalAnalyses: FieldValue.increment(1),
      totalTokens: FieldValue.increment(tokensUsed),
      lastAnalysis: Timestamp.now()
    }
  }, { merge: true });
}

/**
 * Update rate limiting counter
 */
async function updateRateLimiting(userId: string, rateLimitKey: string, timestamp: number): Promise<void> {
  const rateLimitRef = db.collection('rate_limits').doc(rateLimitKey);
  const rateLimitDoc = await rateLimitRef.get();
  const rateLimitData = rateLimitDoc.data();
  
  const oneHourAgo = timestamp - 60 * 60 * 1000;
  
  if (!rateLimitData || rateLimitData.timestamp < oneHourAgo) {
    // Reset counter for new hour
    await rateLimitRef.set({
      count: 1,
      timestamp,
      userId
    });
  } else {
    // Increment counter
    await rateLimitRef.update({
      count: FieldValue.increment(1),
      timestamp
    });
  }
}

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

    // Get user subscription tier
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const subscriptionTier = userData?.subscription?.tier || 'free';
    const limits = SUBSCRIPTION_LIMITS[subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS] || SUBSCRIPTION_LIMITS.free;

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usageDoc = await db
      .collection('users')
      .doc(userId)
      .collection('ai_usage')
      .doc(currentMonth)
      .get();
    
    const currentUsage = usageDoc.data() || { analyses: 0, tokens: 0 };

    // Get total usage from aggregate stats
    const totalStats = userData?.ai_stats || {
      totalAnalyses: 0,
      totalTokens: 0
    };

    // Calculate approximate cost (Gemini pricing)
    const costPerMillionTokens = 0.075; // $0.075 per 1M tokens for Gemini Flash
    const totalCost = (totalStats.totalTokens / 1000000) * costPerMillionTokens;
    const monthCost = (currentUsage.tokens / 1000000) * costPerMillionTokens;

    return {
      success: true,
      stats: {
        totalAnalyses: totalStats.totalAnalyses,
        totalTokens: totalStats.totalTokens,
        totalCost: Math.round(totalCost * 100) / 100,
        thisMonth: {
          analyses: currentUsage.analyses,
          tokens: currentUsage.tokens,
          cost: Math.round(monthCost * 100) / 100
        },
        limits: {
          tier: subscriptionTier,
          monthlyAnalyses: limits.monthlyAnalyses,
          monthlyTokens: limits.monthlyTokens,
          remainingAnalyses: Math.max(0, limits.monthlyAnalyses - currentUsage.analyses),
          remainingTokens: Math.max(0, limits.monthlyTokens - currentUsage.tokens),
          rateLimit: limits.rateLimit
        }
      }
    };
  }
);
