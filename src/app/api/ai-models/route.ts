import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { taskyDb } from "@/lib/supabase/tasky-db-client";
import { getUserIdFromRequest } from "@/lib/admin-auth";

const MODEL_CONFIGS = {
    google: [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Latest Gemini model with fast responses' },
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview (Paid API Required)', description: 'Advanced reasoning model - Requires paid API key ($2/M input, $12/M output tokens)' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced reasoning and coding' },
        { id: 'gemini-2.5-flash-live', name: 'Gemini 2.5 Flash Live', description: 'Real-time conversation model' },
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', description: 'Lightweight version of 2.5 Flash' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast and efficient model' },
        { id: 'gemini-2.0-flash-live', name: 'Gemini 2.0 Flash Live', description: 'Real-time conversation model' },
        { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Lightweight fast model' },
    ],
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable GPT-4 model' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Faster and more affordable' },
        { id: 'o3-mini', name: 'O3 Mini', description: 'Optimized reasoning model' },
        { id: 'o1-mini', name: 'O1 Mini', description: 'Compact reasoning model' },
    ],
    anthropic: [
        { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', description: 'The latest Claude Sonnet model' },
        { id: 'claude-4-opus', name: 'Claude 4 Opus', description: 'Most powerful Claude model' },
        { id: 'claude-sonnet', name: 'Claude Sonnet', description: 'Hybrid reasoning and coding for regular use' },
        { id: 'claude-haiku', name: 'Claude Haiku', description: 'Fast and efficient' },
    ],
    openrouter: [
        { id: 'openai/gpt-oss-20b:free', name: 'GPT OSS 20B Free', description: 'Free open-source GPT model' },
        { id: 'tngtech/deepseek-r1t2-chimera:free', name: 'DeepSeek R1T2 Chimera Free', description: 'Free reasoning model variant' },
        { id: 'tngtech/deepseek-r1t-chimera:free', name: 'DeepSeek R1T Chimera Free', description: 'Free reasoning model' },
        { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat V3 Free', description: 'Free chat model' },
        { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 Free', description: 'Free reasoning model' },
        { id: 'qwen/qwen3-coder:free', name: 'Qwen3 Coder Free', description: 'Free coding model' },
    ],
    kilo: [
        { id: 'xai-grok-code-fast-1', name: 'Grok Code Fast', description: 'Fast coding assistant' },
        { id: 'claude-sonnet-4', name: 'Claude Sonnet 4', description: 'Via Kilo platform' },
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
            const providerModels = MODEL_CONFIGS[provider as keyof typeof MODEL_CONFIGS] || [];
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

        return NextResponse.json({ models });
    } catch (error) {
        console.error('Error fetching AI models:', error);
        return NextResponse.json(
            { error: "Failed to fetch AI models" },
            { status: 500 }
        );
    }
}
