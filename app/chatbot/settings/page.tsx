"use client";

import { useState } from "react";
import { useAISettings } from "@/lib/useAISettings";
import { AI_PROVIDERS, getModelById } from "@/lib/aiConfig";
import Sidebar from "@/components/Sidebar";
import Breadcrumb from "@/components/Breadcrumb";
import { useRouter, usePathname } from "next/navigation";

interface SidebarPage {
  id: string;
  title: string;
  icon?: string;
  href?: string;
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const { settings, updateSettings, setApiKey, getApiKey, setSelectedModel, resetSettings } = useAISettings();
  const [testStatus, setTestStatus] = useState<{[key: string]: 'idle' | 'testing' | 'success' | 'error'}>({});
  const [testMessage, setTestMessage] = useState<{[key: string]: string}>({});

  const currentModel = getModelById(settings.selectedModel);
  const currentProvider = AI_PROVIDERS.find(p => p.id === currentModel?.provider);

  // Determine activePageId based on pathname
  const activePageId = pathname === "/chatbot/settings" ? "settings" : "chatbot";

  const pages: SidebarPage[] = [
    { id: "chatbot", title: "AI Chatbot", icon: "🤖", href: "/chatbot" },
    { id: "settings", title: "Settings", icon: "⚙️", href: "/chatbot/settings" },
  ];

