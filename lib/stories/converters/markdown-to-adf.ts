/**
 * Markdown to Jira ADF (Atlassian Document Format) Converter
 * Converts Markdown content to Jira's native document format
 */

export interface ADFNode {
  type: string;
  attrs?: Record<string, any>;
  content?: ADFNode[];
  text?: string;
  marks?: Array<{
    type: string;
    attrs?: Record<string, any>;
  }>;
}

export interface ADFDocument {
  version: 1;
  type: 'doc';
  content: ADFNode[];
}

/**
 * Convert Markdown text to ADF format
 */
export function markdownToADF(markdown: string): ADFDocument {
  const lines = markdown.split('\n');
  const content: ADFNode[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) {
      i++;
      continue;
    }
    
    // Headers
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1;
      const text = line.replace(/^#+\s*/, '');
      content.push(createHeading(text, Math.min(level, 6)));
      i++;
      continue;
    }
    
    // Code blocks
    if (line.startsWith('```')) {
      const language = line.replace('```', '').trim();
      const codeLines: string[] = [];
      i++;
      
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      content.push(createCodeBlock(codeLines.join('\n'), language));
      i++; // Skip closing ```
      continue;
    }
    
    // Blockquotes
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].substring(1).trim());
        i++;
      }
      
      content.push(createBlockquote(quoteLines.join(' ')));
      continue;
    }
    
    // Horizontal rules
    if (line.match(/^[-*_]{3,}$/)) {
      content.push({ type: 'rule' });
      i++;
      continue;
    }
    
    // Bullet lists
    if (line.match(/^\s*[-*+]\s/)) {
      const listItems: ADFNode[] = [];
      
      while (i < lines.length && lines[i].match(/^\s*[-*+]\s/)) {
        const itemText = lines[i].replace(/^\s*[-*+]\s/, '');
        listItems.push(createListItem(parseInlineText(itemText)));
        i++;
      }
      
      content.push(createBulletList(listItems));
      continue;
    }
    
    // Numbered lists
    if (line.match(/^\s*\d+\.\s/)) {
      const listItems: ADFNode[] = [];
      
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s/)) {
        const itemText = lines[i].replace(/^\s*\d+\.\s/, '');
        listItems.push(createListItem(parseInlineText(itemText)));
        i++;
      }
      
      content.push(createOrderedList(listItems));
      continue;
    }
    
    // Regular paragraphs
    const paragraphLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !isSpecialLine(lines[i])) {
      paragraphLines.push(lines[i]);
      i++;
    }
    
    if (paragraphLines.length > 0) {
      const text = paragraphLines.join(' ');
      content.push(createParagraph(parseInlineText(text)));
    }
  }
  
  return {
    version: 1,
    type: 'doc',
    content
  };
}

/**
 * Parse inline text with formatting (bold, italic, code, links)
 */
