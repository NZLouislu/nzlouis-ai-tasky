import { auth } from '@/lib/auth-config';
import { getUserAISettings } from '@/lib/ai/settings';
import { AIProvider } from '@/lib/ai/providers';

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  provider?: AIProvider;
  model?: string;
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
    const { messages } = body;

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
          defaultModel: 'gemini-1.5-flash',
          temperature: 0.8,
          maxTokens: 1024,
          systemPrompt: 'You are a helpful AI assistant.',
        };

    // Use request parameters or fall back to user settings
    const provider = (body.provider || settings.defaultProvider) as AIProvider;
    const modelName = body.model || settings.defaultModel;
    const temperature = body.temperature ?? settings.temperature;
    const maxTokens = body.maxTokens ?? settings.maxTokens;

    console.log(`Using provider: ${provider}, model: ${modelName}`);

    // Get the AI model using our existing helper
    const { getModel } = await import('@/lib/ai/models');
    const model = await getModel(userId, provider, modelName);

    // Prepare prompt from messages
    const systemMessage = settings.systemPrompt && !messages.some(m => m.role === 'system')
      ? settings.systemPrompt
      : undefined;

    // Convert messages to prompt format
    const promptMessages: Array<{
      role: 'user' | 'assistant';
      content: Array<{ type: 'text'; text: string }>;
    }> = [];
    
    if (systemMessage) {
      promptMessages.push({
        role: 'user',
        content: [{ type: 'text', text: systemMessage }],
      });
    }
    
    for (const msg of messages) {
      promptMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: [{ type: 'text', text: msg.content }],
      });
    }

    // Create stream manually
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call doStream with correct parameters
          const result = await model.doStream({
            inputFormat: 'messages' as const,
            mode: { type: 'regular' as const },
            prompt: promptMessages,
            temperature,
            maxTokens,
          });

          // Process stream using reader
          const reader = result.stream.getReader();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Only process text-delta chunks
              // Note: Runtime uses 'delta' but TypeScript types say 'textDelta'
              if (value.type === 'text-delta') {
                const delta = (value as { delta?: string; textDelta?: string }).delta || value.textDelta;
                if (delta) {
                  const data = `0:"${delta.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
                  controller.enqueue(encoder.encode(data));
                }
              }
            }
          } finally {
            reader.releaseLock();
          }

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
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
