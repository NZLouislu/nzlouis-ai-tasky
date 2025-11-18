/**
 * API Key Storage
 * Handles storing and retrieving API keys for different providers
 */

// Store API keys in memory (in a real app, use secure storage)
const apiKeys: Record<string, string> = {
  openai: '',
  google: '',
  anthropic: ''
};

export function setApiKey(provider: string, key: string): void {
  apiKeys[provider] = key;
}

export function getApiKey(provider: string): string | null {
  return apiKeys[provider] || null;
}