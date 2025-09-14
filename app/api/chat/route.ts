import { NextRequest, NextResponse } from "next/server";
import { getModelById, getProviderById } from "@/lib/aiConfig";

interface ChatRequest {
  modelId: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    image?: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  stream?: boolean;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  image?: string;
}

interface AIModel {
  id: string;
  provider: string;
}

async function callOpenAI(
  model: AIModel,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  apiKey: string,
  stream: boolean = false
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.image
          ? [
              { type: "text", text: msg.content },
              { type: "image_url", image_url: { url: msg.image } },
            ]
          : msg.content,
      })),
      temperature,
      max_tokens: maxTokens,
      stream,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  if (stream) {
    return response;
  }

  const data = await response.json();

  if (
    !data.choices ||
    !Array.isArray(data.choices) ||
    data.choices.length === 0
  ) {
    console.error(
      "OpenAI API response missing choices:",
      JSON.stringify(data, null, 2)
    );
    throw new Error("Invalid response from OpenAI API: no choices found");
  }

  const choice = data.choices[0];
  if (!choice.message || !choice.message.content) {
    console.error(
      "OpenAI API response missing message content:",
      JSON.stringify(choice, null, 2)
    );
    throw new Error(
      "Invalid response from OpenAI API: no message content found"
    );
  }

  return choice.message.content;
}

async function callGoogle(
  model: AIModel,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  apiKey: string,
  stream: boolean = false,
  retryCount = 0
) {
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: msg.image
      ? [
          { text: msg.content },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: msg.image.split(",")[1],
            },
          },
        ]
      : [{ text: msg.content }],
  }));

  const endpoint = stream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:streamGenerateContent?alt=sse&key=${apiKey}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          candidateCount: 1,
          stopSequences: [],
          topK: 40,
          topP: 0.95,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        console.log(
          `Google API rate limited, retrying in ${delay}ms (attempt ${
            retryCount + 1
          })`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return callGoogle(
          model,
          messages,
          temperature,
          maxTokens,
          apiKey,
          stream,
          retryCount + 1
        );
      }

      const errorBody = await response.text();
      console.error(
        `Google API error (status: ${response.status}):`,
        errorBody
      );

      if (response.status === 429) {
        throw new Error(
          "API requests rate limit exceeded. Please wait a moment and try again."
        );
      } else if (response.status === 403) {
        throw new Error(
          "Google API access forbidden. Please check your API key and permissions."
        );
      } else if (response.status === 401) {
        throw new Error(
          "Invalid Google API key. Please check your API key configuration."
        );
      } else {
        throw new Error(`Google API error: ${response.statusText}`);
      }
    }

    if (stream) {
      return response;
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !Array.isArray(data.candidates) ||
      data.candidates.length === 0
    ) {
      console.error(
        "Google API response missing candidates:",
        JSON.stringify(data, null, 2)
      );
      throw new Error("Invalid response from Google API: no candidates found");
    }

    const candidate = data.candidates[0];
    if (
      !candidate.content ||
      !candidate.content.parts ||
      !Array.isArray(candidate.content.parts) ||
      candidate.content.parts.length === 0
    ) {
      console.error(
        "Google API response missing content parts:",
        JSON.stringify(candidate, null, 2)
      );
      throw new Error(
        "Invalid response from Google API: no content parts found"
      );
    }

    const part = candidate.content.parts[0];
    if (!part.text) {
      console.error(
        "Google API response missing text:",
        JSON.stringify(part, null, 2)
      );
      throw new Error("Invalid response from Google API: no text found");
    }

    return part.text;
  } catch (error) {
    if (
      retryCount < 3 &&
      (error instanceof TypeError ||
        (error instanceof Error && error.message.includes("fetch")))
    ) {
      const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
      console.log(
        `Network error, retrying in ${delay}ms (attempt ${retryCount + 1})`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return callGoogle(
        model,
        messages,
        temperature,
        maxTokens,
        apiKey,
        stream,
        retryCount + 1
      );
    }
    throw error;
  }
}

