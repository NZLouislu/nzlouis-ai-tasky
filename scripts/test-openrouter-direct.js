// Direct test of OpenRouter API to see response structure
require('dotenv').config();

async function testOpenRouter() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error('OPENROUTER_API_KEY not found in .env');
        process.exit(1);
    }

    console.log('Testing OpenRouter API directly...\n');

    const models = [
        'openai/gpt-oss-20b:free',
        'tngtech/deepseek-r1t2-chimera:free',
    ];

    for (const model of models) {
        console.log(`\n=== Testing ${model} ===`);

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'AI Tasky Test',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'user', content: "Say 'Hello! I am working correctly.' in one sentence." }
                    ],
                    temperature: 0.7,
                    max_tokens: 100,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Error ${response.status}:`, errorText);
                continue;
            }

            const data = await response.json();
            console.log('\n📦 Full Response:');
            console.log(JSON.stringify(data, null, 2));

            const message = data.choices?.[0]?.message;
            console.log('\n📨 Message Object:');
            console.log(JSON.stringify(message, null, 2));

            const content = message?.content;
            console.log('\n📝 Content:');
            console.log(`Type: ${typeof content}`);
            console.log(`Value: "${content}"`);
            console.log(`Length: ${content?.length || 0}`);

            if (!content || content.trim() === '') {
                console.log('\n⚠️  Content is empty! Checking other fields...');
                console.log('Message keys:', Object.keys(message || {}));
            } else {
                console.log('\n✅ Content extracted successfully');
            }

        } catch (error) {
            console.error('❌ Request failed:', error.message);
        }

        // Wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

testOpenRouter();
