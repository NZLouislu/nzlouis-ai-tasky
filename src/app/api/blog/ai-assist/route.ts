/**
 * AI Assist API Route - New Agentic Blog Editor Endpoint
 * Implements the 6-stage pipeline for intelligent blog editing
 * Uses user-configured API keys from settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/admin-auth';
import { AgentOrchestrator } from '@/lib/blog/agent-orchestrator';
import { AgentRequest } from '@/lib/blog/agentic-types';
import { getUserAISettings } from '@/lib/ai/settings';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { decryptAPIKey } from '@/lib/encryption';

/**
 * Get user's Tavily API key
 */
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

/**
 * Get user's API key for their selected provider
 */
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

/**
 * LLM caller function - supports all AI providers
 */
async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  userId: string
): Promise<string> {
  // Get user's AI settings
  const settings = await getUserAISettings(userId);
  const provider = settings.defaultProvider;
  const modelId = settings.defaultModel;

  // Get user's API key for their selected provider
  const apiKey = await getUserAPIKey(userId, provider);
  
  if (!apiKey) {
    throw new Error(`Please configure your ${provider.toUpperCase()} API key in Settings`);
  }

  // Use AI SDK for unified interface across all providers
  const { generateText } = await import('ai');
  const { createOpenAI } = await import('@ai-sdk/openai');
  const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
  const { createAnthropic } = await import('@ai-sdk/anthropic');

  let model: any;

  // Create provider-specific model instance
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
      // OpenRouter and Kilo use OpenAI-compatible API
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
    // Use AI SDK's generateText for unified interface
    const { text } = await generateText({
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

    return text;
  } catch (error) {
    console.error(`LLM call failed for ${provider}/${modelId}:`, error);
    throw new Error(`Failed to generate response using ${provider}. Please check your API key and model selection.`);
  }
}

/**
 * POST handler for AI assist requests
 */
export async function POST(request: NextRequest) {
  try {
    // Get user ID
    const userId = getUserIdFromRequest(undefined, request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      message,
      conversation_id,
      post_id,
      current_content,
      current_title,
    } = body;

    // Validate required fields
    if (!message || !post_id || !current_content || !current_title) {
      return NextResponse.json(
        { error: 'Missing required fields: message, post_id, current_content, current_title' },
        { status: 400 }
      );
    }

    // Check if user has configured their API keys
    const settings = await getUserAISettings(userId);
    const apiKey = await getUserAPIKey(userId, settings.defaultProvider);
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'API key not configured',
          message: `Please configure your ${settings.defaultProvider.toUpperCase()} API key in Settings to use the AI Blog Assistant.`,
          requiresSetup: true,
        },
        { status: 400 }
      );
    }

    // Get Tavily API key (optional for search)
    const tavilyKey = await getUserTavilyKey(userId);
    
    // Create agent request
    const agentRequest: AgentRequest = {
      message,
      conversation_id,
      post_id,
      current_content,
      current_title,
      user_id: userId,
    };

    // Create orchestrator and execute pipeline
    const orchestrator = new AgentOrchestrator();
    const llmCaller = (systemPrompt: string, userPrompt: string) =>
      callLLM(systemPrompt, userPrompt, userId);

    // Set Tavily key in environment for the orchestrator if available
    if (tavilyKey) {
      process.env.TAVILY_API_KEY = tavilyKey;
    }

    const response = await orchestrator.execute(agentRequest, llmCaller);

    // Add metadata about search availability
    if (!tavilyKey && response.modification_preview) {
      response.modification_preview.metadata = {
        ...response.modification_preview.metadata,
        searchAvailable: false,
        searchNote: 'Configure Tavily API key in Settings to enable web search for latest information.',
      };
    }

    // Return response
    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Assist API error:', error);
    
    // Check if it's an API key error
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
