import { getAIProviderWithFallback, AIProvider } from './providers';
import { LanguageModel } from 'ai';

export interface ModelConfig {
  provider: AIProvider;
  modelName: string;
}

/**
 * Model mapping for different providers
 */
export const MODEL_MAPPINGS: Record<AIProvider, Record<string, string>> = {
  google: {
    // Stable production models (recommended)
    'gemini-1.5-flash': 'gemini-1.5-flash',
    'gemini-1.5-pro': 'gemini-1.5-pro',
    'gemini-pro': 'gemini-1.5-pro',
    // Gemini 2.5 models - use the exact model name from GEMINI_API_URL
    'gemini-2.5-flash': 'models/gemini-2.5-flash-preview-05-20',
    'gemini-2.5-flash-preview': 'models/gemini-2.5-flash-preview-05-20',
    'gemini-2.5-pro': 'models/gemini-2.5-pro-preview-05-20',
    // Experimental models
    'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp',
  },
  openai: {
    'gpt-4.1': 'gpt-4-turbo',
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'o3-mini': 'o3-mini',
    'o1-mini': 'o1-mini',
  },
  anthropic: {
    'claude-4-opus': 'claude-3-5-sonnet-20241022',
    'claude-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-haiku': 'claude-3-5-haiku-20241022',
  },
  openrouter: {
    'deepseek-r1-free': 'deepseek/deepseek-r1-0528:free',
    'deepseek-v3-free': 'deepseek/deepseek-chat-v3-0324:free',
    'deepseek-r1': 'deepseek/deepseek-r1',
    'deepseek-v3': 'deepseek/deepseek-chat',
  },
  kilo: {
    'xai-grok-code-fast-1': 'xai/grok-beta',
    'claude-sonnet-4': 'anthropic/claude-3-5-sonnet-20241022',
  },
};

/**
 * Get the actual model name for a provider
 */
function getActualModelName(provider: AIProvider, modelName: string): string {
  const mapping = MODEL_MAPPINGS[provider];
  return mapping[modelName] || modelName;
}

/**
 * Get AI model instance
 */
export async function getModel(
  userId: string | undefined,
  provider: AIProvider,
  modelName: string
): Promise<LanguageModel> {
  const providerInstance = await getAIProviderWithFallback(userId, provider);
  const actualModelName = getActualModelName(provider, modelName);

  // Create model instance based on provider
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (providerInstance as any)(actualModelName);
}

/**
 * Get model with configuration
 */
export async function getModelWithConfig(
  userId: string | undefined,
  config: ModelConfig
): Promise<LanguageModel> {
  return getModel(userId, config.provider, config.modelName);
}

/**
 * Validate if a model exists for a provider
 */
export function isValidModel(provider: AIProvider, modelName: string): boolean {
  const mapping = MODEL_MAPPINGS[provider];
  return modelName in mapping || modelName.includes('/');
}

/**
 * Get all available models for a provider
 */
export function getAvailableModels(provider: AIProvider): string[] {
  return Object.keys(MODEL_MAPPINGS[provider]);
}

/**
 * Get default model for a provider
 */
export function getDefaultModel(provider: AIProvider): string {
  const models = getAvailableModels(provider);
  return models[0] || '';
}
