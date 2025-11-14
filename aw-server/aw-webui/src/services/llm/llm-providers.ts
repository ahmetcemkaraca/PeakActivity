/**
 * Client-Side LLM Provider System
 * Allows users to use their own API keys for privacy and cost control
 */

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'local' | 'server';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string; // User's own API key (stored encrypted locally)
  model: string;
  baseUrl?: string; // For local/custom deployments
  temperature?: number;
  maxTokens?: number;
  useServerFallback?: boolean; // Fallback to server if client fails
}

export interface LLMProviderInfo {
  id: LLMProvider;
  name: string;
  requiresApiKey: boolean;
  models: Array<{
    id: string;
    name: string;
    contextWindow: number;
    costPer1kTokens?: number;
  }>;
  setupInstructions: string;
  privacyLevel: 'full' | 'partial' | 'server';
}

export const LLM_PROVIDERS: Record<LLMProvider, LLMProviderInfo> = {
  openai: {
    id: 'openai',
    name: 'OpenAI (GPT)',
    requiresApiKey: true,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, costPer1kTokens: 0.005 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000, costPer1kTokens: 0.00015 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextWindow: 128000, costPer1kTokens: 0.01 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextWindow: 16385, costPer1kTokens: 0.0005 }
    ],
    setupInstructions: 'Get your API key from https://platform.openai.com/api-keys',
    privacyLevel: 'full'
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    requiresApiKey: true,
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000, costPer1kTokens: 0.003 },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, costPer1kTokens: 0.0008 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextWindow: 200000, costPer1kTokens: 0.015 }
    ],
    setupInstructions: 'Get your API key from https://console.anthropic.com/settings/keys',
    privacyLevel: 'full'
  },
  google: {
    id: 'google',
    name: 'Google (Gemini)',
    requiresApiKey: true,
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', contextWindow: 1000000, costPer1kTokens: 0 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextWindow: 2000000, costPer1kTokens: 0.00125 },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextWindow: 1000000, costPer1kTokens: 0.000075 },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B', contextWindow: 1000000, costPer1kTokens: 0.0000375 }
    ],
    setupInstructions: 'Get your API key from https://aistudio.google.com/app/apikey',
    privacyLevel: 'full'
  },
  local: {
    id: 'local',
    name: 'Local Model (Ollama/LM Studio)',
    requiresApiKey: false,
    models: [
      { id: 'llama3.2', name: 'Llama 3.2', contextWindow: 128000, costPer1kTokens: 0 },
      { id: 'mistral', name: 'Mistral', contextWindow: 32000, costPer1kTokens: 0 },
      { id: 'phi3', name: 'Phi-3', contextWindow: 128000, costPer1kTokens: 0 },
      { id: 'custom', name: 'Custom Model', contextWindow: 0, costPer1kTokens: 0 }
    ],
    setupInstructions: 'Install Ollama from https://ollama.ai or LM Studio from https://lmstudio.ai',
    privacyLevel: 'full'
  },
  server: {
    id: 'server',
    name: 'PeakActivity Server (Gemini)',
    requiresApiKey: false,
    models: [
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B (Server)', contextWindow: 1000000, costPer1kTokens: 0 }
    ],
    setupInstructions: 'Uses server-side API key. Limited free tier, subscription for more usage.',
    privacyLevel: 'server'
  }
};

export class LLMProviderManager {
  /**
   * Get available LLM providers
   */
  static getProviders(): LLMProviderInfo[] {
    return Object.values(LLM_PROVIDERS);
  }

  /**
   * Get specific provider info
   */
  static getProvider(providerId: LLMProvider): LLMProviderInfo | null {
    return LLM_PROVIDERS[providerId] || null;
  }

  /**
   * Validate API key format (basic validation)
   */
  static validateApiKey(provider: LLMProvider, apiKey: string): boolean {
    if (!apiKey) return false;

    switch (provider) {
      case 'openai':
        return apiKey.startsWith('sk-') && apiKey.length > 20;
      case 'anthropic':
        return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
      case 'google':
        return apiKey.length > 20; // No specific prefix
      case 'local':
        return true; // No API key needed
      case 'server':
        return true; // Uses server key
      default:
        return false;
    }
  }

  /**
   * Check if provider requires API key
   */
  static requiresApiKey(provider: LLMProvider): boolean {
    return LLM_PROVIDERS[provider]?.requiresApiKey || false;
  }

  /**
   * Get recommended model for provider
   */
  static getRecommendedModel(provider: LLMProvider): string {
    const providerInfo = LLM_PROVIDERS[provider];
    if (!providerInfo || providerInfo.models.length === 0) {
      return '';
    }

    // Return the second model (usually best balance of cost/performance)
    return providerInfo.models[1]?.id || providerInfo.models[0].id;
  }

  /**
   * Estimate cost for analysis
   */
  static estimateCost(
    provider: LLMProvider,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const providerInfo = LLM_PROVIDERS[provider];
    if (!providerInfo) return 0;

    const modelInfo = providerInfo.models.find(m => m.id === model);
    if (!modelInfo || !modelInfo.costPer1kTokens) return 0;

    const totalTokens = inputTokens + outputTokens;
    return (totalTokens / 1000) * modelInfo.costPer1kTokens;
  }
}
