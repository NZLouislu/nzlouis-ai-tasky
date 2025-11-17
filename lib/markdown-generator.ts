import { prisma } from './prisma';

export interface ChatMessage {
  role: string;
  content: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  provider: string;
  model: string;
  createdAt: Date;
  messages: ChatMessage[];
}

/**
 * Generate Markdown from chat session
 */
export async function generateMarkdownFromSession(sessionId: string): Promise<string> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!session) {
    throw new Error('Session not found');
  }

  let markdown = `# ${session.title}\n\n`;
  markdown += `**Provider:** ${session.provider}\n`;
  markdown += `**Model:** ${session.model}\n`;
  markdown += `**Date:** ${session.createdAt.toLocaleDateString()}\n\n`;
  markdown += `---\n\n`;

  for (const message of session.messages) {
    if (message.role === 'user') {
      markdown += `## User\n\n${message.content}\n\n`;
    } else if (message.role === 'assistant') {
      markdown += `## Assistant\n\n${message.content}\n\n`;
    }
  }

  return markdown;
}

/**
 * Extract user stories from chat content
 */
export function extractUserStories(content: string): string[] {
  const stories: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Match patterns like "As a...", "User Story:", "Story:", etc.
    if (
      line.match(/^(As a|User Story:|Story:|\*\*Story)/i) ||
      line.match(/^\d+\.\s*(As a|User Story)/i)
    ) {
      stories.push(line.trim());
    }
  }
  
  return stories;
}

/**
 * Extract tasks from chat content
 */
export function extractTasks(content: string): string[] {
  const tasks: string[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Match checkbox patterns or numbered lists
    if (line.match(/^[-*]\s*\[[ x]\]/i) || line.match(/^\d+\.\s+/)) {
      tasks.push(line.trim());
    }
  }
  
  return tasks;
}

/**
 * Generate Jira-compatible markdown
 */
export function generateJiraMarkdown(session: ChatSession): string {
  let markdown = `h1. ${session.title}\n\n`;
  markdown += `*Provider:* ${session.provider}\n`;
  markdown += `*Model:* ${session.model}\n`;
  markdown += `*Date:* ${session.createdAt.toLocaleDateString()}\n\n`;
  markdown += `----\n\n`;

  for (const message of session.messages) {
    if (message.role === 'user') {
      markdown += `h2. User\n\n${convertToJiraFormat(message.content)}\n\n`;
    } else if (message.role === 'assistant') {
      markdown += `h2. Assistant\n\n${convertToJiraFormat(message.content)}\n\n`;
    }
  }

  return markdown;
}

/**
 * Convert Markdown to Jira format
 */
function convertToJiraFormat(content: string): string {
  let jira = content;
  
  // Headers
  jira = jira.replace(/^### (.*?)$/gm, 'h3. $1');
  jira = jira.replace(/^## (.*?)$/gm, 'h2. $1');
  jira = jira.replace(/^# (.*?)$/gm, 'h1. $1');
  
  // Bold
  jira = jira.replace(/\*\*(.*?)\*\*/g, '*$1*');
  
  // Italic
  jira = jira.replace(/\*(.*?)\*/g, '_$1_');
  
  // Code blocks
  jira = jira.replace(/```(\w+)?\n([\s\S]*?)```/g, '{code:$1}\n$2{code}');
  
  // Inline code
  jira = jira.replace(/`(.*?)`/g, '{{$1}}');
  
  // Lists
  jira = jira.replace(/^- /gm, '* ');
  
  return jira;
}

/**
 * Generate Trello-compatible markdown
 */
export function generateTrelloMarkdown(session: ChatSession): string {
  let markdown = `# ${session.title}\n\n`;
  
  const stories = session.messages
    .filter(m => m.role === 'assistant')
    .flatMap(m => extractUserStories(m.content));
  
  const tasks = session.messages
    .filter(m => m.role === 'assistant')
    .flatMap(m => extractTasks(m.content));
  
  if (stories.length > 0) {
    markdown += `## User Stories\n\n`;
    stories.forEach((story, i) => {
      markdown += `${i + 1}. ${story}\n`;
    });
    markdown += `\n`;
  }
  
  if (tasks.length > 0) {
    markdown += `## Tasks\n\n`;
    tasks.forEach(task => {
      markdown += `${task}\n`;
    });
    markdown += `\n`;
  }
  
  return markdown;
}
