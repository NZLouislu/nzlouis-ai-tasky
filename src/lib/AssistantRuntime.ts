interface PageModification {
  type: "add" | "edit" | "delete" | "create_page" | "set_title" | "add_heading" | "add_paragraph";
  target?: string;
  content?: string;
  title?: string;
}

interface AISettings {
  systemPrompt: string;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
}

interface AIModel {
  id: string;
  provider: string;
}

export async function sendChatMessage(
  text: string,
  image: string | undefined,
  settings: AISettings,
  getCurrentModel: () => AIModel | undefined,
  getApiKey: (provider: string) => string | null,
  onPageModification?: (modification: PageModification) => Promise<string>
): Promise<string> {
  const currentModel = getCurrentModel();
  if (!currentModel) {
    throw new Error("Please select a model in settings");
  }

  const apiKey = getApiKey(currentModel.provider);
  if (currentModel.provider !== "google" && !apiKey) {
    throw new Error(`Please set your ${currentModel.provider} API key in settings`);
  }

  try {
    const chatMessages = [
      { role: "system", content: settings.systemPrompt },
      {
        role: "user",
        content: text,
        ...(image && { image })
      }
    ];

    // Check for page modification commands
    const modification = parsePageModification(text);

    if (modification && onPageModification) {
      return await onPageModification(modification);
    } else {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          modelId: settings.selectedModel,
          messages: chatMessages,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          apiKey: apiKey
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      return data.response;
    }
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
}

function parsePageModification(text: string): PageModification | null {
  const lowerText = text.toLowerCase().trim();

  if (lowerText.startsWith("/add ")) {
    return { type: "add", content: text.substring(5).trim() };
  }
  if (lowerText.startsWith("/edit ")) {
    const parts = text.substring(6).split(" ");
    if (parts.length >= 2) {
      const target = parts[0];
      const content = parts.slice(1).join(" ");
      return { type: "edit", target, content };
    }
  }
  if (lowerText.startsWith("/delete ")) {
    return { type: "delete", target: text.substring(8).trim() };
  }
  if (lowerText.startsWith("/create page ")) {
    return { type: "create_page", title: text.substring(13).trim() };
  }
  if (lowerText.startsWith("/set title ")) {
    return { type: "set_title", title: text.substring(11).trim() };
  }
  if (lowerText.startsWith("/add heading ")) {
    return { type: "add_heading", content: text.substring(13).trim() };
  }
  if (lowerText.startsWith("/add paragraph ")) {
    return { type: "add_paragraph", content: text.substring(15).trim() };
  }

  return null;
}