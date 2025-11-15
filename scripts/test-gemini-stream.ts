import { config } from 'dotenv';

config();

async function testGeminiStream() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('GOOGLE_API_KEY not found');
        return;
    }

    console.log('Testing Gemini streaming API...\n');
    console.log('API key:', apiKey.substring(0, 10) + '...\n');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                role: 'user',
                parts: [{ text: 'Say hello in one sentence.' }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 100,
            }
        })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('\nResponse body:\n');

    if (!response.body) {
        console.error('No response body');
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        console.log('Chunk received:', buffer);
        console.log('---');
    }

    console.log('\nFinal buffer:', buffer);
}

testGeminiStream().catch(console.error);
