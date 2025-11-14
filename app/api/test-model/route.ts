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

        // For OpenRouter, use direct API call
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

                // Handle rate limiting specifically
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

            // Extract content from OpenRouter response
            const message = openrouterData.choices?.[0]?.message;

            if (message) {
                // For reasoning models, content might be empty and actual response is in reasoning field
                if (message.content && typeof message.content === 'string' && message.content.trim()) {
                    responseText = message.content;
                }
                // Try reasoning field (for reasoning models like deepseek-r1)
                else if (message.reasoning && typeof message.reasoning === 'string' && message.reasoning.trim()) {
                    responseText = message.reasoning;
                }
                // Try text field as fallback
                else if (message.text && typeof message.text === 'string' && message.text.trim()) {
                    responseText = message.text;
                }
            }

            console.log(`[test-model] OpenRouter extracted text (${responseText.length} chars): "${responseText.substring(0, 100)}..."`);
        } else {
            // For other providers, use AI SDK
            console.log(`[test-model] Using AI SDK for ${provider}`);

            const { getModel } = await import('@/lib/ai/models');
            const model = await getModel(session.user.id, provider, modelId);

            console.log(`[test-model] Model instance created successfully`);

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
            });

            // Extract text from AI SDK result
            // Try result.text first
            if (result.text) {
                responseText = result.text;
            }
            // If text is undefined, try to extract from response parts
            else if ('response' in result && result.response) {
                const response = result.response as { messages?: Array<{ content?: Array<{ type: string; text?: string }> }> };
                const content = response.messages?.[0]?.content;
                if (content && Array.isArray(content)) {
                    for (const part of content) {
                        if (part.type === 'text' && part.text) {
                            responseText = part.text;
                            break;
                        }
                    }
                }
            }

            console.log(`[test-model] AI SDK extracted text: "${responseText}"`);
        }

        console.log(`[test-model] Extracted response text: "${responseText}"`);

        if (!responseText || responseText.trim() === '') {
            console.error(`[test-model] Empty response detected`);

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
