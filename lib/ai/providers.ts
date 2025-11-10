import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { PrismaClient } from '@prisma/client';
import { decryptAPIKey } from '@/lib/encryption';

const prisma = new PrismaClient();

export type AIProvider = 'openai' | 'google' | 'anthropic' | 'openrouter' | 'kilo';

/**
 * Get user's API key for a specific provider
 */
async function getUserAPIKey(userId: string, provider: string): Promise<string | null> {
  const apiKeyRecord = await prisma.userAPIKey.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  });

  if (!apiKeyRecord) {
    return null;
  }

  // Decrypt the API key
  const decrypted = decryptAPIKey(
    apiKeyRecord.keyEncrypted,
    apiKeyRecord.iv,
    apiKeyRecord.authTag
  );

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
      return await getAIProvider(userId, provider);
    } catch {
      console.warn(`Failed to get user API key for ${provider}, falling back to env vars`);
    }
  }

  // Fallback to environment variables
  const apiKey = getFallbackAPIKey(provider);
  if (!apiKey) {
    throw new Error(`No API key available for provider: ${provider}`);
  }

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
