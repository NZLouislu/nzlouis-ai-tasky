import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
        
        // Parse data URL
        if (msg.image.startsWith('data:')) {
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:streamGenerateContent?key=${apiKey}&alt=sse`,
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
      const error = await response.text();
      console.error('Gemini API error:', error);
      return new Response(JSON.stringify({ error: 'API call failed', details: error }), {
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
