/**
 * Client-Side LLM Service
 * Handles AI analysis locally using user's own API keys
 */

import { LLMConfig, LLMProvider } from './llm-providers';
import { UserApiKeyService } from './user-api-key-service';

export interface AnalysisRequest {
  type: 'focus_analysis' | 'productivity_report' | 'behavior_patterns' | 'anomaly_detection' | 'goal_suggestions' | 'custom';
  data: any;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AnalysisResult {
  success: boolean;
  result?: string;
  structuredData?: any;
  metadata: {
    provider: LLMProvider;
    model: string;
    tokensUsed?: {
      input: number;
      output: number;
      total: number;
    };
    cost?: number;
    processingTime: number;
    processedLocally: boolean;
  };
  error?: string;
}

export class ClientLLMService {
  private config: LLMConfig;
  private apiKeyService: UserApiKeyService;

  constructor(config?: LLMConfig) {
    this.apiKeyService = new UserApiKeyService();
    this.config = config || this.getDefaultConfig();
  }

  /**
   * Get default LLM configuration from user settings
   */
  private getDefaultConfig(): LLMConfig {
    const savedConfig = this.apiKeyService.getLLMConfig();
    return savedConfig || {
      provider: 'server',
      model: 'gemini-1.5-flash-8b',
      temperature: 0.7,
      maxTokens: 2000,
      useServerFallback: true
    };
  }

