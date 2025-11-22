import { taskyDb } from '../supabase/tasky-db-client';
import { AIProvider } from './providers';

export interface UserAISettings {
  defaultProvider: AIProvider;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export async function getUserAISettings(userId: string): Promise<UserAISettings> {
  const { data: settings, error } = await taskyDb
    .from('user_ai_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !settings) {
    return {
      defaultProvider: 'google',
      defaultModel: 'gemini-2.5-flash',
      temperature: 0.8,
      maxTokens: 4096,
      systemPrompt: 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, please use Markdown tables for better readability.',
    };
  }

  return {
    defaultProvider: settings.default_provider as AIProvider,
    defaultModel: settings.default_model,
    temperature: settings.temperature,
    maxTokens: settings.max_tokens === 1024 ? 4096 : settings.max_tokens,
    systemPrompt: settings.system_prompt,
  };
}

export async function updateUserAISettings(
  userId: string,
  settings: Partial<UserAISettings>
): Promise<UserAISettings> {
  const { data: updated, error } = await taskyDb
    .from('user_ai_settings')
    .upsert({
      user_id: userId,
      default_provider: settings.defaultProvider || 'google',
      default_model: settings.defaultModel || 'gemini-2.5-flash',
      temperature: settings.temperature ?? 0.8,
      max_tokens: settings.maxTokens ?? 4096,
      system_prompt: settings.systemPrompt || 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, please use Markdown tables for better readability.',
    })
    .select()
    .single();

  if (error || !updated) {
    throw new Error('Failed to update AI settings');
  }

  return {
    defaultProvider: updated.default_provider as AIProvider,
    defaultModel: updated.default_model,
    temperature: updated.temperature,
    maxTokens: updated.max_tokens,
    systemPrompt: updated.system_prompt,
  };
}

export async function ensureUserAISettings(userId: string): Promise<UserAISettings> {
  const { data: existing, error: fetchError } = await taskyDb
    .from('user_ai_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing && !fetchError) {
    return {
      defaultProvider: existing.default_provider as AIProvider,
      defaultModel: existing.default_model,
      temperature: existing.temperature,
      maxTokens: existing.max_tokens,
      systemPrompt: existing.system_prompt,
    };
  }

  const { data: created, error: createError } = await taskyDb
    .from('user_ai_settings')
    .insert({
      user_id: userId,
      default_provider: 'google',
      default_model: 'gemini-2.5-flash',
      temperature: 0.8,
      max_tokens: 4096,
      system_prompt: 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, please use Markdown tables for better readability.',
    })
    .select()
    .single();

  if (createError || !created) {
    return {
      defaultProvider: 'google',
      defaultModel: 'gemini-2.5-flash',
      temperature: 0.8,
      maxTokens: 4096,
      systemPrompt: 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, please use Markdown tables for better readability.',
    };
  }

  return {
    defaultProvider: created.default_provider as AIProvider,
    defaultModel: created.default_model,
    temperature: created.temperature,
    maxTokens: created.max_tokens,
    systemPrompt: created.system_prompt,
  };
}
