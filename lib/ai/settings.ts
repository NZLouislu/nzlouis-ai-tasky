import { PrismaClient } from '@prisma/client';
import { AIProvider } from './providers';

const prisma = new PrismaClient();

export interface UserAISettings {
  defaultProvider: AIProvider;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

/**
 * Get user's AI settings from database
 */
export async function getUserAISettings(userId: string): Promise<UserAISettings> {
  const settings = await prisma.userAISettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    // Return default settings if not found
    return {
      defaultProvider: 'google',
      defaultModel: 'gemini-2.5-flash',
      temperature: 0.8,
      maxTokens: 1024,
      systemPrompt: 'You are a helpful AI assistant.',
    };
  }

  return {
    defaultProvider: settings.defaultProvider as AIProvider,
    defaultModel: settings.defaultModel,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    systemPrompt: settings.systemPrompt,
  };
}

/**
 * Update user's AI settings
 */
export async function updateUserAISettings(
  userId: string,
  settings: Partial<UserAISettings>
): Promise<UserAISettings> {
  const updated = await prisma.userAISettings.upsert({
    where: { userId },
    update: settings,
    create: {
      userId,
      defaultProvider: settings.defaultProvider || 'google',
      defaultModel: settings.defaultModel || 'gemini-2.5-flash',
      temperature: settings.temperature ?? 0.8,
      maxTokens: settings.maxTokens ?? 1024,
      systemPrompt: settings.systemPrompt || 'You are a helpful AI assistant.',
    },
  });

  return {
    defaultProvider: updated.defaultProvider as AIProvider,
    defaultModel: updated.defaultModel,
    temperature: updated.temperature,
    maxTokens: updated.maxTokens,
    systemPrompt: updated.systemPrompt,
  };
}

/**
 * Get or create default settings for a user
 */
export async function ensureUserAISettings(userId: string): Promise<UserAISettings> {
  const existing = await prisma.userAISettings.findUnique({
    where: { userId },
  });

  if (existing) {
    return {
      defaultProvider: existing.defaultProvider as AIProvider,
      defaultModel: existing.defaultModel,
      temperature: existing.temperature,
      maxTokens: existing.maxTokens,
      systemPrompt: existing.systemPrompt,
    };
  }

  // Create default settings
  const created = await prisma.userAISettings.create({
    data: {
      userId,
      defaultProvider: 'google',
      defaultModel: 'gemini-2.5-flash',
      temperature: 0.8,
      maxTokens: 1024,
      systemPrompt: 'You are a helpful AI assistant.',
    },
  });

  return {
    defaultProvider: created.defaultProvider as AIProvider,
    defaultModel: created.defaultModel,
    temperature: created.temperature,
    maxTokens: created.maxTokens,
    systemPrompt: created.systemPrompt,
  };
}