  /**
   * Update LLM configuration
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
    this.apiKeyService.saveLLMConfig(this.config);
  }

  /**
   * Perform AI analysis using configured LLM
   */
  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      // Check if using client-side processing
      if (this.config.provider !== 'server') {
        const apiKey = await this.apiKeyService.getApiKey(this.config.provider);

        if (!apiKey && this.config.useServerFallback) {
          console.log('No API key found, falling back to server');
          return await this.analyzeOnServer(request, startTime);
        }

        if (!apiKey) {
          throw new Error(`No API key configured for ${this.config.provider}`);
        }

        // Process locally with user's API key
        return await this.analyzeWithProvider(request, apiKey, startTime);
      } else {
        // Use server-side processing
        return await this.analyzeOnServer(request, startTime);
      }
    } catch (error: any) {
      // Fallback to server if configured
      if (this.config.useServerFallback && this.config.provider !== 'server') {
        console.warn('Client-side analysis failed, falling back to server:', error.message);
        return await this.analyzeOnServer(request, startTime);
      }

      return {
        success: false,
        error: error.message,
        metadata: {
          provider: this.config.provider,
          model: this.config.model,
          processingTime: Date.now() - startTime,
          processedLocally: false
        }
      };
    }
  }

  /**
   * Analyze using specific provider (client-side)
   */
  private async analyzeWithProvider(
    request: AnalysisRequest,
    apiKey: string,
    startTime: number
  ): Promise<AnalysisResult> {
    const { provider, model, temperature, maxTokens } = this.config;

    let response: any;
    let tokensUsed = { input: 0, output: 0, total: 0 };

    switch (provider) {
      case 'openai':
        response = await this.callOpenAI(request, apiKey, model, temperature, maxTokens);
        tokensUsed = {
          input: response.usage?.prompt_tokens || 0,
          output: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0
        };
        break;

      case 'anthropic':
        response = await this.callAnthropic(request, apiKey, model, temperature, maxTokens);
        tokensUsed = {
          input: response.usage?.input_tokens || 0,
          output: response.usage?.output_tokens || 0,
          total: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0)
        };
        break;

      case 'google':
        response = await this.callGoogleAI(request, apiKey, model, temperature, maxTokens);
        tokensUsed = {
          input: response.usageMetadata?.promptTokenCount || 0,
          output: response.usageMetadata?.candidatesTokenCount || 0,
          total: response.usageMetadata?.totalTokenCount || 0
        };
        break;

      case 'local':
        response = await this.callLocalModel(request, model, temperature, maxTokens);
        // Local models usually don't return token counts
        break;

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      result: this.extractTextFromResponse(response, provider),
      structuredData: this.extractStructuredData(response, provider),
      metadata: {
        provider,
        model,
        tokensUsed,
        cost: this.calculateCost(provider, model, tokensUsed),
        processingTime,
        processedLocally: true
      }
    };
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    request: AnalysisRequest,
    apiKey: string,
    model: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<any> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: request.systemPrompt || 'You are a helpful AI assistant for productivity analysis.' },
          { role: 'user', content: request.userPrompt }
        ],
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(
    request: AnalysisRequest,
    apiKey: string,
    model: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<any> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: request.userPrompt }
        ],
        system: request.systemPrompt || 'You are a helpful AI assistant for productivity analysis.',
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Call Google AI (Gemini) API
   */
  private async callGoogleAI(
    request: AnalysisRequest,
    apiKey: string,
    model: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<any> {
    const systemInstruction = request.systemPrompt || 'You are a helpful AI assistant for productivity analysis.';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: request.userPrompt }]
          }],
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: temperature ?? 0.7,
            maxOutputTokens: maxTokens ?? 2000
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google AI API error: ${error.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Call local model (Ollama/LM Studio)
   */
  private async callLocalModel(
    request: AnalysisRequest,
    model: string,
    temperature?: number,
    maxTokens?: number
  ): Promise<any> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434'; // Ollama default

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: `${request.systemPrompt || 'You are a helpful AI assistant for productivity analysis.'}\n\n${request.userPrompt}`,
        temperature: temperature ?? 0.7,
        options: {
          num_predict: maxTokens ?? 2000
        },
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Local model error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fallback to server-side analysis
   */
  private async analyzeOnServer(
    request: AnalysisRequest,
    startTime: number
  ): Promise<AnalysisResult> {
    // Import Firebase Functions
    const { functions } = await import('../firebase');
    const { httpsCallable } = await import('firebase/functions');

    const analyzeFunction = httpsCallable(functions, 'analyzeWithAI');

    try {
      const result = await analyzeFunction({
        type: request.type,
        data: request.data,
        prompt: request.userPrompt,
        systemPrompt: request.systemPrompt
      });

      const data = result.data as any;

      return {
        success: true,
        result: data.result,
        structuredData: data.structuredData,
        metadata: {
          provider: 'server',
          model: 'gemini-1.5-flash-8b',
          tokensUsed: data.tokensUsed,
          processingTime: Date.now() - startTime,
          processedLocally: false
        }
      };
    } catch (error: any) {
      throw new Error(`Server analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract text from provider-specific response
   */
  private extractTextFromResponse(response: any, provider: LLMProvider): string {
    switch (provider) {
      case 'openai':
        return response.choices?.[0]?.message?.content || '';
      case 'anthropic':
        return response.content?.[0]?.text || '';
      case 'google':
        return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      case 'local':
        return response.response || '';
      default:
        return '';
    }
  }

  /**
   * Extract structured data if available
   */
  private extractStructuredData(response: any, provider: LLMProvider): any {
    const text = this.extractTextFromResponse(response, provider);

    // Try to parse JSON from response
    try {
      // Look for JSON in markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                       text.match(/```\s*([\s\S]*?)\s*```/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to parse entire response as JSON
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  /**
   * Calculate cost based on token usage
   */
  private calculateCost(
    provider: LLMProvider,
    model: string,
    tokensUsed: { input: number; output: number; total: number }
  ): number {
    // Import provider info
    const { LLM_PROVIDERS } = require('./llm-providers');

    const providerInfo = LLM_PROVIDERS[provider];
    if (!providerInfo) return 0;

    const modelInfo = providerInfo.models.find((m: any) => m.id === model);
    if (!modelInfo || !modelInfo.costPer1kTokens) return 0;

    return (tokensUsed.total / 1000) * modelInfo.costPer1kTokens;
  }
}
