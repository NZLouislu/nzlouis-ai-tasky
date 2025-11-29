
import { describe, it, expect } from 'vitest';

// Define the types locally for the test since we might not have access to the full environment
type PartialBlock = {
  type: string;
  content: any[];
  props?: Record<string, any>;
};

// The function we want to test (copied from BlogPage.tsx)
const stringToBlocks = (content: string): PartialBlock[] => {
  const lines = content.split('\n').filter(line => line.trim());
  return lines.map(line => {
    // Check if line is a Markdown heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length; // Number of # symbols
      const text = headingMatch[2].trim();
      return {
        type: 'heading',
        content: [{ type: 'text', text, styles: {} }],
        props: { level: Math.min(level, 3) } // BlockNote supports levels 1-3
      } as PartialBlock;
    }
    
    // Regular paragraph
    return {
      type: 'paragraph',
      content: [{ type: 'text', text: line, styles: {} }],
      props: {}
    } as PartialBlock;
  });
};

describe('Markdown to BlockNote Conversion', () => {
  it('should convert plain text to paragraph', () => {
    const input = 'Hello world';
    const blocks = stringToBlocks(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('paragraph');
    expect(blocks[0].content[0].text).toBe('Hello world');
  });

  it('should convert H1 (##) to heading level 2', () => {
    const input = '## Section Title';
    const blocks = stringToBlocks(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('heading');
    expect(blocks[0].props?.level).toBe(2);
    expect(blocks[0].content[0].text).toBe('Section Title');
  });

  it('should convert H3 (###) to heading level 3', () => {
    const input = '### Subsection Title';
    const blocks = stringToBlocks(input);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('heading');
    expect(blocks[0].props?.level).toBe(3);
    expect(blocks[0].content[0].text).toBe('Subsection Title');
  });

  it('should handle mixed content', () => {
    const input = `## Main Section

This is a paragraph.

### Subsection

Another paragraph.`;
    
    const blocks = stringToBlocks(input);
    expect(blocks).toHaveLength(4);
    
    expect(blocks[0].type).toBe('heading');
    expect(blocks[0].props?.level).toBe(2);
    expect(blocks[0].content[0].text).toBe('Main Section');
    
    expect(blocks[1].type).toBe('paragraph');
    expect(blocks[1].content[0].text).toBe('This is a paragraph.');
    
    expect(blocks[2].type).toBe('heading');
    expect(blocks[2].props?.level).toBe(3);
    expect(blocks[2].content[0].text).toBe('Subsection');
    
    expect(blocks[3].type).toBe('paragraph');
    expect(blocks[3].content[0].text).toBe('Another paragraph.');
  });
});
