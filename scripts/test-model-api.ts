/**
 * Test script for model API
 * Usage: npx tsx scripts/test-model-api.ts
 */

async function testModel(modelId: string, apiKey: string) {
    console.log(`\n=== Testing ${modelId} ===`);

    try {
        const response = await fetch('http://localhost:3000/api/test-model', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `authjs.session-token=${apiKey}`, // You'll need to get this from browser
            },
            body: JSON.stringify({ modelId }),
        });

        const data = await response.json();

        if (data.success) {
            console.log('✅ SUCCESS');
            console.log('Response:', data.response);
        } else {
            console.log('❌ FAILED');
            console.log('Error:', data.error);
            console.log('Debug:', data.debug);
        }
    } catch (error) {
        console.log('❌ REQUEST FAILED');
        console.error(error);
    }
}

async function main() {
    const models = [
        'gemini-2.5-flash',
        'tngtech/deepseek-r1t2-chimera:free',
        'openai/gpt-oss-20b:free',
    ];

    console.log('Model API Test Script');
    console.log('Make sure your dev server is running on http://localhost:3000');
    console.log('You need to manually set your session token in the script');

    // Get session token from browser cookies
    const sessionToken = process.env.SESSION_TOKEN || '';

    if (!sessionToken) {
        console.error('\n❌ Please set SESSION_TOKEN environment variable');
        console.log('Get it from browser cookies: authjs.session-token');
        process.exit(1);
    }

    for (const model of models) {
        await testModel(model, sessionToken);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
    }
}

main();
