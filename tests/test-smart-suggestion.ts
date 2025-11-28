/**
 * Smart Suggestion Application Feature - Test Script
 * 
 * Usage:
 * 1. Ensure the development server is running (npm run dev)
 * 2. Run this script in the browser console
 * 3. Or use Node.js: node test-smart-suggestion.ts
 */

// Test configuration
const API_URL = 'http://localhost:3000/api/blog/ai-modify';
const TEST_POST_ID = 'test-post-123';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BlockContent {
  type: string;
  text: string;
}

interface Block {
  type: string;
  props?: { level?: number };
  content: BlockContent[];
}

interface Modification {
  type: string;
  content?: string;
  title?: string;
}

interface APIResponse {
  modifications: Modification[];
  explanation: string;
}

interface TestCase {
  name: string;
  instruction: string;
  shouldDetect: boolean;
  expectedKeywords: string[];
}

// Mock chat history
const mockChatHistory: ChatMessage[] = [
  {
    role: 'user',
    content: 'How can I optimize this article about Mars exploration?'
  },
  {
    role: 'assistant',
    content: `I suggest the following optimizations for the article:

1. **Add SpaceX Mars Plan**
   - Introduce the Starship rocket system
   - Explain the 2026-2033 timeline
   - Discuss technical challenges

2. **Supplement technical details**
   - Mars atmospheric composition
   - Landing technology
   - Life support systems

3. **Add future outlook**
   - Human colonization plans
   - Scientific research objectives
   - International cooperation prospects

These contents will make the article more comprehensive and professional.`
  },
  {
    role: 'user',
    content: 'The first suggestion is great, can you elaborate?'
  },
  {
    role: 'assistant',
    content: `Details about SpaceX Mars Plan:

**Starship Rocket System**
- Height: approximately 120 meters
- Diameter: 9 meters
- Payload capacity: 100-150 tons
- Feature: Fully reusable

**Timeline**
- 2026: First unmanned missions
- 2028-2030: Establish fuel production facilities
- 2033: First crewed mission

**Technical Challenges**
- Radiation protection
- Microgravity effects
- Psychological stress
- Extreme temperatures (-63°C)
- Thin atmosphere (1% of Earth's)

This information can form a complete chapter.`
  }
];

// Mock article content
const mockContent: Block[] = [
  {
    type: 'heading',
    props: { level: 1 },
    content: [{ type: 'text', text: 'The Journey of Mars Exploration' }]
  },
  {
    type: 'paragraph',
    content: [{ type: 'text', text: 'Mars, the red planet, has always been a key target for human space exploration.' }]
  }
];

// Test cases
const testCases: TestCase[] = [
  {
    name: 'Test 1: Basic reference',
    instruction: 'Please modify the article based on your suggestions',
    shouldDetect: true,
    expectedKeywords: ['SpaceX', 'Starship', 'rocket']
  },
  {
    name: 'Test 2: Chinese variant',
    instruction: '按照你的建议来',
    shouldDetect: true,
    expectedKeywords: ['SpaceX']
  },
  {
    name: 'Test 3: English reference',
    instruction: 'Apply your suggestions',
    shouldDetect: true,
    expectedKeywords: ['SpaceX']
  },
  {
    name: 'Test 4: No reference',
    instruction: 'Add a paragraph about Mars',
    shouldDetect: false,
    expectedKeywords: ['Mars']
  },
  {
    name: 'Test 5: Partial application',
    instruction: 'Only apply the first suggestion',
    shouldDetect: true,
    expectedKeywords: ['SpaceX', 'Starship']
  }
];

// Execute tests
async function runTests(): Promise<void> {
  console.log('🚀 Starting smart suggestion application feature tests...\n');
  
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📝 ${testCase.name}`);
    console.log(`   Instruction: "${testCase.instruction}"`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: TEST_POST_ID,
          currentContent: mockContent,
          currentTitle: 'Mars Exploration',
          instruction: testCase.instruction,
          chatHistory: mockChatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data: APIResponse = await response.json();
      
      // Check if modifications were generated
      if (!data.modifications || data.modifications.length === 0) {
        console.log('   ⚠️  No modifications generated');
        failed++;
        continue;
      }

      // Check modification content
      const content = JSON.stringify(data.modifications);
      const hasExpectedKeywords = testCase.expectedKeywords.some(keyword => 
        content.includes(keyword)
      );

      if (hasExpectedKeywords) {
        console.log('   ✅ Passed');
        console.log(`   Generated ${data.modifications.length} modification(s)`);
        console.log(`   Explanation: ${data.explanation}`);
        passed++;
      } else {
        console.log('   ❌ Failed: Expected keywords not found');
        console.log(`   Expected: ${testCase.expectedKeywords.join(', ')}`);
        console.log(`   Actual content: ${content.substring(0, 100)}...`);
        failed++;
      }

    } catch (error) {
      console.log(`   ❌ Error: ${(error as Error).message}`);
      failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`   ❌ Failed: ${failed}/${testCases.length}`);
  console.log(`   Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
  
  if (passed === testCases.length) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed, please check the implementation');
  }
}

// Browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Running tests in browser');
  console.log('Please ensure you are logged in and have permission to access the API');
  console.log('\nPress Enter to start tests...');
  
  // Provide global function for manual invocation
  (window as any).testSmartSuggestion = runTests;
  console.log('💡 Tip: Run testSmartSuggestion() to start tests');
}

// Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  // Requires node-fetch
  runTests().catch(console.error);
}

// Export test function
if (typeof module !== 'undefined') {
  module.exports = { runTests, testCases };
}
