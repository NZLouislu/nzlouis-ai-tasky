'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Save, Key, Settings as SettingsIcon } from 'lucide-react';

const PROVIDERS = [
  { id: 'google', name: 'Google Gemini' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic Claude' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'kilo', name: 'Kilo' },
];

const MODELS: Record<string, string[]> = {
  google: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-pro', 'gemini-2.5-flash'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1-mini'],
  anthropic: ['claude-4-opus', 'claude-sonnet', 'claude-haiku'],
  openrouter: ['deepseek-r1-free', 'deepseek-v3-free', 'deepseek-r1', 'deepseek-v3'],
  kilo: ['xai-grok-code-fast-1', 'claude-sonnet-4'],
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState({
    defaultProvider: 'google',
    defaultModel: 'gemini-1.5-flash',
    temperature: 0.8,
    maxTokens: 1024,
    systemPrompt: 'You are a helpful AI assistant.',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (session?.user) {
      loadSettings();
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
                <div key={provider.id} className="flex gap-2">
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
                      defaultModel: MODELS[e.target.value][0],
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
                    <option key={model} value={model}>
                      {model}
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
      </div>
    </div>
  );
}
