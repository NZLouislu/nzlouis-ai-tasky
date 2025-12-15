'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Save, Key, Settings as SettingsIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const PROVIDERS = [
  { id: 'google', name: 'Google Gemini' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic Claude' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'kilo', name: 'Kilo' },
];

const MODELS: Record<string, Array<{ id: string; name: string }>> = {
  google: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-flash-live', name: 'Gemini 2.5 Flash Live' },
    { id: 'gemini-2.0-flash-live', name: 'Gemini 2.0 Flash Live' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'o3-mini', name: 'O3 Mini' },
    { id: 'o1-mini', name: 'O1 Mini' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5' },
    { id: 'claude-4-opus', name: 'Claude 4 Opus' },
    { id: 'claude-sonnet', name: 'Claude Sonnet' },
    { id: 'claude-haiku', name: 'Claude Haiku' },
  ],
  openrouter: [
    { id: 'openai/gpt-oss-20b:free', name: 'GPT OSS 20B Free' },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera Free' },
    { id: 'tngtech/deepseek-r1t-chimera:free', name: 'DeepSeek R1T Chimera Free' },
    { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat V3 Free' },
    { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 Free' },
    { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder Free' },
  ],
  kilo: [
    { id: 'kilo/mistralai/devstral-2512:free', name: 'Mistral Devstral 2512' },
    { id: 'claude-sonnet-4', name: 'Claude Sonnet 4' },
  ],
};

interface TestResult {
  provider: string;
  model: string;
  status: 'testing' | 'success' | 'error';
  message?: string;
  response?: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [configuredKeys, setConfiguredKeys] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    defaultProvider: 'google',
    defaultModel: 'gemini-2.5-flash',
    temperature: 0.8,
    maxTokens: 1024,
    systemPrompt: 'You are a helpful AI assistant.',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadSettings();
      loadConfiguredKeys();
    }
  }, [session]);

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/ai-settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadConfiguredKeys = async () => {
    try {
      const res = await fetch('/api/ai-keys');
      const data = await res.json();
      if (data.keys) {
        setConfiguredKeys(data.keys.map((k: { provider: string }) => k.provider));
      }
    } catch (error) {
      console.error('Failed to load configured keys:', error);
    }
  };

  const saveApiKey = async (provider: string) => {
    const apiKey = apiKeys[provider];
    if (!apiKey) return;

    try {
      const res = await fetch('/api/ai-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (res.ok) {
        setMessage(`${provider} API key saved successfully`);
        setApiKeys({ ...apiKeys, [provider]: '' });
        await loadConfiguredKeys();
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('Failed to save API key');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage('Settings saved successfully');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testModel = async (provider: string, modelId: string) => {
    const testKey = `${provider}-${modelId}`;

    setTestResults(prev => ({
      ...prev,
      [testKey]: {
        provider,
        model: modelId,
        status: 'testing',
      }
    }));

    try {
      const res = await fetch('/api/test-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestResults(prev => ({
          ...prev,
          [testKey]: {
            provider,
            model: modelId,
            status: 'success',
            response: data.response,
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [testKey]: {
            provider,
            model: modelId,
            status: 'error',
            message: data.error || 'Test failed',
          }
        }));
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testKey]: {
          provider,
          model: modelId,
          status: 'error',
          message: error instanceof Error ? error.message : 'Network error',
        }
      }));
    }
  };

  const testAllModels = async () => {
    setTesting(true);
    setTestResults({});

    for (const provider of configuredKeys) {
      const models = MODELS[provider] || [];
      for (const model of models) {
        await testModel(provider, model.id);
      }
    }

    setTesting(false);
  };

  const testProviderModels = async (provider: string) => {
    const models = MODELS[provider] || [];
    for (const model of models) {
      await testModel(provider, model.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon size={24} />
            <h1 className="text-2xl font-bold">AI Settings</h1>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
              {message}
            </div>
          )}

          {/* API Keys Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Key size={20} />
              <h2 className="text-xl font-semibold">API Keys</h2>
            </div>
            <div className="space-y-4">
              {PROVIDERS.map((provider) => (
                <div key={provider.id}>
                  <div className="flex gap-2 items-center">
                    <input
                      type="password"
                      placeholder={`${provider.name} API Key`}
                      value={apiKeys[provider.id] || ''}
                      onChange={(e) =>
                        setApiKeys({ ...apiKeys, [provider.id]: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => saveApiKey(provider.id)}
                      disabled={!apiKeys[provider.id]}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    {configuredKeys.includes(provider.id) && (
                      <span className="text-green-600 text-sm font-medium">✓ Configured</span>
                    )}
                  </div>
                  {configuredKeys.includes(provider.id) && (
                    <div className="mt-2 text-xs text-gray-600">
                      Available models: {MODELS[provider.id]?.map(m => m.name).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Model Settings */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Default Model</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Provider</label>
                <select
                  value={settings.defaultProvider}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultProvider: e.target.value,
                      defaultModel: MODELS[e.target.value][0]?.id || '',
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <select
                  value={settings.defaultModel}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultModel: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MODELS[settings.defaultProvider]?.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Parameters</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Temperature: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Tokens</label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxTokens: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">System Prompt</label>
                <textarea
                  value={settings.systemPrompt}
                  onChange={(e) =>
                    setSettings({ ...settings, systemPrompt: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {configuredKeys.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Test Models</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Verify that your configured API keys are working correctly
                </p>
              </div>
              <div className="flex gap-2">
                {Object.keys(testResults).length > 0 && (
                  <button
                    onClick={() => setTestResults({})}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear Results
                  </button>
                )}
                <button
                  onClick={testAllModels}
                  disabled={testing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {testing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test All Models'
                  )}
                </button>
              </div>
            </div>

            {Object.keys(testResults).length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <span className="font-medium">
                    {Object.values(testResults).filter(r => r.status === 'success').length} / {Object.keys(testResults).length} models passed
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {configuredKeys
              .sort((a, b) => {
                // Put Google Gemini first, then others
                if (a === 'google') return -1;
                if (b === 'google') return 1;
                // Put OpenRouter last
                if (a === 'openrouter') return 1;
                if (b === 'openrouter') return -1;
                return 0;
              })
              .map(provider => {
                const providerName = PROVIDERS.find(p => p.id === provider)?.name || provider;
                const models = MODELS[provider] || [];

                return (
                  <div key={provider} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{providerName}</h3>
                      {(provider === 'google' || provider === 'openrouter') && (
                        <button
                          onClick={() => testProviderModels(provider)}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          Test All {provider === 'google' ? 'Gemini' : 'OpenRouter'} Models
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {models.map(model => {
                        const testKey = `${provider}-${model.id}`;
                        const result = testResults[testKey];

                        return (
                          <div
                            key={model.id}
                            className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-colors ${result?.status === 'success'
                              ? 'bg-green-50 border-green-200'
                              : result?.status === 'error'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-gray-50 border-gray-200'
                              }`}
                          >
                            <div className="flex-shrink-0 mt-1">
                              {result?.status === 'testing' && (
                                <Loader2 size={24} className="animate-spin text-blue-600" />
                              )}
                              {result?.status === 'success' && (
                                <CheckCircle size={24} className="text-green-600" />
                              )}
                              {result?.status === 'error' && (
                                <XCircle size={24} className="text-red-600" />
                              )}
                              {!result && (
                                <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900">{model.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{model.id}</div>

                              {result?.status === 'success' && result.response && (
                                <div className="mt-2 p-3 bg-white rounded border border-green-200">
                                  <div className="text-xs font-medium text-green-700 mb-1">Response:</div>
                                  <div className="text-sm text-gray-700 break-words">{result.response}</div>
                                </div>
                              )}

                              {result?.status === 'error' && result.message && (
                                <div className="mt-2 p-3 bg-white rounded border border-red-200">
                                  <div className="text-xs font-medium text-red-700 mb-1">Error:</div>
                                  <div className="text-sm text-red-600 break-words">{result.message}</div>
                                </div>
                              )}

                              {result?.status === 'testing' && (
                                <div className="mt-2 text-sm text-blue-600">
                                  Testing model, please wait...
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => testModel(provider, model.id)}
                              disabled={result?.status === 'testing'}
                              className="flex-shrink-0 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {result?.status === 'testing' ? 'Testing...' : 'Test'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
