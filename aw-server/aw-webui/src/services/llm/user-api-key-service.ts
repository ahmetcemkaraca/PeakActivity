/**
 * User API Key Service
 * Securely manages user API keys in local storage (encrypted)
 */

import { LLMProvider, LLMConfig } from './llm-providers';

// Simple XOR encryption for localStorage (better than plaintext)
// For production, consider using Web Crypto API or a library like CryptoJS
class SimpleEncryption {
  private static SECRET = 'peakactivity-user-key-v1'; // Should be unique per user

  static encrypt(text: string): string {
    const secret = this.SECRET;
    let encrypted = '';

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length);
      encrypted += String.fromCharCode(charCode);
    }

    return btoa(encrypted); // Base64 encode
  }

  static decrypt(encrypted: string): string {
    try {
      const decoded = atob(encrypted);
      const secret = this.SECRET;
      let decrypted = '';

      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ secret.charCodeAt(i % secret.length);
        decrypted += String.fromCharCode(charCode);
      }

      return decrypted;
    } catch {
      return '';
    }
  }
}

export class UserApiKeyService {
  private readonly STORAGE_PREFIX = 'peak_llm_';
  private readonly CONFIG_KEY = 'peak_llm_config';

  /**
   * Save API key for a provider (encrypted)
   */
  async saveApiKey(provider: LLMProvider, apiKey: string): Promise<void> {
    if (!apiKey) {
      throw new Error('API key cannot be empty');
    }

    const encrypted = SimpleEncryption.encrypt(apiKey);
    const storageKey = `${this.STORAGE_PREFIX}${provider}`;

    try {
      localStorage.setItem(storageKey, encrypted);
    } catch (error) {
      throw new Error('Failed to save API key. Please check browser settings.');
    }
  }

  /**
   * Get API key for a provider (decrypted)
   */
  async getApiKey(provider: LLMProvider): Promise<string | null> {
    const storageKey = `${this.STORAGE_PREFIX}${provider}`;

    try {
      const encrypted = localStorage.getItem(storageKey);
      if (!encrypted) return null;

      return SimpleEncryption.decrypt(encrypted);
    } catch {
      return null;
    }
  }

  /**
   * Remove API key for a provider
   */
  async removeApiKey(provider: LLMProvider): Promise<void> {
    const storageKey = `${this.STORAGE_PREFIX}${provider}`;
    localStorage.removeItem(storageKey);
  }

  /**
   * Check if API key exists for provider
   */
  hasApiKey(provider: LLMProvider): boolean {
    const storageKey = `${this.STORAGE_PREFIX}${provider}`;
    return localStorage.getItem(storageKey) !== null;
  }

  /**
   * Get all configured providers
   */
  getConfiguredProviders(): LLMProvider[] {
    const providers: LLMProvider[] = [];
    const possibleProviders: LLMProvider[] = ['openai', 'anthropic', 'google', 'local'];

    for (const provider of possibleProviders) {
      if (this.hasApiKey(provider)) {
        providers.push(provider);
      }
    }

    // Server is always available
    providers.push('server');

    return providers;
  }

  /**
   * Save LLM configuration
   */
  saveLLMConfig(config: LLMConfig): void {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save LLM config:', error);
    }
  }

  /**
   * Get LLM configuration
   */
  getLLMConfig(): LLMConfig | null {
    try {
      const config = localStorage.getItem(this.CONFIG_KEY);
      return config ? JSON.parse(config) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear all API keys and configuration
   */
  clearAll(): void {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(this.STORAGE_PREFIX) || key === this.CONFIG_KEY) {
        localStorage.removeItem(key);
      }
    }
  }

  /**
   * Export API keys (for backup - returns encrypted data)
   */
  exportKeys(): Record<string, string> {
    const exported: Record<string, string> = {};
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        const provider = key.replace(this.STORAGE_PREFIX, '');
        exported[provider] = localStorage.getItem(key) || '';
      }
    }

    return exported;
  }

  /**
   * Import API keys (from backup - expects encrypted data)
   */
  importKeys(keys: Record<string, string>): void {
    for (const [provider, encrypted] of Object.entries(keys)) {
      const storageKey = `${this.STORAGE_PREFIX}${provider}`;
      localStorage.setItem(storageKey, encrypted);
    }
  }

  /**
   * Mask API key for display (show only first/last few characters)
   */
  maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '••••••••';

    const first = apiKey.substring(0, 4);
    const last = apiKey.substring(apiKey.length - 4);
    return `${first}••••${last}`;
  }
}
