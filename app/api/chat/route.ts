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
    const session = await auth();
    const userId = session?.user?.id;

    const body: ChatRequest = await req.json();
    const { messages, modelId } = body;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

    const hasImages = messages.some(m => m.image);
    if (hasImages) {
      console.log('Messages contain images - using vision model');
    }

    const { getModel } = await import('@/lib/ai/models');
    const model = await getModel(userId, provider, modelName);

    const systemMessage = settings.systemPrompt && !messages.some(m => m.role === 'system')
      ? settings.systemPrompt
      : undefined;

    type MessageContent =
      | { type: 'text'; text: string }
      | { type: 'image'; image: URL | string };

    let promptMessages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: MessageContent[] | string;
    }> = [];

    if (provider === 'google') {
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

    // For OpenRouter, use direct fetch to avoid AI SDK message format conversion
    if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'AI Tasky',
        },
        body: JSON.stringify({
          model: modelName,
          messages: promptMessages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      console.log('OpenRouter stream started successfully');

      // Transform OpenRouter SSE to our format
      const encoder = new TextEncoder();
      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta;

                // Try content first, then reasoning (for reasoning models)
                const textContent = delta?.content || delta?.reasoning || '';

                if (textContent) {
                  const formatted = `0:"${textContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
                  controller.enqueue(encoder.encode(formatted));
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      });

      return new Response(response.body?.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // For other providers, use AI SDK
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting stream with model...', { provider, modelName });

          // Use streamText from AI SDK for other providers
          const { streamText } = await import('ai');

          const result = await streamText({
            model: model,
            // @ts-expect-error - Type compatibility
            messages: promptMessages,
            temperature,
            maxTokens,
          });

          console.log('Stream started successfully');

          // Process the full stream to handle all chunk types
          for await (const chunk of result.fullStream) {
            // Only process text-delta chunks
            if (chunk.type === 'text-delta') {
              const data = `0:"${chunk.textDelta.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
              controller.enqueue(encoder.encode(data));
            }
            // Ignore other chunk types like 'stream-start', 'finish', etc.
          }

          console.log('Stream completed');
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
