"use client";

import { useState } from "react";
import { useAISettings } from "@/lib/useAISettings";
import { AI_PROVIDERS, getModelById } from "@/lib/aiConfig";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";

interface SidebarPage {
  id: string;
  title: string;
  icon?: string;
  href?: string;
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  // const pathname = usePathname();

  const {
    settings,
    updateSettings,
    setApiKey,
    getApiKey,
    setSelectedModel,
    resetSettings,
    defaultKeys,
  } = useAISettings();
  const [testStatus, setTestStatus] = useState<{
    [key: string]: "idle" | "testing" | "success" | "error";
  }>({});
  const [testMessage, setTestMessage] = useState<{ [key: string]: string }>({});

  const currentModel = getModelById(settings.selectedModel);
  const currentProvider = AI_PROVIDERS.find(
    (p) => p.id === currentModel?.provider
  );

  // const activePageId =
  //   pathname === "/chatbot/settings" ? "settings" : "chatbot";

  const pages: SidebarPage[] = [
    {
      id: "chatbot",
      title: "Chatbot",
      icon: "🤖",
      href: "/chatbot",
    },
    {
      id: "settings",
      title: "Settings",
      icon: "⚙️",
      href: "/chatbot/settings",
    },
  ];

  const handleToggleSidebar = () => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(true);
      setSidebarOpen(false);
    }
  };

  const handleSelectPage = (pageId: string, href?: string) => {
    if (href) {
      router.push(href);
    }
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    setApiKey(providerId, apiKey);
  };

  // const [selectedProvider, setSelectedProvider] = useState<string>("");
  // const [selectedTestModel, setSelectedTestModel] = useState<string>("");
  // const [apiKeyInput, setApiKeyInput] = useState<string>("");

  const handleTestConnection = async (
    providerId: string,
    testModelId?: string
  ) => {
    const apiKey = getApiKey(providerId);
    if (!apiKey) return;

    setTestStatus((prev) => ({ ...prev, [providerId]: "testing" }));
    setTestMessage((prev) => ({ ...prev, [providerId]: "" }));

    try {
      const provider = AI_PROVIDERS.find((p) => p.id === providerId);
      const testModel = testModelId
        ? provider?.models.find((m) => m.id === testModelId)
        : provider?.models[0];

      if (!testModel) {
        throw new Error("No test model available");
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelId: testModel.id,
          messages: [
            { role: "user", content: "Hello, this is a test message." },
          ],
          temperature: 0.7,
          maxTokens: 50,
          apiKey: apiKey,
        }),
      });

      if (response.ok) {
        setTestStatus((prev) => ({ ...prev, [providerId]: "success" }));
        setTestMessage((prev) => ({
          ...prev,
          [providerId]: "Connection successful!",
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Connection failed");
      }
    } catch (error) {
      setTestStatus((prev) => ({ ...prev, [providerId]: "error" }));
      setTestMessage((prev) => ({
        ...prev,
        [providerId]:
          error instanceof Error ? error.message : "Connection failed",
      }));
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {!sidebarCollapsed && (
        <Sidebar
          title="AI Assistant"
          icon="🤖"
          pages={pages}
          activePageId="settings"
          onSelectPage={handleSelectPage}
          sidebarOpen={sidebarOpen}
          className="top-16"
          onCollapse={handleToggleSidebar}
        />
      )}

      {sidebarCollapsed && (
        <div className="fixed left-0 z-30 w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 transition-all duration-200 top-16 bottom-0">
          <button
            onClick={handleToggleSidebar}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Show sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      )}

      <div
        className={`flex-1 flex flex-col bg-white transition-all duration-200 ${
          sidebarCollapsed ? "ml-0 md:ml-12" : "ml-0 md:ml-64"
        }`}
        style={{ height: "calc(100vh - 64px)", marginTop: "64px" }}
      >
        <div className="md:hidden p-4 border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-900">
                    AI Settings
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Configure your AI models and API keys
                  </p>
                </div>

                <div className="p-6">
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Model Selection
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select AI Model
                          </label>
                          <select
                            value={settings.selectedModel}
                            onChange={(e) => handleModelChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {AI_PROVIDERS.map((provider) => (
                              <optgroup key={provider.id} label={provider.name}>
                                {provider.models.map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                          {currentModel && (
                            <p className="text-sm text-gray-500 mt-1">
                              Provider: {currentProvider?.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Generation Settings
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Temperature: {settings.temperature}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={settings.temperature}
                            onChange={(e) =>
                              updateSettings({
                                temperature: parseFloat(e.target.value),
                              })
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Focused</span>
                            <span>Balanced</span>
                            <span>Creative</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Tokens
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="4000"
                            value={settings.maxTokens}
                            onChange={(e) =>
                              updateSettings({
                                maxTokens: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        System Prompt
                      </h2>
                      <textarea
                        value={settings.systemPrompt}
                        onChange={(e) =>
                          updateSettings({ systemPrompt: e.target.value })
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter system prompt..."
                      />
                    </div>

                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        API Keys
                      </h2>
                      <div className="space-y-6">
                        {AI_PROVIDERS.map((provider) => (
                          <div
                            key={provider.id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-md font-medium text-gray-800">
                                {provider.name}
                              </h3>
                              <div className="flex items-center space-x-2">
                                {testStatus[provider.id] === "testing" && (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                )}
                                {testStatus[provider.id] === "success" && (
                                  <div className="text-green-600 text-sm">
                                    ✓
                                  </div>
                                )}
                                {testStatus[provider.id] === "error" && (
                                  <div className="text-red-600 text-sm">✗</div>
                                )}
                                <button
                                  onClick={() =>
                                    handleTestConnection(provider.id)
                                  }
                                  disabled={
                                    !getApiKey(provider.id) ||
                                    testStatus[provider.id] === "testing"
                                  }
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Test
                                </button>
                              </div>
                            </div>
                            <input
                              type="password"
                              placeholder={`Enter ${provider.name} API key`}
                              value={getApiKey(provider.id) || ""}
                              onChange={(e) =>
                                handleApiKeyChange(provider.id, e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {testMessage[provider.id] && (
                              <p
                                className={`text-sm mt-2 ${
                                  testStatus[provider.id] === "success"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {testMessage[provider.id]}
                              </p>
                            )}
                            {defaultKeys &&
                              provider.id in defaultKeys &&
                              (
                                defaultKeys as unknown as Record<
                                  string,
                                  string | null
                                >
                              )[provider.id] && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Using environment variable
                                </p>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        onClick={resetSettings}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Reset to Defaults
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