  // Dynamically generate breadcrumb items
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Chatbot", href: "/chatbot", icon: "💬" },
  ];

  if (pathname === "/chatbot/settings") {
    breadcrumbItems.push({ label: "Settings", href: "/chatbot/settings", icon: "⚙️" });
  }

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

  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedTestModel, setSelectedTestModel] = useState<string>("");
  const [apiKeyInput, setApiKeyInput] = useState<string>("");

  const handleTestConnection = async (providerId: string, testModelId?: string) => {
    const apiKey = getApiKey(providerId);
    if (!apiKey) return;

    setTestStatus(prev => ({ ...prev, [providerId]: 'testing' }));
    setTestMessage(prev => ({ ...prev, [providerId]: '' }));

    try {
      const provider = AI_PROVIDERS.find(p => p.id === providerId);
      const testModel = testModelId
        ? provider?.models.find(m => m.id === testModelId)
        : provider?.models[0];

      if (!testModel) {
        throw new Error('No test model available');
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId: testModel.id,
          messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
          temperature: 0.7,
          maxTokens: 50,
          apiKey: apiKey
        }),
      });

      if (response.ok) {
        setTestStatus(prev => ({ ...prev, [providerId]: 'success' }));
        setTestMessage(prev => ({ ...prev, [providerId]: 'Connection successful!' }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Connection failed');
      }
    } catch (error) {
      setTestStatus(prev => ({ ...prev, [providerId]: 'error' }));
      setTestMessage(prev => ({
        ...prev,
        [providerId]: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        title="AI Assistant"
        icon="🤖"
        pages={pages}
        activePageId={activePageId}
        onSelectPage={handleSelectPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        className="top-16"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64 lg:ml-64">
        <div
          className={`fixed top-16 left-0 right-0 z-40 bg-white/30 backdrop-blur-md border-b border-gray-200 md:left-64 lg:left-64 transition-all duration-300`}
        >
          <div className="p-4 md:pl-4 lg:pl-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

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

        {/* Content area that handles its own scrolling and padding */}
        <div className="flex-1 flex flex-col overflow-hidden pt-[calc(4rem+1px)] md:pt-[calc(4rem+1px)]">
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-900">AI Settings</h1>
                  <p className="text-gray-600 mt-1">Configure your AI models and API keys</p>
                </div>

                <div className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Model</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">{currentModel?.name}</h3>
                    <p className="text-sm text-blue-700">{currentProvider?.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-600">
                      {currentModel?.isFree ? 'Free' : `$${currentModel?.pricing.input}/1K input`}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentModel?.capabilities.map(cap => (
                        <span key={cap} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected Model</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-green-900">{currentModel?.name || 'No model selected'}</h3>
                    <p className="text-sm text-green-700">{currentProvider?.name || 'Please select a model'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-600">
                      {currentModel?.isFree ? 'Free' : currentModel ? `$${currentModel?.pricing.input}/1K input` : 'N/A'}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentModel?.capabilities.map(cap => (
                        <span key={cap} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Selection</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {AI_PROVIDERS.map(provider => (
                  <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">{provider.name}</h3>
                    <div className="space-y-2">
                      {provider.models.map(model => (
                        <div
                          key={model.id}
                          className={`p-3 border rounded cursor-pointer transition-colors ${
                            settings.selectedModel === model.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleModelChange(model.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-sm">{model.name}</div>
                              <div className="text-xs text-gray-500">{model.description}</div>
                            </div>
                            <div className="text-right">
                              {model.isFree ? (
                                <span className="text-green-600 text-xs font-medium">Free</span>
                              ) : (
                                <span className="text-gray-600 text-xs">
                                  ${model.pricing.input}/1K
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {model.capabilities.slice(0, 3).map(cap => (
                              <span key={cap} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">API Keys</h2>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Provider
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => {
                        setSelectedProvider(e.target.value);
                        setSelectedTestModel("");
                        setApiKeyInput("");
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Provider</option>
                      {AI_PROVIDERS.filter(p => p.apiKeyRequired).map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Model
                    </label>
                    <select
                      value={selectedTestModel}
                      onChange={(e) => setSelectedTestModel(e.target.value)}
                      disabled={!selectedProvider}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Model</option>
                      {selectedProvider && AI_PROVIDERS.find(p => p.id === selectedProvider)?.models.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Enter API key"
                      disabled={!selectedProvider}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => {
                      if (selectedProvider && apiKeyInput && selectedTestModel) {
                        handleApiKeyChange(selectedProvider, apiKeyInput);
                        handleTestConnection(selectedProvider, selectedTestModel);
                      }
                    }}
                    disabled={!selectedProvider || !apiKeyInput || !selectedTestModel || testStatus[selectedProvider] === 'testing'}
                    className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      testStatus[selectedProvider] === 'testing'
                        ? 'bg-gray-500'
                        : testStatus[selectedProvider] === 'success'
                        ? 'bg-green-600 hover:bg-green-700'
                        : testStatus[selectedProvider] === 'error'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {testStatus[selectedProvider] === 'testing' ? 'Testing...' : 'Test Connection'}
                  </button>

                  {testMessage[selectedProvider] && (
                    <p className={`text-sm ${
                      testStatus[selectedProvider] === 'success'
                        ? 'text-green-600'
                        : testStatus[selectedProvider] === 'error'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}>
                      {testMessage[selectedProvider]}
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Saved API Keys</h3>
                  <div className="space-y-2">
                    {AI_PROVIDERS.filter(p => p.apiKeyRequired && getApiKey(p.id)).map(provider => (
                      <div key={provider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                          <span className="text-xs text-gray-500">API Key configured</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTestConnection(provider.id, currentModel?.provider === provider.id ? currentModel.id : undefined)}
                            disabled={testStatus[provider.id] === 'testing'}
                            className={`px-3 py-1 text-xs rounded transition-colors disabled:opacity-50 ${
                              testStatus[provider.id] === 'testing'
                                ? 'bg-gray-400 text-white'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {testStatus[provider.id] === 'testing' ? 'Testing...' : 'Test'}
                          </button>
                          {testMessage[provider.id] && (
                            <span className={`text-xs ${
                              testStatus[provider.id] === 'success'
                                ? 'text-green-600'
                                : testStatus[provider.id] === 'error'
                                ? 'text-red-600'
                                : 'text-gray-600'
                            }`}>
                              {testStatus[provider.id] === 'success' ? '✓' : testStatus[provider.id] === 'error' ? '✗' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                API keys are stored locally in your browser and never sent to our servers.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generation Settings</h2>
              <div className="grid gap-4 md:grid-cols-2">
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
                    onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens: {settings.maxTokens}
                  </label>
                  <input
                    type="range"
                    min="256"
                    max="4096"
                    step="256"
                    value={settings.maxTokens}
                    onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Prompt</h2>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter system prompt..."
              />
            </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={resetSettings}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
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
  );
}