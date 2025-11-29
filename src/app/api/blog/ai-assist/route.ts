import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/admin-auth';
import { AgentOrchestrator } from '@/lib/blog/agent-orchestrator';
import { AgentRequest } from '@/lib/blog/agentic-types';
import { getUserAISettings } from '@/lib/ai/settings';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { decryptAPIKey } from '@/lib/encryption';

import { auth } from '@/lib/auth-config';

async function getUserTavilyKey(userId: string): Promise<string | null> {
  try {
    const { data: apiKeyRecord, error } = await taskyDb
      .from('user_api_keys')
      .select('key_encrypted, iv, auth_tag')
      .eq('user_id', userId)
      .eq('provider', 'tavily')
      .single();

    if (error || !apiKeyRecord) {
      console.log(`[getUserTavilyKey] No Tavily API key found for user ${userId}`);
      return null;
    }

    const decrypted = decryptAPIKey(
      apiKeyRecord.key_encrypted,
      apiKeyRecord.iv,
      apiKeyRecord.auth_tag
    );

    return decrypted;
  } catch (error) {
    console.error('[getUserTavilyKey] Error fetching Tavily key:', error);
    return null;
  }
}

async function getUserAPIKey(userId: string, provider: string): Promise<string | null> {
  try {
    const { data: apiKeyRecord, error } = await taskyDb
      .from('user_api_keys')
      .select('key_encrypted, iv, auth_tag')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (error || !apiKeyRecord) {
      console.log(`[getUserAPIKey] No API key found for user ${userId}, provider ${provider}`);
      return null;
    }

    const decrypted = decryptAPIKey(
      apiKeyRecord.key_encrypted,
      apiKeyRecord.iv,
      apiKeyRecord.auth_tag
    );

    return decrypted;
  } catch (error) {
    console.error(`[getUserAPIKey] Error fetching API key for ${provider}:`, error);
    return null;
  }
}

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  userId: string,
  overrideProvider?: string,
  overrideModel?: string
): Promise<string> {
  const settings = await getUserAISettings(userId);
  
  const provider = overrideProvider || settings.defaultProvider;
  const modelId = overrideModel || settings.defaultModel;

  console.log(`🤖 [LLM Call] Using Provider: ${provider}, Model: ${modelId} ${overrideModel ? '(User Selected)' : '(Default)'}`);

  const apiKey = await getUserAPIKey(userId, provider);
  
  if (!apiKey) {
    throw new Error(`Please configure your ${provider.toUpperCase()} API key in Settings`);
  }

  const { generateText } = await import('ai');
  const { createOpenAI } = await import('@ai-sdk/openai');
  const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
  const { createAnthropic } = await import('@ai-sdk/anthropic');

  let model: any;

  switch (provider) {
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      model = google(modelId);
      break;
    }

    case 'openai': {
      const openai = createOpenAI({ apiKey });
      model = openai(modelId);
      break;
    }

    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      model = anthropic(modelId);
      break;
    }

    case 'openrouter':
    case 'kilo': {
      const baseURL = provider === 'kilo' 
        ? 'https://api.kilo.ai/v1'
        : 'https://openrouter.ai/api/v1';
      
      const openrouter = createOpenAI({ 
        apiKey,
        baseURL,
      });
      model = openrouter(modelId);
      break;
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  try {
    const { text, finishReason, usage } = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
    });

    console.log(`📊 [LLM Response] finishReason: ${finishReason}, tokens: ${usage?.totalTokens || 'N/A'}, length: ${text?.length || 0}`);

    if (!text || text.trim().length === 0) {
      console.warn(`⚠️ [LLM] Empty response from ${provider}/${modelId}. finishReason: ${finishReason}`);
      
      if (modelId.includes(':free') || modelId.includes('free')) {
        throw new Error(`The free model ${modelId} returned an empty response. This may be due to rate limits or model availability. Try again or switch to a paid model.`);
      }
      
      throw new Error(`Empty response from ${provider}/${modelId}. The model may be temporarily unavailable.`);
    }

    return text;
  } catch (error) {
    console.error(`LLM call failed for ${provider}/${modelId}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      throw new Error(`Rate limit exceeded for ${provider}. Please wait a moment and try again.`);
    }
    
    if (errorMessage.includes('Empty response')) {
      throw error;
    }
    
    throw new Error(`Failed to generate response using ${provider}/${modelId}: ${errorMessage}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
      console.error('❌ Authentication failed: No user ID found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      message,
      conversation_id,
      post_id,
      current_content,
      current_title,
      model,
      provider,
      search_enabled
    } = body;

    if (!message || !post_id || !current_content || !current_title) {
      return NextResponse.json(
        { error: 'Missing required fields: message, post_id, current_content, current_title' },
        { status: 400 }
      );
    }

    const settings = await getUserAISettings(userId);
    
    const targetProvider = provider || settings.defaultProvider;
    
    console.log(`⚙️ [AI Settings] Processing request for user ${userId.substring(0, 8)}...`);
    console.log(`   - Target Provider: ${targetProvider} ${provider ? '(User Override)' : '(Default)'}`);
    console.log(`   - Target Model: ${model || settings.defaultModel} ${model ? '(User Override)' : '(Default)'}`);
    console.log(`   - Search Enabled: ${search_enabled !== undefined ? search_enabled : 'Auto (Default)'}`);
    
    const apiKey = await getUserAPIKey(userId, targetProvider);
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'API key not configured',
          message: `Please configure your ${targetProvider.toUpperCase()} API key in Settings to use the AI Blog Assistant.`,
          requiresSetup: true,
        },
        { status: 400 }
      );
    }

    const tavilyKey = await getUserTavilyKey(userId);
    
    const agentRequest: AgentRequest = {
      message,
      conversation_id,
      post_id,
      current_content,
      current_title,
      user_id: userId,
    };

    const orchestrator = new AgentOrchestrator();
    
    const llmCaller = (systemPrompt: string, userPrompt: string) =>
      callLLM(systemPrompt, userPrompt, userId, provider, model);

    if (tavilyKey && search_enabled !== false) {
      process.env.TAVILY_API_KEY = tavilyKey;
      console.log('🔍 [Search] Search enabled and key present');
    } else {
      if (!tavilyKey) {
        console.log('⚠️ [Search] No Tavily API key found. Search disabled.');
      } else {
        console.log('🚫 [Search] Search explicitly disabled by user.');
      }
      delete process.env.TAVILY_API_KEY;
    }

    const response = await orchestrator.execute(agentRequest, llmCaller);

    if (!tavilyKey && response.modification_preview) {
      response.modification_preview.metadata = {
        ...response.modification_preview.metadata,
        searchAvailable: false,
        searchNote: 'Configure Tavily API key in Settings to enable web search for latest information.',
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Assist API error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        {
          error: 'Configuration required',
          message: error.message,
          requiresSetup: true,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
