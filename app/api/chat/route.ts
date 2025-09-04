import { NextRequest, NextResponse } from 'next/server';
import { getModelById, getProviderById } from '@/lib/aiConfig';

interface ChatRequest {
  modelId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    image?: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string;
}

interface AIModel {
  id: string;
  provider: string;
}

async function callOpenAI(model: AIModel, messages: ChatMessage[], temperature: number, maxTokens: number, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.image
          ? [{ type: 'text', text: msg.content }, { type: 'image_url', image_url: { url: msg.image } }]
          : msg.content
      })),
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGoogle(model: AIModel, messages: ChatMessage[], temperature: number, maxTokens: number, apiKey: string) {
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: msg.image
      ? [{ text: msg.content }, { inline_data: { mime_type: 'image/jpeg', data: msg.image.split(',')[1] } }]
      : [{ text: msg.content }]
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callKilo(model: AIModel, messages: ChatMessage[], temperature: number, maxTokens: number, apiKey: string) {
  const response = await fetch('https://api.kilo.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`Kilo API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callOpenRouter(model: AIModel, messages: ChatMessage[], temperature: number, maxTokens: number, apiKey: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { modelId, messages, temperature = 0.7, maxTokens = 2048, apiKey } = body;

    const model = getModelById(modelId);
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 400 });
    }

    const provider = getProviderById(model.provider);
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 400 });
    }

    if (provider.apiKeyRequired && !apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    let response: string;

    switch (provider.id) {
      case 'openai':
        response = await callOpenAI(model, messages, temperature, maxTokens, apiKey!);
        break;
      case 'google':
        response = await callGoogle(model, messages, temperature, maxTokens, apiKey!);
        break;
      case 'kilo':
        response = await callKilo(model, messages, temperature, maxTokens, apiKey!);
        break;
      case 'openrouter':
        response = await callOpenRouter(model, messages, temperature, maxTokens, apiKey!);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}