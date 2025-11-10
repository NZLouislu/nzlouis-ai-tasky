import { auth } from '@/lib/auth-config';
import { getUserAISettings } from '@/lib/ai/settings';
import { AIProvider } from '@/lib/ai/providers';

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    image?: string;
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
    // Use Gemini 2.5 Flash - same as Google AI Studio
    const settings = userId 
      ? await getUserAISettings(userId)
      : {
          defaultProvider: 'google' as AIProvider,
          defaultModel: 'gemini-2.5-flash',
          temperature: 0.8,
          maxTokens: 2048,
          systemPrompt: 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users.',
        };

    // Use request parameters or fall back to user settings
    const provider = (body.provider || settings.defaultProvider) as AIProvider;
    const modelName = body.model || settings.defaultModel;
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

    // Convert messages to prompt format with proper typing for images
    type MessageContent = 
      | { type: 'text'; text: string }
      | { type: 'image'; image: URL | string };
    
    const promptMessages: Array<{
      role: 'user' | 'assistant';
      content: MessageContent[];
    }> = [];
    
    if (systemMessage) {
      promptMessages.push({
        role: 'user',
        content: [{ type: 'text', text: systemMessage }],
      });
    }
    
    for (const msg of messages) {
      // Skip system messages in the loop (already handled above)
      if (msg.role === 'system') continue;
      
      console.log('Processing message:', { role: msg.role, hasImage: !!msg.image, contentLength: msg.content?.length });
      
      // If message has image, use array format
      if (msg.image) {
        const content: MessageContent[] = [];
        
        const imageData = msg.image;
        
        // Extract base64 data and mime type
        let base64Data = imageData;
        let mimeType = 'image/jpeg';
        
        if (imageData.startsWith('data:')) {
          // Parse data URL: data:image/png;base64,iVBORw0KG...
          const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
            console.log('Parsed image:', { mimeType, base64Length: base64Data.length });
          }
        } else {
          // If no data URL prefix, assume it's raw base64
          console.log('Raw base64 data, length:', base64Data.length);
        }
        
        // Reconstruct proper data URL
        const properDataUrl = `data:${mimeType};base64,${base64Data}`;
        console.log('Final data URL:', properDataUrl.substring(0, 50) + '...');
        
        // For Gemini, use URL object
        const imageUrl = new URL(properDataUrl);
        
        // Add image FIRST, then text (Gemini prefers this order)
        content.push({ type: 'image', image: imageUrl });
        
        if (msg.content && msg.content.trim()) {
          content.push({ type: 'text', text: msg.content });
        } else {
          // Use specific prompt for better vision results
          content.push({ type: 'text', text: '请详细描述这张图片中你看到的所有内容，包括物体、颜色、场景等。' });
        }
        
        promptMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content,
        });
      } else if (msg.content && msg.content.trim()) {
        // Text-only message - MUST use array format for Gemini
        promptMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: [{ type: 'text', text: msg.content }],
        });
      }
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
          console.log('Starting stream with model...');
          
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
