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
    // Stable production models (recommended) - Use these first as they have more quota
    'gemini-1.5-flash': 'gemini-1.5-flash',
    'gemini-1.5-pro': 'gemini-1.5-pro',
    'gemini-pro': 'gemini-1.5-pro',
    // Gemini 2.5 and 2.0 models - using OpenAI compatible model names
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.5-flash-live': 'gemini-2.5-flash',
    'gemini-2.0-flash-live': 'gemini-2.0-flash',
    'gemini-2.0-flash-lite': 'gemini-2.0-flash',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-2.5-flash-lite': 'gemini-2.5-flash',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.5-flash-preview': 'gemini-2.5-flash',
    'gemini-2.0-flash-exp': 'gemini-2.0-flash',
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
    'openai/gpt-oss-20b:free': 'openai/gpt-oss-20b:free',
    'tngtech/deepseek-r1t2-chimera:free': 'tngtech/deepseek-r1t2-chimera:free',
    'tngtech/deepseek-r1t-chimera:free': 'tngtech/deepseek-r1t-chimera:free',
    'deepseek/deepseek-chat-v3-0324:free': 'deepseek/deepseek-chat-v3-0324:free',
    'deepseek/deepseek-r1-0528:free': 'deepseek/deepseek-r1-0528:free',
    'qwen/qwen3-coder:free': 'qwen/qwen3-coder:free',
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
  console.log(`[getModel] Getting model for provider: ${provider}, modelName: ${modelName}, userId: ${userId}`);
  
  const providerInstance = await getAIProviderWithFallback(userId, provider);
  const actualModelName = getActualModelName(provider, modelName);
  
  console.log(`[getModel] Mapped model name: ${modelName} -> ${actualModelName}`);

  // Create model instance based on provider
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (providerInstance as any)(actualModelName);
  
  console.log(`[getModel] Model instance created successfully for ${actualModelName}`);
  
  return model;
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
