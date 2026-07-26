import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { db } from '@/lib/db/connection';
import { userAPIKeys } from '@/lib/db/schema/tasky';
import { decryptAPIKey } from '@/lib/encryption';
import { and, eq } from 'drizzle-orm';

export type AIProvider = 'openai' | 'google' | 'anthropic' | 'openrouter' | 'kilo';

/**
 * Get user's API key for a specific provider
 */
async function getUserAPIKey(userId: string, provider: string): Promise<string | null> {
  console.log(`[getUserAPIKey] Fetching API key for user: ${userId}, provider: ${provider}`);

  const [apiKeyRecord] = await db
    .select({
      key_encrypted: userAPIKeys.keyEncrypted,
      iv: userAPIKeys.iv,
      auth_tag: userAPIKeys.authTag,
    })
    .from(userAPIKeys)
    .where(and(eq(userAPIKeys.userId, userId), eq(userAPIKeys.provider, provider)))
    .limit(1);

  if (!apiKeyRecord) {
    console.log(`[getUserAPIKey] No API key found for user ${userId}, provider ${provider}`);
    return null;
  }

  // Decrypt the API key
  const decrypted = decryptAPIKey(
    apiKeyRecord.key_encrypted,
    apiKeyRecord.iv,
    apiKeyRecord.auth_tag
  );

  console.log(`[getUserAPIKey] Successfully decrypted API key for ${provider}`);
  return decrypted;
}

/**
 * Get AI provider instance configured with user's API key
 */
export async function getAIProvider(userId: string, provider: AIProvider) {
  const apiKey = await getUserAPIKey(userId, provider);

  if (!apiKey) {
    throw new Error(`No API key found for provider: ${provider}`);
  }

  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey });

    case 'google':
      return createGoogleGenerativeAI({ apiKey });

    case 'anthropic':
      return createAnthropic({ apiKey });

    case 'openrouter':
      // OpenRouter uses OpenAI-compatible API
      return createOpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });

    case 'kilo':
      // Kilo uses OpenAI-compatible API
      return createOpenAI({
        apiKey,
        baseURL: process.env.KILO_BASE_URL || 'https://api.kilo.ai/v1',
      });

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Get fallback API key from environment variables
 */
export function getFallbackAPIKey(provider: AIProvider): string | undefined {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'google':
      return process.env.GOOGLE_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'openrouter':
      return process.env.OPENROUTER_API_KEY;
    case 'kilo':
      return process.env.KILO_API_KEY;
    default:
      return undefined;
  }
}

/**
 * Get AI provider with fallback to environment variables
 */
export async function getAIProviderWithFallback(userId: string | undefined, provider: AIProvider) {
  // Try to get user's API key first
  if (userId) {
    try {
      console.log(`[getAIProviderWithFallback] Attempting to get user API key for ${provider}`);
      const result = await getAIProvider(userId, provider);
      console.log(`[getAIProviderWithFallback] Successfully got user API key for ${provider}`);
      return result;
    } catch (error) {
      console.warn(`[getAIProviderWithFallback] Failed to get user API key for ${provider}, falling back to env vars. Error:`, error);
    }
  } else {
    console.log(`[getAIProviderWithFallback] No userId provided, using env vars for ${provider}`);
  }

  // Fallback to environment variables
  const apiKey = getFallbackAPIKey(provider);
  if (!apiKey) {
    throw new Error(`No API key available for provider: ${provider}`);
  }

  console.log(`[getAIProviderWithFallback] Using fallback env API key for ${provider}`);

  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey });

    case 'google':
      return createGoogleGenerativeAI({ apiKey });

    case 'anthropic':
      return createAnthropic({ apiKey });

    case 'openrouter':
      return createOpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
      });

    case 'kilo':
      return createOpenAI({
        apiKey,
        baseURL: process.env.KILO_BASE_URL || 'https://api.kilo.ai/v1',
      });

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
