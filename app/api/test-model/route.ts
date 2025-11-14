import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { taskyDb } from "@/lib/supabase/tasky-db-client";
import { AIProvider } from "@/lib/ai/providers";

const MODEL_PROVIDER_MAP: Record<string, AIProvider> = {
    'gemini-2.5-flash': 'google',
    'gemini-2.5-flash-live': 'google',
    'gemini-2.0-flash-live': 'google',
    'gemini-2.0-flash-lite': 'google',
    'gemini-2.0-flash': 'google',
    'gemini-2.5-flash-lite': 'google',
    'gemini-2.5-pro': 'google',
    'gemini-1.5-flash': 'google',
    'gemini-1.5-pro': 'google',
    'gpt-4o': 'openai',
    'gpt-4o-mini': 'openai',
    'o3-mini': 'openai',
    'o1-mini': 'openai',
    'claude-sonnet-4.5': 'anthropic',
    'claude-4-opus': 'anthropic',
    'claude-sonnet': 'anthropic',
    'claude-haiku': 'anthropic',
    'openai/gpt-oss-20b:free': 'openrouter',
    'tngtech/deepseek-r1t2-chimera:free': 'openrouter',
    'tngtech/deepseek-r1t-chimera:free': 'openrouter',
    'deepseek/deepseek-chat-v3-0324:free': 'openrouter',
    'deepseek/deepseek-r1-0528:free': 'openrouter',
    'qwen/qwen3-coder:free': 'openrouter',
    'xai-grok-code-fast-1': 'kilo',
    'claude-sonnet-4': 'kilo',
};

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let modelId: string | undefined;

    try {
        const requestData = await req.json();
        modelId = requestData.modelId;
        console.log(`[test-model] Testing model: ${modelId}`);

        if (!modelId) {
            return NextResponse.json(
                { error: "Missing modelId" },
                { status: 400 }
            );
        }

        const provider = MODEL_PROVIDER_MAP[modelId];
        if (!provider) {
            return NextResponse.json(
                { error: `Unknown model: ${modelId}` },
                { status: 400 }
            );
        }

        console.log(`[test-model] Provider: ${provider}, Model: ${modelId}`);

        const { data: keyData } = await taskyDb
            .from('user_api_keys')
            .select('provider')
            .eq('user_id', session.user.id)
            .eq('provider', provider)
            .single();

        if (!keyData) {
            return NextResponse.json(
                { error: `API key not configured for ${provider}` },
                { status: 400 }
            );
        }

        console.log(`[test-model] API key found for provider: ${provider}`);

        const { getModel } = await import('@/lib/ai/models');
        const model = await getModel(session.user.id, provider, modelId);

        console.log(`[test-model] Model instance created successfully`);

        const testPrompt = "Say 'Hello! I am working correctly.' in one sentence.";

        console.log(`[test-model] Starting generation with prompt: "${testPrompt}"`);

        const result = await model.doGenerate({
            inputFormat: 'messages' as const,
            mode: { type: 'regular' as const },
            prompt: [
                {
                    role: 'user' as const,
                    content: [{ type: 'text' as const, text: testPrompt }],
                },
            ],
            temperature: 0.7,
            maxTokens: 100,
        });

        console.log(`[test-model] Generation completed. Result:`, {
            text: result.text,
            finishReason: result.finishReason,
            usage: result.usage,
            response: result.response,
            rawResponse: result.rawResponse
        });

        // Extract response text from the correct location
        let responseText = '';
        
        // Try different possible locations for the response text
        if (result.text) {
            responseText = result.text;
        }

        console.log(`[test-model] Extracted response text: "${responseText}"`);

        if (!responseText || responseText.trim() === '') {
            console.error(`[test-model] Empty response detected. Full result:`, result);
            
            // Save failed test result
            try {
                await taskyDb
                    .from('model_test_results')
                    .upsert({
                        user_id: session.user.id,
                        model_id: modelId,
                        success: false,
                        tested_at: new Date().toISOString(),
                    }, {
                        onConflict: 'user_id,model_id'
                    });
            } catch (dbError) {
                console.warn('Failed to save test result to database:', dbError);
            }

            return NextResponse.json({
                success: false,
                error: 'Model returned empty response',
                debug: {
                    resultKeys: Object.keys(result),
                    text: result.text,
                    finishReason: result.finishReason,
                    usage: result.usage
                }
            }, { status: 500 });
        }

        console.log(`[test-model] Test successful. Response: "${responseText}"`);

        // Save successful test result
        try {
            await taskyDb
                .from('model_test_results')
                .upsert({
                    user_id: session.user.id,
                    model_id: modelId,
                    success: true,
                    tested_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id,model_id'
                });
        } catch (dbError) {
            console.warn('Failed to save test result to database:', dbError);
        }

        return NextResponse.json({
            success: true,
            provider,
            model: modelId,
            response: responseText,
        });
    } catch (error) {
        console.error('Model test error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        const errorMessage = error instanceof Error ? error.message : 'Test failed';

        // Save failed test result (only if modelId is available)
        if (modelId) {
            try {
                await taskyDb
                    .from('model_test_results')
                    .upsert({
                        user_id: session.user.id,
                        model_id: modelId,
                        success: false,
                        tested_at: new Date().toISOString(),
                    }, {
                        onConflict: 'user_id,model_id'
                    });
            } catch (dbError) {
                console.warn('Failed to save test result to database:', dbError);
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
                debug: {
                    errorType: error instanceof Error ? error.constructor.name : typeof error,
                    errorMessage: errorMessage
                }
            },
            { status: 500 }
        );
    }
}
