import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/admin-auth';
import { AgentOrchestrator } from '@/lib/blog/agent-orchestrator';
import { AgentRequest } from '@/lib/blog/agentic-types';
import { getUserAISettings } from '@/lib/ai/settings';
import { db } from '@/lib/db/connection';
import { userAPIKeys } from '@/lib/db/schema/tasky';
import { decryptAPIKey } from '@/lib/encryption';
import { eq, and } from 'drizzle-orm';

import { auth } from '@/lib/auth-config';

async function getUserTavilyKey(userId: string): Promise<string | null> {
  try {
    const [apiKeyRecord] = await db
      .select({
        keyEncrypted: userAPIKeys.keyEncrypted,
        iv: userAPIKeys.iv,
        authTag: userAPIKeys.authTag,
      })
      .from(userAPIKeys)
      .where(
        and(
          eq(userAPIKeys.userId, userId),
          eq(userAPIKeys.provider, 'tavily')
        )
      )
      .limit(1);

    if (!apiKeyRecord) {
      console.log(`[getUserTavilyKey] No Tavily API key found for user ${userId}`);
      return null;
    }

    const decrypted = decryptAPIKey(
      apiKeyRecord.keyEncrypted,
      apiKeyRecord.iv,
      apiKeyRecord.authTag
    );

    return decrypted;
  } catch (error) {
    console.error('[getUserTavilyKey] Error fetching Tavily key:', error);
    return null;
  }
}

async function getUserAPIKey(userId: string, provider: string): Promise<string | null> {
  try {
    const [apiKeyRecord] = await db
      .select({
        keyEncrypted: userAPIKeys.keyEncrypted,
        iv: userAPIKeys.iv,
        authTag: userAPIKeys.authTag,
      })
      .from(userAPIKeys)
      .where(
        and(
          eq(userAPIKeys.userId, userId),
          eq(userAPIKeys.provider, provider)
        )
      )
      .limit(1);

    if (!apiKeyRecord) {
      console.log(`[getUserAPIKey] No API key found for user ${userId}, provider ${provider}`);
      return null;
    }

    const decrypted = decryptAPIKey(
      apiKeyRecord.keyEncrypted,
      apiKeyRecord.iv,
      apiKeyRecord.authTag
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

  const apiKey = await getUserAPIKey(userId, provider);
  if (!apiKey) {
    throw new Error(`Please configure your ${provider.toUpperCase()} API key in Settings`);
  }

  const { generateText } = await import('ai');
  const { createOpenAI } = await import('@ai-sdk/openai');
  const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
  const { createAnthropic } = await import('@ai-sdk/anthropic');

  async function performAttempt(mId: string, temp: number): Promise<any> {
    console.log(`🔍 [Diagnostic] Preparing model call:`, {
      modelId: mId,
      provider,
      temperature: temp,
      maxTokens: settings.maxTokens,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      systemPromptLength: systemPrompt?.length,
      userPromptLength: userPrompt?.length
    });

    let model: any;
    const sdkKey = apiKey || undefined;

    if (!sdkKey) {
      throw new Error(`API key is missing for provider ${provider}. Please configure your API key in Settings.`);
    }

    switch (provider) {
      case 'google':
        model = createGoogleGenerativeAI({ apiKey: sdkKey })(mId);
        break;
      case 'openai':
        model = createOpenAI({ apiKey: sdkKey })(mId);
        break;
      case 'anthropic':
        model = createAnthropic({ apiKey: sdkKey })(mId);
        break;
      case 'openrouter':
      case 'kilo':
        const baseURL = provider === 'kilo' ? 'https://api.kilo.ai/v1' : 'https://openrouter.ai/api/v1';
        model = createOpenAI({ apiKey: sdkKey, baseURL })(mId);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    console.log(`📤 [Request] Calling ${provider}/${mId}...`);
    const result = await generateText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: temp,
      maxTokens: settings.maxTokens,
    });

    console.log(`📥 [Response] Received from ${provider}/${mId}:`, {
      hasText: !!result?.text,
      textLength: result?.text?.length || 0,
      finishReason: result?.finishReason,
      usage: result?.usage,
      rawResponsePreview: result?.text?.substring(0, 200)
    });

    return result;
  }

  console.log(`🤖 [LLM Call] Start: ${provider}/${modelId}`);

  try {
    const response = await performAttempt(modelId, settings.temperature);

    if (!response) {
      throw new Error(`Null response from ${provider}/${modelId}. The API call succeeded but returned no data.`);
    }

    if (!response.text || response.text.trim().length === 0) {
      const debugInfo = {
        provider,
        modelId,
        finishReason: response.finishReason,
        usage: response.usage,
        hasText: !!response.text,
        textLength: response.text?.length || 0
      };

      console.error(`❌ [Empty Response Debug]:`, debugInfo);

      if (provider === 'openrouter' && modelId.includes(':free')) {
        const isUsageInvalid = !response.usage ||
          isNaN(response.usage.totalTokens as number) ||
          response.usage.totalTokens === null;

        if (isUsageInvalid) {
          throw new Error(`OpenRouter 免费模型 [${modelId}] 当前不可用。

可能原因:
1. 该免费模型的全局配额已耗尽
2. 模型已被下架或暂时关闭
3. 您的 API Key 触发了频率限制

✅ 推荐解决方案:
• 切换到 Google Gemini (稳定且免费): gemini-2.0-flash-exp
• 或使用其他 OpenRouter 付费模型
• 检查 OpenRouter 状态: https://openrouter.ai/models

📊 当前状态:
- API 连接: ✅ 正常
- 请求处理: ❌ 未执行 (Token 使用量为 NaN)
- 建议: 立即切换模型`);
        }
      }

      throw new Error(`模型 [${modelId}] 返回了空内容。
调试信息:
- 提供商: ${provider}
- 完成原因: ${response.finishReason || 'unknown'}
- Token使用: ${JSON.stringify(response.usage || 'N/A')}
- 可能原因: API配额耗尽、模型过载、或请求被过滤

建议: 请检查 API Key 是否有效,或切换到其他模型重试。`);
    }

    console.log(`📊 [LLM Call] Success: ${modelId} (${response.text.length} chars)`);
    return response.text;
  } catch (error: any) {
    console.error(`❌ [LLM Final Error] for ${provider}/${modelId}:`, {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
      cause: error.cause
    });

    let friendlyError = error.message;
    if (provider === 'google' && (modelId.includes('gemini-3') || modelId.includes('gemini-1.5') || modelId.includes('gemini-2'))) {
      if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('NOT_FOUND')) {
        friendlyError = `模型 [${modelId}] 在 Google API 中未找到。
可能原因:
1. 模型 ID 错误 (请确认完整 ID)
2. 您的 API Key 无权访问此模型
3. 该模型已被弃用或名称已更改

建议: 尝试使用 'gemini-2.0-flash-exp' 或 'gemini-1.5-flash'`;
      } else if (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('quota')) {
        friendlyError = `[${modelId}] API 配额已用尽或触发频率限制。
请稍后重试,或检查您的 Google AI Studio 配额设置。`;
      } else if (error.message.includes('API key')) {
        friendlyError = `Google API Key 未配置或无效。
请在设置中配置有效的 API Key。
获取地址: https://makersuite.google.com/app/apikey`;
      }
    }

    throw new Error(friendlyError);
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
