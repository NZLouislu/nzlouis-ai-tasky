# AI Integration Library

This directory contains the Vercel AI SDK integration for AI Tasky.

## Overview

The AI integration provides a unified interface for multiple AI providers with secure API key management and user-specific settings.

## Supported Providers

- **Google Gemini**: gemini-2.5-pro, gemini-2.5-flash, gemini-2.5-flash-lite
- **OpenAI**: gpt-4o, gpt-4o-mini, o3-mini, o1-mini
- **Anthropic**: claude-4-opus, claude-sonnet, claude-haiku
- **OpenRouter**: deepseek-r1, deepseek-v3, moonshot-kimi-k2, qwen3-coder
- **Kilo**: mistralai/devstral-2512:free, claude-sonnet-4

## Usage

### Get AI Model

```typescript
import { getModel } from "@/lib/ai";

// Get model for authenticated user
const model = await getModel(userId, "google", "gemini-2.5-flash");

// Get model with fallback to env vars (for unauthenticated)
const model = await getModel(undefined, "openai", "gpt-4o");
```

### Get User Settings

```typescript
import { getUserAISettings } from "@/lib/ai";

const settings = await getUserAISettings(userId);
// Returns: { defaultProvider, defaultModel, temperature, maxTokens, systemPrompt }
```

### Update User Settings

```typescript
import { updateUserAISettings } from "@/lib/ai";

await updateUserAISettings(userId, {
  defaultProvider: "openai",
  defaultModel: "gpt-4o",
  temperature: 0.7,
  maxTokens: 2048,
});
```

### Use in API Route

```typescript
import { streamText } from "ai";
import { getModel, getUserAISettings } from "@/lib/ai";

export async function POST(req: Request) {
  const { userId, messages } = await req.json();

  // Get user settings
  const settings = await getUserAISettings(userId);

  // Get model
  const model = await getModel(
    userId,
    settings.defaultProvider,
    settings.defaultModel
  );

  // Stream response
  const result = streamText({
    model,
    messages,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
  });

  return result.toDataStreamResponse();
}
```

## API Key Management

### User API Keys

User API keys are stored encrypted in the database:

```typescript
// Keys are automatically fetched and decrypted by getModel()
const model = await getModel(userId, "openai", "gpt-4o");
```

### Environment Variable Fallback

If no user API key is found, the system falls back to environment variables:

```env
OPENAI_API_KEY=sk-...
GOOGLE_API_KEY=...
ANTHROPIC_API_KEY=...
OPENROUTER_API_KEY=...
KILO_API_KEY=...
```

## Model Validation

```typescript
import { isValidModel, getAvailableModels } from "@/lib/ai";

// Check if model exists
if (isValidModel("google", "gemini-2.5-flash")) {
  // Model is valid
}

// Get all models for a provider
const models = getAvailableModels("openai");
// Returns: ['gpt-4.1', 'gpt-4o', 'gpt-4o-mini', ...]
```

## Error Handling

```typescript
try {
  const model = await getModel(userId, "openai", "gpt-4o");
} catch (error) {
  if (error.message.includes("No API key")) {
    // Handle missing API key
  } else if (error.message.includes("Unsupported provider")) {
    // Handle invalid provider
  }
}
```

## Security

- All user API keys are encrypted with AES-256-GCM
- Keys are decrypted only when needed
- Environment variables used as secure fallback
- User isolation: each user has their own keys

## Files

- `providers.ts` - Provider configuration and API key management
- `models.ts` - Model selection and validation
- `settings.ts` - User settings management
- `index.ts` - Barrel exports

## Testing

```bash
# Run AI integration tests
npm test -- ai-models.test.ts
npm test -- ai-providers.test.ts
```

## Next Steps

1. Integrate with frontend using Vercel AI SDK hooks (`useChat`)
2. Implement chat session persistence
3. Add more providers as needed
4. Enhance model selection UI
