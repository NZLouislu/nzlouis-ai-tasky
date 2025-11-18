'use client';

import { useState } from 'react';

const TEST_MODELS = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
    { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera', provider: 'openrouter' },
    { id: 'openai/gpt-oss-20b:free', name: 'GPT OSS 20B', provider: 'openrouter' },
];

interface TestResult {
    success: boolean;
    error?: string;
    response?: string;
    provider?: string;
    model?: string;
}

export default function TestModelsPage() {
    const [results, setResults] = useState<Record<string, TestResult>>({});
    const [testing, setTesting] = useState<Record<string, boolean>>({});

    const testModel = async (modelId: string) => {
        setTesting(prev => ({ ...prev, [modelId]: true }));

        try {
            const response = await fetch('/api/test-model', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelId }),
            });

            const data = await response.json();
            setResults(prev => ({ ...prev, [modelId]: data }));
        } catch (error) {
            setResults(prev => ({
                ...prev,
                [modelId]: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            }));
        } finally {
            setTesting(prev => ({ ...prev, [modelId]: false }));
        }
    };

    const testAll = async () => {
        for (const model of TEST_MODELS) {
            await testModel(model.id);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Model Testing Page</h1>

            <button
                onClick={testAll}
                className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={Object.values(testing).some(t => t)}
            >
                Test All Models
            </button>

            <div className="space-y-4">
                {TEST_MODELS.map(model => (
                    <div key={model.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="font-semibold">{model.name}</h3>
                                <p className="text-sm text-gray-600">{model.id}</p>
                                <p className="text-xs text-gray-500">Provider: {model.provider}</p>
                            </div>

                            <button
                                onClick={() => testModel(model.id)}
                                disabled={testing[model.id]}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                            >
                                {testing[model.id] ? 'Testing...' : 'Test'}
                            </button>
                        </div>

                        {results[model.id] && (
                            <div className={`mt-3 p-3 rounded ${results[model.id].success
                                ? 'bg-green-50 border border-green-200'
                                : 'bg-red-50 border border-red-200'
                                }`}>
                                {results[model.id].success ? (
                                    <div>
                                        <p className="text-green-800 font-semibold">✅ Success</p>
                                        <p className="text-sm mt-1 text-gray-700">
                                            Response: {results[model.id].response}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-red-800 font-semibold">❌ Failed</p>
                                        <p className="text-sm mt-1 text-gray-700">
                                            Error: {results[model.id].error}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
