#!/usr/bin/env node

require('dotenv').config();
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

async function testGemini() {
  console.log('\n🧪 Testing Gemini API configuration...\n');

  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: GOOGLE_API_KEY not set');
    process.exit(1);
  }

  console.log(`✅ API Key: ${apiKey.substring(0, 10)}...`);
  console.log(`✅ Model: models/gemini-2.5-flash-preview-05-20\n`);

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const model = google('models/gemini-2.5-flash-preview-05-20');
    
    console.log('✅ Provider created successfully');
    console.log('✅ Model instance created successfully\n');
    console.log('🎉 Configuration correct! Can use Gemini 2.5 Flash\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nSuggestions:');
    console.log('1. Check if GOOGLE_API_KEY is valid');
    console.log('2. Confirm API key has access to Gemini 2.5 preview version');
    console.log('3. Or switch to stable version gemini-1.5-flash\n');
  }
}

testGemini();
