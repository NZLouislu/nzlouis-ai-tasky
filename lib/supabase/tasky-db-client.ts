/**
 * Supabase Database Client for AI Tasky Features
 * Uses Supabase SDK instead of Prisma for better Vercel compatibility
 */

import { createClient } from '@supabase/supabase-js';

// Type definitions
interface UserAISettingsInput {
  defaultProvider?: string;
  default_provider?: string;
  defaultModel?: string;
  default_model?: string;
  temperature?: number;
  maxTokens?: number;
  max_tokens?: number;
  systemPrompt?: string;
  system_prompt?: string;
}

interface ChatSessionInput {
  title: string;
  provider: string;
  model: string;
}

interface ChatSessionUpdate {
  title?: string;
}

interface UserAPIKeyInput {
  encryptedKey?: string;
  encrypted_key?: string;
  iv: string;
  authTag?: string;
  auth_tag?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration for Tasky DB');
}

// Create a single instance with service role key for server-side operations
export const taskyDb = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public',
  },
});

// Helper functions for common operations

export const taskyDbHelpers = {
  // User AI Settings
  async getUserAISettings(userId: string) {
    const { data, error } = await taskyDb
      .from('user_ai_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  },

  async upsertUserAISettings(userId: string, settings: UserAISettingsInput) {
    const { data, error } = await taskyDb
      .from('user_ai_settings')
      .upsert({
        user_id: userId,
        default_provider: settings.defaultProvider || settings.default_provider,
        default_model: settings.defaultModel || settings.default_model,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens || settings.max_tokens,
        system_prompt: settings.systemPrompt || settings.system_prompt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Chat Sessions
  async getChatSessions(userId: string) {
    const { data, error } = await taskyDb
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getChatSession(sessionId: string, userId: string) {
    const { data, error } = await taskyDb
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createChatSession(userId: string, sessionData: ChatSessionInput) {
    const { data, error } = await taskyDb
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title: sessionData.title,
        provider: sessionData.provider,
        model: sessionData.model,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateChatSession(sessionId: string, userId: string, updates: ChatSessionUpdate) {
    const { data, error } = await taskyDb
      .from('chat_sessions')
      .update({
        title: updates.title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteChatSession(sessionId: string, userId: string) {
    const { error } = await taskyDb
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  // Chat Messages
  async getChatMessages(sessionId: string) {
    const { data, error } = await taskyDb
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  // User API Keys
  async getUserAPIKeys(userId: string) {
    const { data, error } = await taskyDb
      .from('user_api_keys')
      .select('provider, encrypted_key, iv, auth_tag, created_at, updated_at')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  },

  async upsertUserAPIKey(userId: string, provider: string, keyData: UserAPIKeyInput) {
    const { data, error } = await taskyDb
      .from('user_api_keys')
      .upsert({
        user_id: userId,
        provider,
        encrypted_key: keyData.encryptedKey || keyData.encrypted_key,
        iv: keyData.iv,
        auth_tag: keyData.authTag || keyData.auth_tag,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteUserAPIKey(userId: string, provider: string) {
    const { error } = await taskyDb
      .from('user_api_keys')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider);
    
    if (error) throw error;
  },
};
