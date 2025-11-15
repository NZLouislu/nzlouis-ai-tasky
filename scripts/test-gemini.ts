import { config } from 'dotenv';

config();

async function testGeminiDirect() {
    console.log('\n=== Testing Direct Gemini API ===');
    
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error('GOOGLE_API_KEY not found in environment');
        return;
    }
    
    console.log('Using API key:', apiKey.substring(0, 10) + '...');

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    try {
        const response = await fetch(`${url}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Say 'Hello! I am working correctly.' in one sentence."
                    }]
                }]
            })
        });

        const data = await response.json();
        console.log('Direct API Response:', JSON.stringify(data, null, 2));
        
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log('Extracted text:', text);
    } catch (error) {
        console.error('Direct API Error:', error);
    }
}

async function testGeminiWithAISDK() {
    console.log('\n=== Testing Gemini with AI SDK ===');
    
    try {
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const { generateText } = await import('ai');
        
        const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            console.error('GOOGLE_API_KEY not found');
            return;
        }
        
        console.log('Using API key:', apiKey.substring(0, 10) + '...');

        const google = createGoogleGenerativeAI({
            apiKey: apiKey,
        });

        const model = google('gemini-2.0-flash');
        
        console.log('Calling generateText...');
        const result = await generateText({
            model: model,
            prompt: "Say 'Hello! I am working correctly.' in one sentence.",
            temperature: 0.7,
            maxTokens: 100,
        });

        console.log('AI SDK Result:', {
            text: result.text,
            finishReason: result.finishReason,
            usage: result.usage,
        });
        
        console.log('Full result object keys:', Object.keys(result));
        console.log('\nResponse object:', JSON.stringify(result.response, null, 2));
        console.log('\nRaw response headers:', result.rawResponse?.headers);
        
        if (result.responseMessages && result.responseMessages.length > 0) {
            console.log('\nResponse messages:', JSON.stringify(result.responseMessages, null, 2));
        }
    } catch (error) {
        console.error('AI SDK Error:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
        }
    }
}

async function main() {
    console.log('Starting Gemini API tests...\n');
    
    await testGeminiDirect();
    await testGeminiWithAISDK();
    
    console.log('\n=== Tests Complete ===');
}

main().catch(console.error);