async function callKilo(
  model: AIModel,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  apiKey: string
) {
  const response = await fetch("https://api.kilo.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
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

  // Validate response structure
  if (
    !data.choices ||
    !Array.isArray(data.choices) ||
    data.choices.length === 0
  ) {
    console.error(
      "Kilo API response missing choices:",
      JSON.stringify(data, null, 2)
    );
    throw new Error("Invalid response from Kilo API: no choices found");
  }

  const choice = data.choices[0];
  if (!choice.message || !choice.message.content) {
    console.error(
      "Kilo API response missing message content:",
      JSON.stringify(choice, null, 2)
    );
    throw new Error("Invalid response from Kilo API: no message content found");
  }

  return choice.message.content;
}

async function callOpenRouter(
  model: AIModel,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  apiKey: string
) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();

  // Validate response structure
  if (
    !data.choices ||
    !Array.isArray(data.choices) ||
    data.choices.length === 0
  ) {
    console.error(
      "OpenRouter API response missing choices:",
      JSON.stringify(data, null, 2)
    );
    throw new Error("Invalid response from OpenRouter API: no choices found");
  }

  const choice = data.choices[0];
  if (!choice.message || !choice.message.content) {
    console.error(
      "OpenRouter API response missing message content:",
      JSON.stringify(choice, null, 2)
    );
    throw new Error(
      "Invalid response from OpenRouter API: no message content found"
    );
  }

  return choice.message.content;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const {
      modelId,
      messages,
      temperature = 0.7,
      maxTokens = 2048,
      apiKey,
      stream = false,
    } = body;

    const model = getModelById(modelId);
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 400 });
    }

    const provider = getProviderById(model.provider);
    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 400 }
      );
    }

    if (provider.apiKeyRequired && !apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 400 });
    }

    if (stream && (provider.id === "google" || provider.id === "openai")) {
      let streamResponse;

      if (provider.id === "google") {
        streamResponse = await callGoogle(
          model,
          messages,
          temperature,
          maxTokens,
          apiKey!,
          true
        );
      } else {
        streamResponse = await callOpenAI(
          model,
          messages,
          temperature,
          maxTokens,
          apiKey!,
          true
        );
      }

      if (!(streamResponse instanceof Response)) {
        throw new Error("Expected Response object for streaming");
      }

      const streamTransform = new ReadableStream({
        async start(controller) {
          const reader = streamResponse.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");

              for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim();
                if (line.startsWith("data: ")) {
                  const dataStr = line.slice(6);
                  if (dataStr === "[DONE]") {
                    controller.enqueue("data: [DONE]\n\n");
                    continue;
                  }

                  try {
                    const data = JSON.parse(dataStr);
                    let text = "";

                    if (provider.id === "google") {
                      if (
                        data.candidates &&
                        data.candidates[0]?.content?.parts?.[0]?.text
                      ) {
                        text = data.candidates[0].content.parts[0].text;
                      }
                    } else if (provider.id === "openai") {
                      if (data.choices && data.choices[0]?.delta?.content) {
                        text = data.choices[0].delta.content;
                      }
                    }

                    if (text) {
                      // Send immediately without waiting
                      controller.enqueue(
                        `data: ${JSON.stringify({ text })}\n\n`
                      );
                    }
                  } catch {
                    // Ignore parsing errors for incomplete chunks
                  }
                }
              }

              buffer = lines[lines.length - 1];
            }

            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(streamTransform, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    let response: string;

    switch (provider.id) {
      case "openai":
        response = await callOpenAI(
          model,
          messages,
          temperature,
          maxTokens,
          apiKey!,
          false
        );
        break;
      case "google":
        response = await callGoogle(
          model,
          messages,
          temperature,
          maxTokens,
          apiKey!,
          false
        );
        break;
      case "kilo":
        response = await callKilo(
          model,
          messages,
          temperature,
          maxTokens,
          apiKey!
        );
        break;
      case "openrouter":
        response = await callOpenRouter(
          model,
          messages,
          temperature,
          maxTokens,
          apiKey!
        );
        break;
      default:
        return NextResponse.json(
          { error: "Unsupported provider" },
          { status: 400 }
        );
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
