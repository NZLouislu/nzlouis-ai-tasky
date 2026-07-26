import { db } from '@/lib/db/connection';
import { userAISettings } from '@/lib/db/schema/tasky';
import { AIProvider } from './providers';
import { eq } from 'drizzle-orm';

export interface UserAISettings {
  defaultProvider: AIProvider;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export async function getUserAISettings(userId: string): Promise<UserAISettings> {
  const [settings] = await db
    .select()
    .from(userAISettings)
    .where(eq(userAISettings.userId, userId))
    .limit(1);

  if (!settings) {
    console.warn(`⚠️ No AI settings found for user ${userId}, using defaults`);
    return {
      defaultProvider: 'google',
      defaultModel: 'gemini-3-flash-preview',
      temperature: 0.8,
      maxTokens: 4096,
      systemPrompt: 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, please use Markdown tables for better readability.',
    };
  }

  return {
    defaultProvider: settings.defaultProvider as AIProvider,
    defaultModel: settings.defaultModel,
    temperature: settings.temperature / 10,
    maxTokens: settings.maxTokens === 1024 ? 4096 : settings.maxTokens,
    systemPrompt: settings.systemPrompt,
  };
}

export async function updateUserAISettings(
  userId: string,
  settings: Partial<UserAISettings>
): Promise<UserAISettings> {
  const [updated] = await db
    .insert(userAISettings)
    .values({
      userId,
      defaultProvider: settings.defaultProvider || 'google',
      defaultModel: settings.defaultModel || 'gemini-3-flash-preview',
      temperature: settings.temperature !== undefined ? Math.round(settings.temperature * 10) : 8,
      maxTokens: settings.maxTokens ?? 4096,
      systemPrompt: settings.systemPrompt || 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, please use Markdown tables for better readability.',
    })
    .onConflictDoUpdate({
      target: userAISettings.userId,
      set: {
        defaultProvider: settings.defaultProvider || 'google',
        defaultModel: settings.defaultModel || 'gemini-3-flash-preview',
        temperature: settings.temperature !== undefined ? Math.round(settings.temperature * 10) : 8,
        maxTokens: settings.maxTokens ?? 4096,
        systemPrompt: settings.systemPrompt || 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, please use Markdown tables for better readability.',
      },
    })
    .returning();

  if (!updated) {
    throw new Error('Failed to update AI settings');
  }

  return {
    defaultProvider: updated.defaultProvider as AIProvider,
    defaultModel: updated.defaultModel,
    temperature: updated.temperature / 10,
    maxTokens: updated.maxTokens,
    systemPrompt: updated.systemPrompt,
  };
}

export async function ensureUserAISettings(userId: string): Promise<UserAISettings> {
  const [existing] = await db
    .select()
    .from(userAISettings)
    .where(eq(userAISettings.userId, userId))
    .limit(1);

  if (existing) {
    return {
      defaultProvider: existing.defaultProvider as AIProvider,
      defaultModel: existing.defaultModel,
      temperature: existing.temperature / 10,
      maxTokens: existing.maxTokens,
      systemPrompt: existing.systemPrompt,
    };
  }

  const [created] = await db
    .insert(userAISettings)
    .values({
      userId,
      defaultProvider: 'google',
      defaultModel: 'gemini-3-flash-preview',
      temperature: 8,
      maxTokens: 4096,
      systemPrompt: 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, please use Markdown tables for better readability.',
    })
    .returning();

  if (!created) {
    console.error('Failed to create AI settings for user:', userId);
    return {
      defaultProvider: 'google',
      defaultModel: 'gemini-3-flash-preview',
      temperature: 0.8,
      maxTokens: 4096,
      systemPrompt: 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, please use Markdown tables for better readability.',
    };
  }

  return {
    defaultProvider: created.defaultProvider as AIProvider,
    defaultModel: created.defaultModel,
    temperature: created.temperature / 10,
    maxTokens: created.maxTokens,
    systemPrompt: created.systemPrompt,
  };
}
