export interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  supportsImages: boolean;
  supportsVision: boolean;
  maxTokens: number;
  pricing: {
    input: number;
    output: number;
  };
  capabilities: string[];
  isFree: boolean;
  description: string;
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyRequired: boolean;
  models: AIModel[];
  description: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openrouter",
    name: "OpenRouter Free Models",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyRequired: true,
    description: "Free models available via OpenRouter",
    models: [
      {
        id: "deepseek-r1",
        name: "DeepSeek R1",
        provider: "openrouter",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0, output: 0 },
        capabilities: ["chat", "reasoning"],
        isFree: true,
        description: "Free reasoning model",
      },
      {
        id: "deepseek-v3",
        name: "DeepSeek V3",
        provider: "openrouter",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0, output: 0 },
        capabilities: ["chat"],
        isFree: true,
        description: "General-purpose model",
      },
      {
        id: "moonshot-kimi-k2",
        name: "MoonshotAI Kimi K2",
        provider: "openrouter",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0, output: 0 },
        capabilities: ["chat"],
        isFree: true,
        description: "MoonshotAI Kimi model",
      },
      {
        id: "qwen3-coder",
        name: "Qwen3 Coder",
        provider: "openrouter",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0, output: 0 },
        capabilities: ["chat", "code"],
        isFree: true,
        description: "Code-focused model",
      },
      {
        id: "kilo-claude",
        name: "Kilo Claude",
        provider: "openrouter",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0, output: 0 },
        capabilities: ["chat"],
        isFree: true,
        description: "Based on anthropic/claude-sonnet-4",
      },
      {
        id: "xai-grok",
        name: "xAI Grok",
        provider: "openrouter",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0, output: 0 },
        capabilities: ["chat", "code"],
        isFree: true,
        description: "Based on x-ai/grok-code-fast-1",
      },
    ],
  },
  {
    id: "google",
    name: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    apiKeyRequired: true,
    description: "Google’s latest Gemini and Imagen models",
    models: [
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        provider: "google",
        contextWindow: 1000000,
        supportsImages: true,
        supportsVision: true,
        maxTokens: 8192,
        pricing: { input: 0.00125, output: 0.005 },
        capabilities: ["text", "vision", "code", "reasoning"],
        isFree: false,
        description: "Advanced reasoning",
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        provider: "google",
        contextWindow: 1000000,
        supportsImages: true,
        supportsVision: true,
        maxTokens: 8192,
        pricing: { input: 0.000075, output: 0.0003 },
        capabilities: ["text", "vision", "code"],
        isFree: false,
        description: "Fast and efficient - Optimized for speed",
      },
      {
        id: "gemini-2.5-flash-lite",
        name: "Gemini 2.5 Flash-Lite",
        provider: "google",
        contextWindow: 1000000,
        supportsImages: true,
        supportsVision: true,
        maxTokens: 4096,
        pricing: { input: 0.00005, output: 0.0002 },
        capabilities: ["text", "vision"],
        isFree: false,
        description: "Lightweight fast model",
      },
      {
        id: "imagen-4",
        name: "Imagen 4",
        provider: "google",
        contextWindow: 0,
        supportsImages: true,
        supportsVision: false,
        maxTokens: 0,
        pricing: { input: 0.02, output: 0 },
        capabilities: ["image"],
        isFree: false,
        description: "Image generation model",
      },
      {
        id: "gemini-embeddings",
        name: "Gemini Embeddings",
        provider: "google",
        contextWindow: 0,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 0,
        pricing: { input: 0.0001, output: 0 },
        capabilities: ["embeddings"],
        isFree: false,
        description: "Embeddings model",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKeyRequired: true,
    description: "Latest GPT and o-series models",
    models: [
      {
        id: "gpt-4.1",
        name: "GPT-4.1",
        provider: "openai",
        contextWindow: 128000,
        supportsImages: true,
        supportsVision: true,
        maxTokens: 8192,
        pricing: { input: 0.005, output: 0.015 },
        capabilities: ["text", "vision", "reasoning", "code"],
        isFree: false,
        description: "Latest GPT-4.1 model",
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        provider: "openai",
        contextWindow: 128000,
        supportsImages: true,
        supportsVision: true,
        maxTokens: 8192,
        pricing: { input: 0.005, output: 0.015 },
        capabilities: ["text", "vision", "reasoning", "code"],
        isFree: false,
        description: "Omni model with multimodal support",
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "openai",
        contextWindow: 128000,
        supportsImages: true,
        supportsVision: true,
        maxTokens: 4096,
        pricing: { input: 0.00015, output: 0.0006 },
        capabilities: ["text", "vision", "code"],
        isFree: false,
        description: "Smaller omni model",
      },
      {
        id: "o3-mini",
        name: "o3 Mini",
        provider: "openai",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 4096,
        pricing: { input: 0.0005, output: 0.0015 },
        capabilities: ["text", "code"],
        isFree: false,
        description: "Optimized o3 mini model",
      },
      {
        id: "o1-mini",
        name: "o1 Mini",
        provider: "openai",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 4096,
        pricing: { input: 0.0005, output: 0.0015 },
        capabilities: ["text", "code"],
        isFree: false,
        description: "Optimized o1 mini model",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    baseUrl: "https://api.anthropic.com/v1",
    apiKeyRequired: true,
    description: "Claude series models from Anthropic",
    models: [
      {
        id: "claude-4-opus",
        name: "Claude 4 Opus",
        provider: "anthropic",
        contextWindow: 200000,
        supportsImages: true,
        supportsVision: true,
        maxTokens: 8192,
        pricing: { input: 0.005, output: 0.015 },
        capabilities: ["text", "vision", "reasoning"],
        isFree: false,
        description: "Most powerful Claude",
      },
      {
        id: "claude-4-sonnet",
        name: "Claude 4 Sonnet",
        provider: "anthropic",
        contextWindow: 200000,
        supportsImages: true,
        supportsVision: true,
        maxTokens: 8192,
        pricing: { input: 0.003, output: 0.015 },
        capabilities: ["text", "vision"],
        isFree: false,
        description: "Balanced Claude model",
      },
      {
        id: "claude-4-haiku",
        name: "Claude 4 Haiku",
        provider: "anthropic",
        contextWindow: 200000,
        supportsImages: true,
        supportsVision: true,
        maxTokens: 4096,
        pricing: { input: 0.001, output: 0.005 },
        capabilities: ["text"],
        isFree: false,
        description: "Fast Claude model",
      },
      {
        id: "claude-3.5",
        name: "Claude 3.5 Series",
        provider: "anthropic",
        contextWindow: 200000,
        supportsImages: true,
        supportsVision: true,
        maxTokens: 4096,
        pricing: { input: 0.002, output: 0.01 },
        capabilities: ["text"],
        isFree: false,
        description: "Previous Claude generation",
      },
    ],
  },
  {
    id: "others",
    name: "Other Popular Models",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKeyRequired: true,
    description: "Other models via OpenRouter",
    models: [
      {
        id: "groq",
        name: "Groq",
        provider: "others",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0.0002, output: 0.0008 },
        capabilities: ["chat"],
        isFree: false,
        description: "High-speed reasoning",
      },
      {
        id: "glm-4.5-air",
        name: "GLM 4.5 Air",
        provider: "others",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0.0002, output: 0.0008 },
        capabilities: ["chat"],
        isFree: false,
        description: "Chinese-friendly GLM model",
      },
      {
        id: "qwen3",
        name: "Qwen3 Series",
        provider: "others",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0.0002, output: 0.0008 },
        capabilities: ["chat"],
        isFree: false,
        description: "General-purpose Qwen3 models",
      },
      {
        id: "gemma-3",
        name: "Gemma 3 Series",
        provider: "others",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0.0002, output: 0.0008 },
        capabilities: ["chat"],
        isFree: false,
        description: "Google open source model",
      },
      {
        id: "hunyuan-a13b",
        name: "Hunyuan A13B Instruct",
        provider: "others",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0, output: 0 },
        capabilities: ["chat"],
        isFree: true,
        description: "Tencent Hunyuan instruct model",
      },
    ],
  },
  {
    id: "kilo",
    name: "Kilo Code",
    baseUrl: "https://api.kilo.ai/v1",
    apiKeyRequired: true,
    description: "Kilo models via OpenRouter",
    models: [
      {
        id: "xai-grok-code-fast-1",
        name: "x-ai Grok Code Fast 1",
        provider: "kilo",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0.0002, output: 0.0008 },
        capabilities: ["chat", "code"],
        isFree: false,
        description: "Code-focused Grok model",
      },
      {
        id: "anthropic-claude-sonnet-4",
        name: "Anthropic Claude Sonnet 4",
        provider: "kilo",
        contextWindow: 128000,
        supportsImages: false,
        supportsVision: false,
        maxTokens: 8192,
        pricing: { input: 0.003, output: 0.015 },
        capabilities: ["chat"],
        isFree: false,
        description: "Claude Sonnet 4",
      },
    ],
  },
];

export const getModelById = (modelId: string): AIModel | undefined => {
  for (const provider of AI_PROVIDERS) {
    const model = provider.models.find((m) => m.id === modelId);
    if (model) return model;
  }
  return undefined;
};

export const getProviderById = (providerId: string): AIProvider | undefined => {
  return AI_PROVIDERS.find((p) => p.id === providerId);
};

export const getAllModels = (): AIModel[] => {
  return AI_PROVIDERS.flatMap((provider) => provider.models);
};

export const getFreeModels = (): AIModel[] => {
  return getAllModels().filter((model) => model.isFree);
};

export const getVisionModels = (): AIModel[] => {
  return getAllModels().filter((model) => model.supportsVision);
};
