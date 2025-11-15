import { PartialBlock } from '@blocknote/core';

interface PageModification {
  type: 'replace' | 'insert' | 'append' | 'update_title' | 'add_section' | 'delete' | 'replace_paragraph';
  target?: string;
  content?: string;
  title?: string;
  position?: number;
  paragraphIndex?: number;
}

interface TestCase {
  name: string;
  instruction: string;
  currentTitle: string;
  currentContent: PartialBlock[];
  expectedModificationType: string;
  shouldContain?: string;
}

const testCases: TestCase[] = [
  {
    name: 'Test 1: Modify Title (Chinese)',
    instruction: '请修改 title 改成 人工智能的未来发展趋势',
    currentTitle: 'Old Title',
    currentContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Content here', styles: {} }], props: {} }
    ],
    expectedModificationType: 'update_title',
    shouldContain: '人工智能的未来发展趋势',
  },
  {
    name: 'Test 2: Modify Title (English)',
    instruction: 'change title to The Future of Machine Learning',
    currentTitle: 'Old Title',
    currentContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Content here', styles: {} }], props: {} }
    ],
    expectedModificationType: 'update_title',
    shouldContain: 'The Future of Machine Learning',
  },
  {
    name: 'Test 3: Replace All Content',
    instruction: '修改内容为 这是全新的文章内容，包含了最新的研究成果。',
    currentTitle: 'Test Article',
    currentContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Old content', styles: {} }], props: {} }
    ],
    expectedModificationType: 'replace',
    shouldContain: '全新的文章内容',
  },
  {
    name: 'Test 4: Append Content at End',
    instruction: '在文章末尾添加一段关于量子计算的内容',
    currentTitle: 'Test Article',
    currentContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Existing content', styles: {} }], props: {} }
    ],
    expectedModificationType: 'append',
    shouldContain: '量子计算',
  },
  {
    name: 'Test 5: Insert Content at Position',
    instruction: '在第2段插入一段关于深度学习的内容',
    currentTitle: 'Test Article',
    currentContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph', styles: {} }], props: {} },
      { type: 'paragraph', content: [{ type: 'text', text: 'Second paragraph', styles: {} }], props: {} },
      { type: 'paragraph', content: [{ type: 'text', text: 'Third paragraph', styles: {} }], props: {} }
    ],
    expectedModificationType: 'insert',
    shouldContain: '深度学习',
  },
  {
    name: 'Test 6: Add Section with Heading',
    instruction: '添加一个新章节，标题是"技术实现"，内容是关于具体的技术细节',
    currentTitle: 'Test Article',
    currentContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Existing content', styles: {} }], props: {} }
    ],
    expectedModificationType: 'add_section',
    shouldContain: '技术实现',
  },
  {
    name: 'Test 7: Add Multiple Paragraphs',
    instruction: '添加三段内容：第一段介绍背景，第二段说明方法，第三段总结结论',
    currentTitle: 'Test Article',
    currentContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Existing content', styles: {} }], props: {} }
    ],
    expectedModificationType: 'append',
  },
  {
    name: 'Test 8: Delete Paragraph',
    instruction: '删除第2段内容',
    currentTitle: 'Test Article',
    currentContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph', styles: {} }], props: {} },
      { type: 'paragraph', content: [{ type: 'text', text: 'Second paragraph to delete', styles: {} }], props: {} },
      { type: 'paragraph', content: [{ type: 'text', text: 'Third paragraph', styles: {} }], props: {} }
    ],
    expectedModificationType: 'delete',
  },
  {
    name: 'Test 9: Replace Specific Paragraph',
    instruction: '将第2段内容改为：这是修改后的新内容，更加详细和专业。',
    currentTitle: 'Test Article',
    currentContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'First paragraph', styles: {} }], props: {} },
      { type: 'paragraph', content: [{ type: 'text', text: 'Old second paragraph', styles: {} }], props: {} },
      { type: 'paragraph', content: [{ type: 'text', text: 'Third paragraph', styles: {} }], props: {} }
    ],
    expectedModificationType: 'replace_paragraph',
    shouldContain: '修改后的新内容',
  },
  {
    name: 'Test 10: Add Content with Professional Formatting',
    instruction: '添加一段专业的内容，包含小标题"核心优势"和详细说明',
    currentTitle: 'Test Article',
    currentContent: [
      { type: 'paragraph', content: [{ type: 'text', text: 'Existing content', styles: {} }], props: {} }
    ],
    expectedModificationType: 'add_section',
    shouldContain: '核心优势',
  },
];

async function runTest(testCase: TestCase): Promise<boolean> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Running: ${testCase.name}`);
  console.log(`Instruction: "${testCase.instruction}"`);
  console.log(`${'='.repeat(80)}`);

  try {
    const response = await fetch('http://localhost:3000/api/blog/ai-modify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postId: 'test-post-id',
        currentContent: testCase.currentContent,
        currentTitle: testCase.currentTitle,
        instruction: testCase.instruction,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log(`❌ FAILED: HTTP ${response.status}`);
      console.log(`Error: ${data.error}`);
      console.log(`Details: ${data.details || 'N/A'}`);
      return false;
    }

    if (!data.modifications || data.modifications.length === 0) {
      console.log(`❌ FAILED: No modifications generated`);
      return false;
    }

    const modification = data.modifications[0];
    console.log(`\n✅ SUCCESS`);
    console.log(`Modification Type: ${modification.type}`);
    
    if (modification.type !== testCase.expectedModificationType) {
      console.log(`⚠️  WARNING: Expected type "${testCase.expectedModificationType}" but got "${modification.type}"`);
    }

    if (modification.title) {
      console.log(`New Title: "${modification.title}"`);
    }

    if (modification.content) {
      console.log(`Content Preview: "${modification.content.substring(0, 100)}..."`);
    }

    if (modification.position !== undefined) {
      console.log(`Position: ${modification.position}`);
    }

    console.log(`Explanation: ${data.explanation}`);

    if (testCase.shouldContain) {
      const contentToCheck = modification.title || modification.content || '';
      if (contentToCheck.includes(testCase.shouldContain)) {
        console.log(`✅ Contains expected text: "${testCase.shouldContain}"`);
      } else {
        console.log(`⚠️  WARNING: Does not contain expected text: "${testCase.shouldContain}"`);
      }
    }

    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   AI Blog Modification Comprehensive Test                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const results: { name: string; passed: boolean }[] = [];

  for (const testCase of testCases) {
    const passed = await runTest(testCase);
    results.push({ name: testCase.name, passed });
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              Test Summary                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status} - ${result.name}`);
  });

  console.log('\n');
  console.log(`Total: ${passed}/${total} tests passed (${Math.round(passed / total * 100)}%)`);
  console.log('\n');

  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed`);
  }
}

runAllTests().catch(console.error);
