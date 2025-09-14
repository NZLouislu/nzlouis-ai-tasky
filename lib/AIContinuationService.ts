import { sendChatMessage } from "./AssistantRuntime";

export interface ContinuationRequest {
  selectedText: string;
  contextBefore: string;
  contextAfter: string;
  action: "continue" | "rewrite" | "summarize" | "expand";
}

export interface ContinuationResponse {
  suggestion: string;
  confidence: number;
}

export class AIContinuationService {
  async generateContinuation(
    request: ContinuationRequest,
    settings: {
      systemPrompt: string;
      selectedModel: string;
      temperature: number;
      maxTokens: number;
    },
    getCurrentModel: () => { id: string; provider: string } | undefined,
    getApiKey: (provider: string) => string | null
  ): Promise<ContinuationResponse> {
    const { selectedText, contextBefore, contextAfter, action } = request;

    let prompt = "";

    switch (action) {
      case "continue":
        prompt = `Continue writing from the following text. Maintain the same style and tone:

Context before: "${contextBefore}"
Selected text: "${selectedText}"
Context after: "${contextAfter}"

Please continue the text naturally:`;
        break;

      case "rewrite":
        prompt = `Rewrite the following text to improve clarity and flow:

Selected text: "${selectedText}"

Rewritten version:`;
        break;

      case "summarize":
        prompt = `Summarize the following text concisely:

Selected text: "${selectedText}"

Summary:`;
        break;

      case "expand":
        prompt = `Expand on the following text with more details and examples:

Selected text: "${selectedText}"

Expanded version:`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    try {
      const response = await sendChatMessage(
        prompt,
        undefined,
        settings,
        getCurrentModel,
        getApiKey,
        undefined
      );

      return {
        suggestion: response,
        confidence: 0.8,
      };
    } catch (error) {
      console.error("AI continuation error:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("rate limit") ||
          error.message.includes("429")
        ) {
          throw new Error("请求过于频繁，请稍后再试");
        } else if (
          error.message.includes("quota") ||
          error.message.includes("RESOURCE_EXHAUSTED")
        ) {
          throw new Error("API配额已用完，请检查您的计划和计费");
        } else {
          throw error;
        }
      }

      throw new Error("生成AI建议失败");
    }
  }

  async getMultipleSuggestions(
    request: ContinuationRequest,
    settings: {
      systemPrompt: string;
      selectedModel: string;
      temperature: number;
      maxTokens: number;
    },
    getCurrentModel: () => { id: string; provider: string } | undefined,
    getApiKey: (provider: string) => string | null
  ): Promise<ContinuationResponse[]> {
    const suggestion = await this.generateContinuation(
      request,
      settings,
      getCurrentModel,
      getApiKey
    );

    return [suggestion];
  }
}

export const aiContinuationService = new AIContinuationService();
