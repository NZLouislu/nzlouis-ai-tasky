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

        const testPrompt = "Say 'Hello! I am working correctly.' in one sentence.";
        console.log(`[test-model] Starting generation with prompt: "${testPrompt}"`);

        let responseText = '';

        if (provider === 'openrouter') {
            console.log(`[test-model] Using direct OpenRouter API`);

            const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
                    'X-Title': 'AI Tasky',
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [
                        { role: 'user', content: testPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 100,
                }),
            });

            if (!openrouterResponse.ok) {
                const errorText = await openrouterResponse.text();
                console.error(`[test-model] OpenRouter API error:`, errorText);

                if (openrouterResponse.status === 429) {
                    try {
                        const errorData = JSON.parse(errorText);
                        const providerMessage = errorData.error?.metadata?.raw || 'Rate limited';
                        throw new Error(`Rate limited: ${providerMessage}`);
                    } catch {
                        throw new Error('Rate limited. Please try again later.');
                    }
                }

                throw new Error(`OpenRouter API error: ${openrouterResponse.status}`);
            }

            const openrouterData = await openrouterResponse.json();

            const message = openrouterData.choices?.[0]?.message;

            if (message) {
                if (message.content && typeof message.content === 'string' && message.content.trim()) {
                    responseText = message.content;
                }
                else if (message.reasoning && typeof message.reasoning === 'string' && message.reasoning.trim()) {
                    responseText = message.reasoning;
                }
                else if (message.text && typeof message.text === 'string' && message.text.trim()) {
                    responseText = message.text;
                }
            }

            console.log(`[test-model] OpenRouter extracted text (${responseText.length} chars): "${responseText.substring(0, 100)}..."`);
        } else if (provider === 'google') {
            console.log(`[test-model] Using direct Gemini API`);

            const { decryptAPIKey } = await import('@/lib/encryption');
            
            const { data: apiKeyRecord } = await taskyDb
                .from('user_api_keys')
                .select('key_encrypted, iv, auth_tag')
                .eq('user_id', session.user.id)
                .eq('provider', 'google')
                .single();

            if (!apiKeyRecord) {
                throw new Error('Google API key not found');
            }

            const apiKey = decryptAPIKey(
                apiKeyRecord.key_encrypted,
                apiKeyRecord.iv,
                apiKeyRecord.auth_tag
            );

            const modelMap: Record<string, string> = {
                'gemini-2.5-flash': 'gemini-2.5-flash',
                'gemini-2.5-flash-live': 'gemini-2.5-flash',
                'gemini-2.0-flash-live': 'gemini-2.0-flash',
                'gemini-2.0-flash-lite': 'gemini-2.0-flash',
                'gemini-2.0-flash': 'gemini-2.0-flash',
                'gemini-2.5-flash-lite': 'gemini-2.5-flash',
                'gemini-2.5-pro': 'gemini-2.5-pro',
                'gemini-1.5-flash': 'gemini-1.5-flash',
                'gemini-1.5-pro': 'gemini-1.5-pro',
            };

            const actualModel = modelMap[modelId] || modelId;
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent`;

            const geminiResponse = await fetch(`${url}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: testPrompt
                        }]
                    }]
                })
            });

            if (!geminiResponse.ok) {
                const errorText = await geminiResponse.text();
                console.error(`[test-model] Gemini API error:`, errorText);
                throw new Error(`Gemini API error: ${geminiResponse.status}`);
            }

            const geminiData = await geminiResponse.json();
            responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

            console.log(`[test-model] Gemini API extracted text: "${responseText}"`);
        } else {
            console.log(`[test-model] Using AI SDK for ${provider}`);

            const { getModel } = await import('@/lib/ai/models');
            const { generateText } = await import('ai');
            const model = await getModel(session.user.id, provider, modelId);

            console.log(`[test-model] Model instance created successfully`);

            const result = await generateText({
                model: model,
                prompt: testPrompt,
                temperature: 0.7,
                maxTokens: 100,
            });

            console.log(`[test-model] Generation completed. Result:`, {
                text: result.text,
                finishReason: result.finishReason,
                usage: result.usage,
            });

            responseText = result.text;

            console.log(`[test-model] AI SDK extracted text: "${responseText}"`);
        }

        console.log(`[test-model] Extracted response text: "${responseText}"`);

        if (!responseText || responseText.trim() === '') {
            console.error(`[test-model] Empty response detected`);

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
            }, { status: 500 });
        }

        console.log(`[test-model] Test successful. Response: "${responseText}"`);

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
