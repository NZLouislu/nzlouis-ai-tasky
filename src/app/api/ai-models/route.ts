import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { taskyDb } from "@/lib/supabase/tasky-db-client";
import { getUserIdFromRequest } from "@/lib/admin-auth";

const MODEL_CONFIGS = {
    google: [
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Ultra Fast' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Fast' },
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', description: 'Paid API' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast' },
        { id: 'gemini-2.5-flash-live', name: 'Gemini 2.5 Flash Live', description: 'Realtime' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Lite' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Quick' },
    ],
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Flagship' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Affordable' },
        { id: 'o3-mini', name: 'O3 Mini', description: 'STEM' },
        { id: 'o1-mini', name: 'O1 Mini', description: 'Math/Code' },
    ],
    anthropic: [
        { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', description: 'Balanced' },
        { id: 'claude-4-opus', name: 'Claude 4 Opus', description: 'Powerful' },
        { id: 'claude-sonnet', name: 'Claude Sonnet', description: 'Versatile' },
        { id: 'claude-haiku', name: 'Claude Haiku', description: 'Fastest' },
    ],
    openrouter: [
        { id: 'mistralai/devstral-2512:free', name: 'Mistral Devstral 2512', description: 'Free Code Model' },
        { id: 'openai/gpt-oss-20b:free', name: 'GPT OSS 20B Free', description: 'Open' },
        { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera Free', description: 'Reasoning' },
        { id: 'tngtech/deepseek-r1t-chimera:free', name: 'DeepSeek R1T Chimera Free', description: 'Reasoning' },
        { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat V3 Free', description: 'Chat' },
        { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 Free', description: 'Reasoning' },
        { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder Free', description: 'Coding' },
    ],
    kilo: [
        { id: 'kilo/mistralai/devstral-2512:free', name: 'Mistral Devstral 2512', description: 'Free Code Model' },
        { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Kilo' },
    ],
};

export async function GET(req: NextRequest) {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);
    
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { data: keys, error } = await taskyDb
            .from('user_api_keys')
            .select('provider')
            .eq('user_id', userId);

        if (error) throw error;

        const configuredProviders = keys?.map(k => k.provider) || [];
        
        console.log('[API /ai-models] User ID:', userId);
        console.log('[API /ai-models] Configured providers from DB:', configuredProviders);

        const testResultsMap = new Map();
        try {
            const { data: testResults, error: testError } = await taskyDb
                .from('model_test_results')
                .select('model_id, success, tested_at')
                .eq('user_id', userId);

            if (testError) {
                console.warn('Failed to fetch test results:', testError);
            } else if (testResults) {
                testResults.forEach(result => {
                    testResultsMap.set(result.model_id, {
                        tested: true,
                        working: result.success,
                        testedAt: result.tested_at
                    });
                });
            }
        } catch (dbError) {
            console.warn('Database error when fetching test results:', dbError);
        }

        const models = configuredProviders.flatMap(provider => {
            console.log('[API /ai-models] Processing provider:', provider);
            const providerModels = MODEL_CONFIGS[provider as keyof typeof MODEL_CONFIGS] || [];
            console.log('[API /ai-models] Models for', provider, ':', providerModels.length, 'models');
            return providerModels.map(model => {
                const testResult = testResultsMap.get(model.id);
                return {
                    ...model,
                    provider,
                    tested: testResult?.tested || false,
                    working: testResult?.working || false,
                    testedAt: testResult?.testedAt || null
                };
            });
        });

        console.log('[API /ai-models] Total models to return:', models.length);
        console.log('[API /ai-models] Models:', models);

        return NextResponse.json({ models });
    } catch (error) {
        console.error('Error fetching AI models:', error);
        return NextResponse.json(
            { error: "Failed to fetch AI models" },
            { status: 500 }
        );
    }
}
