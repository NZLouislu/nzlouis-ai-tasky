// Test script to verify AI SDK usage
require('dotenv').config();
const { streamText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');

async function testStreamText() {
  console.log('Testing AI SDK streamText...\n');
  console.log('API Key exists:', !!process.env.GOOGLE_API_KEY);
  
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY
  });
  
  const model = google('models/gemini-2.5-flash-preview-05-20');
  
  console.log('Creating streamText result...');
  const resultPromise = streamText({
    model,
    messages: [{ role: 'user', content: 'Say hello in 5 words' }],
  });
  
  console.log('\nResult is a Promise. Checking Promise properties:');
  console.log('Available methods on promise:');
  console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(resultPromise)));
  
  // Check if there are any immediate properties
  console.log('\nDirect properties on promise:');
  const props = Object.getOwnPropertyNames(resultPromise);
  props.forEach(prop => {
    console.log(`  ${prop}: ${typeof resultPromise[prop]}`);
  });
  
  console.log('\n--- Awaiting the promise to see what it resolves to ---\n');
  
  try {
    const result = await resultPromise;
    
    console.log('Resolved result type:', typeof result);
    console.log('\nAvailable properties on resolved result:');
    const resultProps = Object.getOwnPropertyNames(result);
    resultProps.forEach(prop => {
      console.log(`  ${prop}: ${typeof result[prop]}`);
    });
    
    console.log('\nAvailable methods (functions only):');
    resultProps.forEach(prop => {
      if (typeof result[prop] === 'function') {
        console.log(`  ✓ ${prop}()`);
      }
    });
    
    // Check prototype methods
    console.log('\nPrototype methods:');
    const protoProps = Object.getOwnPropertyNames(Object.getPrototypeOf(result));
    protoProps.forEach(prop => {
      if (typeof result[prop] === 'function') {
        console.log(`  ✓ ${prop}()`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testStreamText().catch(console.error);
