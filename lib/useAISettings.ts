import { useState, useEffect } from "react";
import { AIModel, getModelById } from "./aiConfig";

interface DefaultApiKeys {
  google: string | null;
}

export interface AISettings {
  selectedModel: string;
  apiKeys: Record<string, string>;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const DEFAULT_SETTINGS: AISettings = {
  selectedModel: "gemini-2.5-pro",
  apiKeys: {},
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: "You are a helpful AI assistant.",
};

const STORAGE_KEY = "ai-chat-settings";

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [defaultKeys, setDefaultKeys] = useState<DefaultApiKeys>({
    google: null,
  });

  useEffect(() => {
    const fetchDefaultKeys = async () => {
      try {
        const response = await fetch("/api/default-keys");
        if (response.ok) {
          const keys = await response.json();
          setDefaultKeys(keys);
        }
      } catch (error) {
        console.error("Failed to fetch default API keys:", error);
      }
    };

    fetchDefaultKeys();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error("Failed to parse stored settings:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, isLoaded]);

  const updateSettings = (updates: Partial<AISettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const setApiKey = (providerId: string, apiKey: string) => {
    setSettings((prev) => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [providerId]: apiKey },
    }));
  };

  const getApiKey = (providerId: string): string => {
    const userKey = settings.apiKeys[providerId];
    if (userKey) {
      return userKey;
    }

    if (providerId === "google" && defaultKeys.google) {
      return defaultKeys.google;
    }

    return "";
  };

  const getCurrentModel = (): AIModel | undefined => {
    return getModelById(settings.selectedModel);
  };

  const setSelectedModel = (modelId: string) => {
    const model = getModelById(modelId);
    if (model) {
      setSettings((prev) => ({ ...prev, selectedModel: modelId }));
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    settings,
    isLoaded,
    defaultKeys,
    updateSettings,
    setApiKey,
    getApiKey,
    getCurrentModel,
    setSelectedModel,
    resetSettings,
  };
}
