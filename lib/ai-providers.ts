import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';

export function getAIModel(modelId: string, apiKey?: string) {
  if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3')) {
    const openai = createOpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || '',
    });
    return openai(modelId);
  }
  
  if (modelId.startsWith('gemini')) {
    const google = createGoogleGenerativeAI({
      apiKey: apiKey || process.env.GOOGLE_API_KEY || '',
    });
    return google(modelId);
  }
  
  if (modelId.startsWith('claude')) {
    const anthropic = createAnthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
    });
    return anthropic(modelId);
  }
  
  const openrouter = createOpenAI({
    apiKey: apiKey || process.env.GPT_OSS_KEY || '',
    baseURL: 'https://openrouter.ai/api/v1',
  });
  return openrouter(modelId);
}

import { PrismaClient } from '@prisma/client';

export async function getUserAPIKey(userId: string, provider: string, prisma: PrismaClient) {
  const userKey = await prisma.userAPIKey.findUnique({
    where: {
      userId_provider: {
        userId,
        provider,
      },
    },
  });
  
  return userKey;
}
