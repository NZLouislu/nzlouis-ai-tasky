const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=:#]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, '');
            process.env[key] = value;
        }
    });
}

// Test OpenRouter API directly
async function testOpenRouter() {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error('❌ OPENROUTER_API_KEY not found in environment');
        process.exit(1);
    }

    console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
    console.log('📡 Testing OpenRouter API...\n');

    const messages = [
        { role: 'user', content: 'Say "Hello, I am working!" in one sentence.' }
    ];

    const requestData = JSON.stringify({
        model: 'tngtech/deepseek-r1t2-chimera:free',
        messages: messages,
        temperature: 0.8,
        max_tokens: 100,
        stream: true
    });

    console.log('📤 Request payload:');
    console.log(JSON.stringify(JSON.parse(requestData), null, 2));
    console.log('\n🚀 Sending request...\n');

    const options = {
        hostname: 'openrouter.ai',
        port: 443,
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'AI Tasky Test',
            'Content-Length': Buffer.byteLength(requestData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            console.log('📥 Response status:', res.statusCode);
            console.log('📋 Response headers:', JSON.stringify(res.headers, null, 2));
            console.log('\n💬 Streaming response:\n');

            let buffer = '';
            let fullResponse = '';

            res.on('data', (chunk) => {
                const chunkStr = chunk.toString();
                console.log('📦 Raw chunk:', chunkStr.substring(0, 200));

                buffer += chunkStr;
                const lines = buffer.split('\n');

                // Keep the last incomplete line in buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();

                    if (trimmedLine.startsWith('data: ')) {
                        const data = trimmedLine.substring(6).trim();

                        if (data === '[DONE]') {
                            console.log('\n\n✅ Stream completed');
                            continue;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta;
                            // Try content first, then reasoning
                            const content = delta?.content || delta?.reasoning || '';
                            if (content) {
                                process.stdout.write(content);
                                fullResponse += content;
                            }
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                }
            });

            res.on('end', () => {
                console.log('\n\n📊 Test Results:');
                console.log('✅ Status:', res.statusCode === 200 ? 'SUCCESS' : 'FAILED');
                console.log('📝 Full response length:', fullResponse.length);
                console.log('💡 Response preview:', fullResponse.substring(0, 100));

                if (res.statusCode === 200 && fullResponse.length > 0) {
                    console.log('\n🎉 OpenRouter API is working correctly!');
                    resolve(true);
                } else {
                    console.log('\n❌ OpenRouter API test failed');
                    reject(new Error('API test failed'));
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request error:', error);
            reject(error);
        });

        req.write(requestData);
        req.end();
    });
}

// Run test
testOpenRouter()
    .then(() => {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    });
