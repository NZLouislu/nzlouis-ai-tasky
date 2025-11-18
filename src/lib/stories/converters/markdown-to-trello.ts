/**
 * Markdown to Trello Format Converter
 * Converts Markdown content to Trello card description format
 */

export interface TrelloCard {
  name: string;
  desc: string;
  labels?: string[];
  members?: string[];
  checklists?: TrelloChecklist[];
  due?: string;
  pos?: number;
}

export interface TrelloChecklist {
  name: string;
  items: TrelloChecklistItem[];
}

export interface TrelloChecklistItem {
  name: string;
  checked: boolean;
  pos?: number;
}

/**
 * Convert Markdown to Trello card description format
 */
export function markdownToTrello(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Skip empty lines
    if (!line.trim()) {
      result.push('');
      i++;
      continue;
    }
    
    // Headers - convert to bold text
    if (line.startsWith('#')) {
      const text = line.replace(/^#+\s*/, '');
      result.push('**' + text + '**');
      i++;
      continue;
    }
    
    // Code blocks - convert to preformatted text
    if (line.startsWith('```')) {
      result.push('```');
      i++;
      
      while (i < lines.length && !lines[i].startsWith('```')) {
        result.push(lines[i]);
        i++;
      }
      
      result.push('```');
      i++; // Skip closing ```
      continue;
    }
    
    // Lists - preserve as-is (Trello supports Markdown lists)
    if (line.match(/^\s*[-*+]\s/) || line.match(/^\s*\d+\.\s/)) {
      result.push(line);
      i++;
      continue;
    }
    
    // Regular paragraphs
    result.push(convertInlineMarkdown(line));
    i++;
  }
  
  return result.join('\n');
}

/**
 * Convert inline Markdown formatting for Trello
 */
function convertInlineMarkdown(text: string): string {
  // Trello supports basic Markdown, so most formatting can be preserved
  return text
    // Preserve bold
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    // Preserve italic
    .replace(/\*(.*?)\*/g, '*$1*')
    // Preserve inline code
    .replace(/`(.*?)`/g, '`$1`')
    // Preserve links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$1]($2)')
    // Convert strikethrough
    .replace(/~~(.*?)~~/g, '~~$1~~');
}

/**
 * Extract checklists from Markdown
 */
export function extractChecklistsFromMarkdown(markdown: string): TrelloChecklist[] {
  const lines = markdown.split('\n');
  const checklists: TrelloChecklist[] = [];
  let currentChecklist: TrelloChecklist | null = null;
  
  for (const line of lines) {
    // Task list items
    const taskMatch = line.match(/^\s*- \[([ x])\]\s*(.+)$/);
    if (taskMatch) {
      if (!currentChecklist) {
        currentChecklist = {
          name: 'Tasks',
          items: []
        };
      }
      
      currentChecklist.items.push({
        name: taskMatch[2].trim(),
        checked: taskMatch[1] === 'x',
        pos: currentChecklist.items.length + 1
      });
    } else if (currentChecklist && line.trim() === '') {
      // Empty line ends current checklist
      checklists.push(currentChecklist);
      currentChecklist = null;
    }
  }
  
  // Add final checklist if exists
  if (currentChecklist) {
    checklists.push(currentChecklist);
  }
  
  return checklists;
}

/**
 * Parse story content to extract Trello card data
 */
export function parseStoryToTrelloCard(storyMarkdown: string): TrelloCard {
  const lines = storyMarkdown.split('\n');
  let title = '';
  let description = '';
  const labels: string[] = [];
  const members: string[] = [];
  
  // Extract title (first non-empty line or first header)
  for (const line of lines) {
    if (line.trim()) {
      if (line.startsWith('#')) {
        title = line.replace(/^#+\s*/, '');
      } else {
        title = line.trim();
      }
      break;
    }
  }
  
  // Extract labels from Labels field
  const labelsMatch = storyMarkdown.match(/Labels:\s*\[([^\]]+)\]/);
  if (labelsMatch) {
    const labelText = labelsMatch[1];
    labels.push(...labelText.split(',').map(l => l.trim()));
  }
  
  // Extract assignees from Assignees field
  const assigneesMatch = storyMarkdown.match(/Assignees:\s*(.+)/);
  if (assigneesMatch) {
    const assigneeText = assigneesMatch[1];
    members.push(...assigneeText.split(',').map(a => a.trim()));
  }
  
  // Convert description to Trello format
  description = markdownToTrello(storyMarkdown);
  
  // Extract checklists
  const checklists = extractChecklistsFromMarkdown(storyMarkdown);
  
  return {
    name: title || 'Untitled Story',
    desc: description,
    labels,
    members,
    checklists: checklists.length > 0 ? checklists : undefined
  };
}

/**
 * Handle character limits for Trello card descriptions
 */
export function truncateForTrello(text: string, maxLength: number = 16384): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Try to truncate at a word boundary
  const truncated = text.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Convert priority text to Trello label
 */
export function priorityToTrelloLabel(priority: string): string {
  const priorityMap: Record<string, string> = {
    'high': 'p1',
    'medium': 'p2', 
    'low': 'p3',
    'critical': 'p1',
    'urgent': 'p1'
  };
  
  return priorityMap[priority.toLowerCase()] || 'p2';
}

/**
 * Extract due date from story content
 */
export function extractDueDate(storyMarkdown: string): string | undefined {
  const dueDateMatch = storyMarkdown.match(/Due:\s*(\d{4}-\d{2}-\d{2})/);
  if (dueDateMatch) {
    return dueDateMatch[1];
  }
  
  const deadlineMatch = storyMarkdown.match(/Deadline:\s*(\d{4}-\d{2}-\d{2})/);
  if (deadlineMatch) {
    return deadlineMatch[1];
  }
  
  return undefined;
}

/**
 * Validate Trello card data
 */
export function validateTrelloCard(card: TrelloCard): string[] {
  const errors: string[] = [];
  
  if (!card.name || card.name.trim().length === 0) {
    errors.push('Card name is required');
  }
  
  if (card.name && card.name.length > 16384) {
    errors.push('Card name exceeds maximum length (16384 characters)');
  }
  
  if (card.desc && card.desc.length > 16384) {
    errors.push('Card description exceeds maximum length (16384 characters)');
  }
  
  return errors;
}