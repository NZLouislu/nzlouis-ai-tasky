import { auth } from '@/lib/auth-config';
import { getUserAISettings } from '@/lib/ai/settings';
import { AIProvider } from '@/lib/ai/providers';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/admin-auth';

const MODEL_PROVIDER_MAP: Record<string, AIProvider> = {
  'gemini-2.5-flash': 'google',
  'gemini-3-pro-preview': 'google',
  'gemini-2.5-pro': 'google',
  'gemini-2.5-flash-live': 'google',
  'gemini-2.0-flash-live': 'google',
  'gemini-2.0-flash-lite': 'google',
  'gemini-2.0-flash': 'google',
  'gemini-2.5-flash-lite': 'google',
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
  'x-ai/grok-4.1-fast:free': 'openrouter',
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
    images?: string[];
  }>;
  provider?: AIProvider;
  model?: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  sessionId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);

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
        maxTokens: 4096,
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
    let maxTokens = body.maxTokens ?? settings.maxTokens;
    // Auto-upgrade legacy default limit
    if (maxTokens === 1024) {
      console.log('Upgrading legacy maxTokens 1024 to 4096');
      maxTokens = 4096;
    }

    console.log(`Using provider: ${provider}, model: ${modelName}`);

    const hasImages = messages.some(m => (m.images && m.images.length > 0) || m.image);
    if (hasImages) {
      console.log('Messages contain images - using vision model');
    }

    const { getModel } = await import('@/lib/ai/models');
    const model = await getModel(userId, provider, modelName);

    const defaultSystemPrompt = 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, ALWAYS use Markdown tables with proper formatting. Example:\n\n| Column 1 | Column 2 |\n|----------|----------|\n| Data 1   | Data 2   |\n\nUse this format for all comparisons and structured information.';
    
    // Force use of new system prompt with Markdown table instructions
    const systemMessage = defaultSystemPrompt;

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
        
        const images = msg.images || (msg.image ? [msg.image] : []);

        // Skip messages with empty content and no image
        if (!msg.content?.trim() && images.length === 0) {
          continue;
        }

        if (images.length > 0) {
          const content: MessageContent[] = [];
          
          for (const imageData of images) {
            let base64Data = imageData;
            let mimeType = 'image/jpeg';

            // Handle HTTP/HTTPS URLs - fetch and convert to Base64
            if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
              try {
                console.log('Fetching image from URL for Gemini:', imageData);
                const imageResponse = await fetch(imageData);
                if (!imageResponse.ok) {
                  throw new Error(`Failed to fetch image: ${imageResponse.status}`);
                }
                const arrayBuffer = await imageResponse.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                base64Data = buffer.toString('base64');
                
                // Try to get mime type from response headers
                const contentType = imageResponse.headers.get('content-type');
                if (contentType) {
                  mimeType = contentType;
                }
                console.log('Successfully converted URL to Base64, mimeType:', mimeType);
              } catch (error) {
                console.error('Failed to fetch image from URL:', error);
                throw new Error('Failed to load image from URL');
              }
            } else if (imageData.startsWith('data:')) {
              // Handle data URLs
              const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
              if (matches) {
                mimeType = matches[1];
                base64Data = matches[2];
              }
            }
            // If it's already base64, use it as-is

            const properDataUrl = `data:${mimeType};base64,${base64Data}`;
            const imageUrl = new URL(properDataUrl);

            content.push({ type: 'image', image: imageUrl });
          }

          if (msg.content && msg.content.trim()) {
            content.push({ type: 'text', text: msg.content });
          } else if (content.length > 0) {
             // If we have images but no text, add a default prompt
            content.push({ type: 'text', text: 'Please describe in detail everything you see in these images, including objects, colors, scenes, etc.' });
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
        content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
      }> = [];

      if (systemMessage) {
        console.log('Adding system message to OpenRouter:', systemMessage);
        simpleMessages.push({
          role: 'system',
          content: systemMessage,
        });
      }

      for (const msg of messages) {
        if (msg.role === 'system') continue;
        
        const images = msg.images || (msg.image ? [msg.image] : []);

        // Skip messages with empty content and no image
        if (!msg.content?.trim() && images.length === 0) {
          continue;
        }

        if (images.length > 0) {
          const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
          
          // For the last user message with image, add explicit formatting instruction
          const isLastMessage = messages.indexOf(msg) === messages.length - 1 && msg.role === 'user';
          let textContent = msg.content && msg.content.trim() ? msg.content : '';
          
          if (isLastMessage && provider === 'openrouter') {
            textContent += '\n\n**IMPORTANT: Please format all tables using proper Markdown syntax with pipes (|) and hyphens (-). Example:**\n```\n| Header 1 | Header 2 |\n|----------|----------|\n| Data 1   | Data 2   |\n```';
          }
          
          if (textContent) {
            content.push({ type: 'text', text: textContent });
          }
          
          for (const img of images) {
            content.push({
              type: 'image_url',
              image_url: {
                url: img
              }
            });
          }

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
      promptMessages = simpleMessages as any;
    }

    console.log('Prompt messages count:', promptMessages.length);
    console.log('First message (system):', JSON.stringify(promptMessages[0], null, 2));

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
        
        // Check for common errors related to vision support
        if (response.status === 400 && (errorText.includes('vision') || errorText.includes('image') || errorText.includes('multimodal'))) {
          throw new Error(`The model ${modelName} does not support image recognition. Please switch to a vision-capable model like GPT-4o, Claude 3.5 Sonnet, or Gemini.`);
        }
        
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      console.log('OpenRouter stream started successfully');

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

                const textContent = delta?.content || delta?.reasoning || '';

                if (textContent) {
                  const formatted = `0:"${textContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
                  controller.enqueue(encoder.encode(formatted));
                }
              } catch {
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

    if (provider === 'google') {
      const { decryptAPIKey } = await import('@/lib/encryption');
      
      const { data: apiKeyRecord } = await taskyDb
        .from('user_api_keys')
        .select('key_encrypted, iv, auth_tag')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .single();

      if (!apiKeyRecord) {
        throw new Error('Google API key not found');
      }

      const apiKey = decryptAPIKey(
        apiKeyRecord.key_encrypted,
        apiKeyRecord.iv,
        apiKeyRecord.auth_tag
      );

      const modelMap: Record<string, string> = {
        'gemini-2.5-flash': 'gemini-2.5-flash',
        'gemini-3-pro-preview': 'gemini-3-pro-preview',
        'gemini-2.5-pro': 'gemini-2.5-pro',
        'gemini-2.5-flash-live': 'gemini-2.5-flash',
        'gemini-2.0-flash-live': 'gemini-2.0-flash',
        'gemini-2.0-flash-lite': 'gemini-2.0-flash',
        'gemini-2.0-flash': 'gemini-2.0-flash',
        'gemini-2.5-flash-lite': 'gemini-2.5-flash',
        'gemini-1.5-flash': 'gemini-1.5-flash',
        'gemini-1.5-pro': 'gemini-1.5-pro',
      };

      const actualModel = modelMap[modelName] || modelName;

      const geminiContents = promptMessages.map((msg: { role: string; content: MessageContent[] | string }) => {
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
        
        if (Array.isArray(msg.content)) {
          for (const item of msg.content) {
            if (item.type === 'text') {
              parts.push({ text: item.text });
            } else if (item.type === 'image') {
              const imageUrl = item.image.toString();
              if (imageUrl.startsWith('data:')) {
                const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
                if (matches) {
                  parts.push({
                    inlineData: {
                      mimeType: matches[1],
                      data: matches[2]
                    }
                  });
                }
              }
            }
          }
        } else {
          parts.push({ text: msg.content });
        }

        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        };
      });

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:streamGenerateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      console.log('Gemini stream started successfully');

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      let buffer = '';
      
      const transformStream = new TransformStream({
        async transform(chunk, controller) {
          const chunkText = decoder.decode(chunk, { stream: true });
          // console.log('Gemini raw chunk:', chunkText); // Debug raw output
          buffer += chunkText;
          
          // Gemini stream returns an array of objects, e.g. [{...}, {...}]
          // We need to handle the array brackets and commas
          
          let startIndex = 0;
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;
          
          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];
            
            // Skip array brackets and commas outside of JSON objects
            if (braceCount === 0 && (char === '[' || char === ']' || char === ',' || char === '\n' || char === ' ')) {
              startIndex = i + 1;
              continue;
            }
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{') {
                if (braceCount === 0) {
                  startIndex = i;
                }
                braceCount++;
              } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  // Found complete JSON object
                  const jsonStr = buffer.substring(startIndex, i + 1);
                  try {
                    const json = JSON.parse(jsonStr);
                    // console.log('Parsed Gemini response:', JSON.stringify(json, null, 2));
                    
                    const textContent = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    
                    if (textContent) {
                      // console.log('Extracted text content:', textContent);
                      const formatted = `0:"${textContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
                      controller.enqueue(encoder.encode(formatted));
                    }
                  } catch (e) {
                    console.error('Failed to parse JSON object:', e, jsonStr.substring(0, 200));
                  }
                  
                  // Update buffer start index
                  startIndex = i + 1;
                }
              }
            }
          }
          
          // Keep only the unprocessed part of the buffer
          if (startIndex < buffer.length) {
            buffer = buffer.substring(startIndex);
          } else {
            buffer = '';
          }
        },
        async flush(controller) {
          // Process any remaining complete JSON objects in buffer
          let startIndex = 0;
          let braceCount = 0;
          let inString = false;
          let escapeNext = false;
          
          for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];
            
            // Skip array brackets and commas outside of JSON objects
            if (braceCount === 0 && (char === '[' || char === ']' || char === ',' || char === '\n' || char === ' ')) {
              startIndex = i + 1;
              continue;
            }
            
            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              continue;
            }
            
            if (char === '"' && !escapeNext) {
              inString = !inString;
              continue;
            }
            
            if (!inString) {
              if (char === '{') {
                if (braceCount === 0) {
                  startIndex = i;
                }
                braceCount++;
              } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                  // Found complete JSON object
                  const jsonStr = buffer.substring(startIndex, i + 1);
                  try {
                    const json = JSON.parse(jsonStr);
                    // console.log('Final Gemini response:', JSON.stringify(json, null, 2));
                    
                    const textContent = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    
                    if (textContent) {
                      // console.log('Final extracted text content:', textContent);
                      const formatted = `0:"${textContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
                      controller.enqueue(encoder.encode(formatted));
                    }
                  } catch (e) {
                    console.error('Failed to parse final JSON object:', e, jsonStr.substring(0, 200));
                  }
                  
                  // Update buffer start index
                  startIndex = i + 1;
                }
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

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting stream with model...', { provider, modelName });

          const { streamText } = await import('ai');

          const result = await streamText({
            model: model,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            messages: promptMessages as any,
            temperature,
            maxTokens,
          });

          console.log('Stream started successfully');

          for await (const chunk of result.fullStream) {
            if (chunk.type === 'text-delta') {
              const data = `0:"${chunk.textDelta.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
              controller.enqueue(encoder.encode(data));
            }
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
    
    // Return error as a stream so it appears in the chat UI
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const formattedError = `⚠️ **Error**: ${errorMessage}`;
        const chunk = `0:"${formattedError.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
        controller.enqueue(encoder.encode(chunk));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}
