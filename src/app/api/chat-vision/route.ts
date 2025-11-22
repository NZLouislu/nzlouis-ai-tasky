import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, modelId } = body;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Determine model to use
    // Default to gemini-1.5-flash-latest which is a stable alias
    let modelName = 'gemini-1.5-flash-latest';
    
    if (modelId) {
      // Map user friendly names to actual API model names
      // We trust the modelId passed from the client, but handle specific aliases if needed
      if (modelId.includes('gemini-2.0-flash')) {
        modelName = 'gemini-2.0-flash-exp';
      } else if (modelId.includes('gemini-1.5-pro')) {
        modelName = 'gemini-1.5-pro-latest';
      } else if (modelId.includes('gemini-1.5-flash')) {
        modelName = 'gemini-1.5-flash-latest';
      } else {
        // For others (like gemini-2.5-flash or non-gemini models), try to use them directly
        // If it's a non-Gemini model (e.g. x-ai/grok), it will likely fail with 404 from Google API
        // We will catch this error and return a user-friendly message
        modelName = modelId;
      }
    }

    console.log(`Using Gemini model: ${modelName} (requested: ${modelId})`);

    // Convert messages to Gemini format
    const contents = [];
    
    for (const msg of messages) {
      const parts = [];
      
      // Add text first
      if (msg.content && msg.content.trim()) {
        parts.push({ text: msg.content });
      }
      
      // Add image if present
      if (msg.image) {
        let base64Data = msg.image;
        let mimeType = 'image/jpeg';
        
        // If it's a URL, fetch and convert to base64
        if (msg.image.startsWith('http://') || msg.image.startsWith('https://')) {
          try {
            console.log('Fetching image from URL:', msg.image);
            const imageResponse = await fetch(msg.image);
            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
            }
            
            const arrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            base64Data = buffer.toString('base64');
            
            // Get mime type from response or infer from URL
            mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
            console.log('Image converted to base64, mime type:', mimeType);
          } catch (error) {
            console.error('Failed to fetch image:', error);
            // Skip this image if fetch fails
            continue;
          }
        }
        // Parse data URL
        else if (msg.image.startsWith('data:')) {
          const matches = msg.image.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            mimeType = matches[1];
            base64Data = matches[2];
          }
        }
        
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data,
          },
        });
      }
      
      if (parts.length > 0) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts,
        });
      }
    }

    console.log('Calling Gemini API with', contents.length, 'messages');

    // Call Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      // Check for 404 (Model not found/supported) or 400 (Invalid argument)
      if (response.status === 404 || response.status === 400) {
        // Return a user-friendly error stream
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            const errorMessage = `⚠️ **Error**: The model \`${modelName}\` does not support image recognition or is not available in the Gemini API.\n\nPlease switch to a model that supports vision, such as **Gemini 1.5 Flash** or **Gemini 1.5 Pro**.`;
            const chunk = `0:"${errorMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
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

      return new Response(JSON.stringify({ error: 'API call failed', details: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i].trim();
              if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6);
                if (jsonStr === '[DONE]') continue;

                try {
                  const data = JSON.parse(jsonStr);
                  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    const chunk = `0:"${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`;
                    controller.enqueue(encoder.encode(chunk));
                  }
                } catch (e) {
                  console.error('Parse error:', e);
                }
              }
            }

            buffer = lines[lines.length - 1];
          }
        } catch (error) {
          console.error('Stream error:', error);
        } finally {
          controller.close();
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
    console.error('Chat vision API error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
