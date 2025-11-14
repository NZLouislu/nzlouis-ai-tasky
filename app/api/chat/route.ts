import { auth } from '@/lib/auth-config';
import { getUserAISettings } from '@/lib/ai/settings';
import { AIProvider } from '@/lib/ai/providers';
import { taskyDb } from '@/lib/supabase/tasky-db-client';

const MODEL_PROVIDER_MAP: Record<string, AIProvider> = {
  'gemini-2.5-flash': 'google',
  'gemini-2.5-flash-live': 'google',
  'gemini-2.0-flash-live': 'google',
  'gemini-2.0-flash-lite': 'google',
  'gemini-2.0-flash': 'google',
  'gemini-2.5-flash-lite': 'google',
  'gemini-2.5-pro': 'google',
  'gemini-1.5-flash': 'google',
  'gemini-1.5-pro': 'google',
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'o3-mini': 'openai',
  'o1-mini': 'openai',
  'claude-sonnet-4.5': 'anthropic',
  'claude-4-opus': 'anthropic',
  'claude-sonnet': 'anthropic',
  'claude-haiku': 'anthropic',
  'openai/gpt-oss-20b:free': 'openrouter',
  'tngtech/deepseek-r1t2-chimera:free': 'openrouter',
  'tngtech/deepseek-r1t-chimera:free': 'openrouter',
  'deepseek/deepseek-chat-v3-0324:free': 'openrouter',
  'deepseek/deepseek-r1-0528:free': 'openrouter',
  'qwen/qwen3-coder:free': 'openrouter',
  'xai-grok-code-fast-1': 'kilo',
  'claude-sonnet-4': 'kilo',
};

async function getModelConfigFromId(userId: string | undefined, modelId: string) {
  const provider = MODEL_PROVIDER_MAP[modelId];

  if (!provider) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  if (userId) {
    const { data } = await taskyDb
      .from('user_api_keys')
      .select('provider')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    if (!data) {
      throw new Error(`API key not configured for ${provider}`);
    }
  }

  return {
    provider,
    modelName: modelId,
  };
}

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    image?: string;
  }>;
  provider?: AIProvider;
  model?: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  sessionId?: string;
}

export async function POST(req: Request) {
  try {
    // Get user session
    const session = await auth();
    const userId = session?.user?.id;

    // Parse request body
    const body: ChatRequest = await req.json();
    const { messages, modelId } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user AI settings (or defaults)
    const settings = userId
      ? await getUserAISettings(userId)
      : {
        defaultProvider: 'google' as AIProvider,
        defaultModel: 'gemini-2.5-flash',
        temperature: 0.8,
        maxTokens: 2048,
        systemPrompt: 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users.',
      };

    let provider: AIProvider;
    let modelName: string;

    if (modelId) {
      const modelConfig = await getModelConfigFromId(userId, modelId);
      provider = modelConfig.provider;
      modelName = modelConfig.modelName;
    } else {
      provider = (body.provider || settings.defaultProvider) as AIProvider;
      modelName = body.model || settings.defaultModel;
    }
    const temperature = body.temperature ?? settings.temperature;
    const maxTokens = body.maxTokens ?? settings.maxTokens;

    console.log(`Using provider: ${provider}, model: ${modelName}`);

    // Log if any messages contain images
    const hasImages = messages.some(m => m.image);
    if (hasImages) {
      console.log('Messages contain images - using vision model');
    }

    // Get the AI model using our existing helper
    const { getModel } = await import('@/lib/ai/models');
    const model = await getModel(userId, provider, modelName);

    // Prepare prompt from messages
    const systemMessage = settings.systemPrompt && !messages.some(m => m.role === 'system')
      ? settings.systemPrompt
      : undefined;

    // Convert messages to prompt format with provider-specific formatting
    type MessageContent =
      | { type: 'text'; text: string }
      | { type: 'image'; image: URL | string };

    let promptMessages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: MessageContent[] | string;
    }> = [];

    if (provider === 'google') {
      // Google Gemini format - uses content arrays
      const geminiMessages: Array<{
        role: 'user' | 'assistant';
        content: MessageContent[];
      }> = [];

      if (systemMessage) {
        geminiMessages.push({
          role: 'user',
          content: [{ type: 'text', text: systemMessage }],
        });
      }

      for (const msg of messages) {
        if (msg.role === 'system') continue;

        console.log('Processing message for Gemini:', { role: msg.role, hasImage: !!msg.image, contentLength: msg.content?.length });

        if (msg.image) {
          const content: MessageContent[] = [];
          const imageData = msg.image;
          let base64Data = imageData;
          let mimeType = 'image/jpeg';

          if (imageData.startsWith('data:')) {
            const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
              mimeType = matches[1];
              base64Data = matches[2];
            }
          }

          const properDataUrl = `data:${mimeType};base64,${base64Data}`;
          const imageUrl = new URL(properDataUrl);

          content.push({ type: 'image', image: imageUrl });

          if (msg.content && msg.content.trim()) {
            content.push({ type: 'text', text: msg.content });
          } else {
            content.push({ type: 'text', text: 'Please describe in detail everything you see in this image, including objects, colors, scenes, etc.' });
          }

          geminiMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content,
          });
        } else if (msg.content && msg.content.trim()) {
          geminiMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: [{ type: 'text', text: msg.content }],
          });
        }
      }
      promptMessages = geminiMessages;
    } else {
      // OpenRouter and other providers - use simple string format
      const simpleMessages: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
      }> = [];

      if (systemMessage) {
        simpleMessages.push({
          role: 'system',
          content: systemMessage,
        });
      }

      for (const msg of messages) {
        if (msg.role === 'system') continue;

        console.log('Processing message for OpenRouter:', { role: msg.role, hasImage: !!msg.image, contentLength: msg.content?.length });

        if (msg.image) {
          const content = msg.content || 'Please describe this image.';
          simpleMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: content,
          });
        } else if (msg.content && msg.content.trim()) {
          simpleMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          });
        }
      }
      promptMessages = simpleMessages;
    }

    console.log('Prompt messages count:', promptMessages.length);
    console.log('Messages with images:', promptMessages.filter(m => Array.isArray(m.content) && m.content.some((c) => c.type === 'image')).length);

    // Log detailed message structure
    promptMessages.forEach((msg, idx) => {
      console.log(`Message ${idx}:`, {
        role: msg.role,
        contentItems: Array.isArray(msg.content) ? msg.content.map((c) => c.type) : 'string'
      });
    });

    // Use doStream directly for better control
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting stream with model...', { provider, modelName });

          // Call doStream with correct parameters
          const result = await model.doStream({
            inputFormat: 'messages' as const,
            mode: { type: 'regular' as const },
            // @ts-expect-error - Complex message types with images require type assertion
            prompt: promptMessages,
            temperature,
            maxTokens,
          });

          console.log('Stream started successfully');

          // Process stream using reader
          const reader = result.stream.getReader();

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log('Stream completed');
                break;
              }

              // Only process text-delta chunks
              if (value.type === 'text-delta') {
                const delta = (value as { delta?: string; textDelta?: string }).delta || value.textDelta;
                if (delta) {
                  const data = `0:"${delta.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
                  controller.enqueue(encoder.encode(data));
                }
              }
              // Silently ignore other chunk types
            }
          } finally {
            reader.releaseLock();
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error details:', errorMsg);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat request';

    return new Response(
      JSON.stringify({
        error: errorMessage,
        suggestion: 'Try changing the AI provider or model in Settings'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
