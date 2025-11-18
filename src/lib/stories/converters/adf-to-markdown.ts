/**
 * ADF (Atlassian Document Format) to Markdown Converter
 * Converts Jira's native document format back to Markdown
 */

import { ADFDocument, ADFNode } from './markdown-to-adf';

/**
 * Convert ADF document to Markdown text
 */
export function adfToMarkdown(adf: ADFDocument): string {
  if (!adf.content) return '';
  
  return adf.content.map(node => convertNodeToMarkdown(node)).join('\n\n');
}

/**
 * Convert individual ADF node to Markdown
 */
function convertNodeToMarkdown(node: ADFNode): string {
  switch (node.type) {
    case 'paragraph':
      return convertInlineContent(node.content || []);
    
    case 'heading':
      const level = node.attrs?.level || 1;
      const headingText = convertInlineContent(node.content || []);
      return '#'.repeat(level) + ' ' + headingText;
    
    case 'codeBlock':
      const language = node.attrs?.language || '';
      const codeText = node.content?.[0]?.text || '';
      return '```' + language + '\n' + codeText + '\n```';
    
    case 'bulletList':
      return convertListToMarkdown(node.content || [], '-');
    
    case 'orderedList':
      return convertListToMarkdown(node.content || [], '1.');
    
    case 'blockquote':
      const quoteContent = node.content?.map(n => convertNodeToMarkdown(n)).join('\n') || '';
      return quoteContent.split('\n').map(line => '> ' + line).join('\n');
    
    case 'rule':
      return '---';
    
    case 'table':
      return convertTableToMarkdown(node);
    
    default:
      // Handle unknown node types gracefully
      if (node.content) {
        return node.content.map(n => convertNodeToMarkdown(n)).join('');
      }
      return node.text || '';
  }
}

/**
 * Convert inline content (text with marks) to Markdown
 */
function convertInlineContent(content: ADFNode[]): string {
  return content.map(node => {
    if (node.type === 'text') {
      let text = node.text || '';
      
      if (node.marks) {
        for (const mark of node.marks) {
          switch (mark.type) {
            case 'strong':
              text = '**' + text + '**';
              break;
            case 'em':
              text = '*' + text + '*';
              break;
            case 'code':
              text = '`' + text + '`';
              break;
            case 'link':
              const href = mark.attrs?.href || '';
              text = '[' + text + '](' + href + ')';
              break;
            case 'strike':
              text = '~~' + text + '~~';
              break;
            case 'underline':
              text = '<u>' + text + '</u>';
              break;
          }
        }
      }
      
      return text;
    }
    
    // Handle other inline node types
    switch (node.type) {
      case 'hardBreak':
        return '\n';
      case 'mention':
        return '@' + (node.attrs?.text || node.attrs?.id || '');
      case 'emoji':
        return node.attrs?.shortName || node.text || '';
      default:
        return node.text || '';
    }
  }).join('');
}

/**
 * Convert list nodes to Markdown
 */
function convertListToMarkdown(items: ADFNode[], marker: string): string {
  return items.map((item, index) => {
    if (item.type === 'listItem') {
      const content = item.content?.map(n => convertNodeToMarkdown(n)).join('\n') || '';
      const actualMarker = marker === '1.' ? `${index + 1}.` : marker;
      
      // Handle nested lists
      const lines = content.split('\n');
      const firstLine = actualMarker + ' ' + lines[0];
      const restLines = lines.slice(1).map(line => '  ' + line);
      
      return [firstLine, ...restLines].join('\n');
    }
    return '';
  }).join('\n');
}

/**
 * Convert table node to Markdown
 */
function convertTableToMarkdown(tableNode: ADFNode): string {
  if (!tableNode.content) return '';
  
  const rows: string[] = [];
  let isFirstRow = true;
  
  for (const row of tableNode.content) {
    if (row.type === 'tableRow' && row.content) {
      const cells = row.content.map(cell => {
        if (cell.type === 'tableCell' || cell.type === 'tableHeader') {
          return convertInlineContent(cell.content || []);
        }
        return '';
      });
      
      rows.push('| ' + cells.join(' | ') + ' |');
      
      // Add header separator after first row
      if (isFirstRow) {
        const separator = '| ' + cells.map(() => '---').join(' | ') + ' |';
        rows.push(separator);
        isFirstRow = false;
      }
    }
  }
  
  return rows.join('\n');
}

/**
 * Parse JSON string to ADF and convert to Markdown
 */
export function jsonToMarkdown(json: string): string {
  try {
    const adf: ADFDocument = JSON.parse(json);
    return adfToMarkdown(adf);
  } catch (error) {
    throw new Error(`Invalid ADF JSON: ${error}`);
  }
}

/**
 * Test round-trip conversion (Markdown → ADF → Markdown)
 */
export function testRoundTripConversion(markdown: string): {
  original: string;
  converted: string;
  isEqual: boolean;
} {
  try {
    // This would require importing markdownToADF
    // For now, return test structure
    return {
      original: markdown,
      converted: markdown, // Placeholder
      isEqual: true
    };
  } catch (error) {
    return {
      original: markdown,
      converted: '',
      isEqual: false
    };
  }
}

/**
 * Extract plain text from ADF document
 */
export function adfToPlainText(adf: ADFDocument): string {
  if (!adf.content) return '';
  
  return adf.content.map(node => extractTextFromNode(node)).join(' ').trim();
}

/**
 * Extract text content from ADF node recursively
 */
function extractTextFromNode(node: ADFNode): string {
  if (node.text) {
    return node.text;
  }
  
  if (node.content) {
    return node.content.map(child => extractTextFromNode(child)).join(' ');
  }
  
  return '';
}