function parseInlineText(text: string): ADFNode[] {
  const nodes: ADFNode[] = [];
  let currentText = '';
  let i = 0;
  
  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    // Bold (**text**)
    if (char === '*' && nextChar === '*') {
      if (currentText) {
        nodes.push({ type: 'text', text: currentText });
        currentText = '';
      }
      
      const endIndex = text.indexOf('**', i + 2);
      if (endIndex !== -1) {
        const boldText = text.substring(i + 2, endIndex);
        nodes.push({
          type: 'text',
          text: boldText,
          marks: [{ type: 'strong' }]
        });
        i = endIndex + 2;
        continue;
      }
    }
    
    // Italic (*text*)
    if (char === '*' && nextChar !== '*') {
      if (currentText) {
        nodes.push({ type: 'text', text: currentText });
        currentText = '';
      }
      
      const endIndex = text.indexOf('*', i + 1);
      if (endIndex !== -1) {
        const italicText = text.substring(i + 1, endIndex);
        nodes.push({
          type: 'text',
          text: italicText,
          marks: [{ type: 'em' }]
        });
        i = endIndex + 1;
        continue;
      }
    }
    
    // Inline code (`code`)
    if (char === '`') {
      if (currentText) {
        nodes.push({ type: 'text', text: currentText });
        currentText = '';
      }
      
      const endIndex = text.indexOf('`', i + 1);
      if (endIndex !== -1) {
        const codeText = text.substring(i + 1, endIndex);
        nodes.push({
          type: 'text',
          text: codeText,
          marks: [{ type: 'code' }]
        });
        i = endIndex + 1;
        continue;
      }
    }
    
    // Links [text](url)
    if (char === '[') {
      const closeBracket = text.indexOf(']', i);
      const openParen = text.indexOf('(', closeBracket);
      const closeParen = text.indexOf(')', openParen);
      
      if (closeBracket !== -1 && openParen === closeBracket + 1 && closeParen !== -1) {
        if (currentText) {
          nodes.push({ type: 'text', text: currentText });
          currentText = '';
        }
        
        const linkText = text.substring(i + 1, closeBracket);
        const linkUrl = text.substring(openParen + 1, closeParen);
        
        nodes.push({
          type: 'text',
          text: linkText,
          marks: [{
            type: 'link',
            attrs: { href: linkUrl }
          }]
        });
        
        i = closeParen + 1;
        continue;
      }
    }
    
    // Strikethrough (~~text~~)
    if (char === '~' && nextChar === '~') {
      if (currentText) {
        nodes.push({ type: 'text', text: currentText });
        currentText = '';
      }
      
      const endIndex = text.indexOf('~~', i + 2);
      if (endIndex !== -1) {
        const strikeText = text.substring(i + 2, endIndex);
        nodes.push({
          type: 'text',
          text: strikeText,
          marks: [{ type: 'strike' }]
        });
        i = endIndex + 2;
        continue;
      }
    }
    
    currentText += char;
    i++;
  }
  
  if (currentText) {
    nodes.push({ type: 'text', text: currentText });
  }
  
  return nodes;
}

/**
 * Check if a line is a special formatting line
 */
function isSpecialLine(line: string): boolean {
  return (
    line.startsWith('#') ||
    line.startsWith('```') ||
    line.startsWith('>') ||
    line.match(/^[-*_]{3,}$/) !== null ||
    line.match(/^\s*[-*+]\s/) !== null ||
    line.match(/^\s*\d+\.\s/) !== null
  );
}

/**
 * Create ADF heading node
 */
function createHeading(text: string, level: number): ADFNode {
  return {
    type: 'heading',
    attrs: { level },
    content: parseInlineText(text)
  };
}

/**
 * Create ADF paragraph node
 */
function createParagraph(content: ADFNode[]): ADFNode {
  return {
    type: 'paragraph',
    content
  };
}

/**
 * Create ADF code block node
 */
function createCodeBlock(code: string, language?: string): ADFNode {
  return {
    type: 'codeBlock',
    attrs: language ? { language } : {},
    content: [{
      type: 'text',
      text: code
    }]
  };
}

/**
 * Create ADF bullet list node
 */
function createBulletList(items: ADFNode[]): ADFNode {
  return {
    type: 'bulletList',
    content: items
  };
}

/**
 * Create ADF ordered list node
 */
function createOrderedList(items: ADFNode[]): ADFNode {
  return {
    type: 'orderedList',
    content: items
  };
}

/**
 * Create ADF list item node
 */
function createListItem(content: ADFNode[]): ADFNode {
  return {
    type: 'listItem',
    content: [{
      type: 'paragraph',
      content
    }]
  };
}

/**
 * Create ADF blockquote node
 */
function createBlockquote(text: string): ADFNode {
  return {
    type: 'blockquote',
    content: [{
      type: 'paragraph',
      content: parseInlineText(text)
    }]
  };
}

/**
 * Convert ADF document to JSON string
 */
export function adfToJson(adf: ADFDocument): string {
  return JSON.stringify(adf, null, 2);
}

/**
 * Parse JSON string to ADF document
 */
export function jsonToAdf(json: string): ADFDocument {
  try {
    return JSON.parse(json);
  } catch (error) {
    throw new Error(`Invalid ADF JSON: ${error}`);
  }
}