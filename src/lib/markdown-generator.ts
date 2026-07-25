import { db } from './db/connection';
import { chatSessions, chatMessages } from './db/schema/tasky';
import { eq, asc } from 'drizzle-orm';

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

export async function generateMarkdownFromSession(sessionId: string): Promise<string> {
  const [session] = await db
    .select({
      id: chatSessions.id,
      title: chatSessions.title,
      provider: chatSessions.provider,
      model: chatSessions.model,
      createdAt: chatSessions.createdAt,
    })
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId));

  if (!session) {
    throw new Error('Session not found');
  }

  const messages = await db
    .select({
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt));

  let markdown = `# ${session.title}\n\n`;
  markdown += `**Provider:** ${session.provider}\n`;
  markdown += `**Model:** ${session.model}\n`;
  markdown += `**Date:** ${session.createdAt.toLocaleDateString()}\n\n`;
  markdown += `---\n\n`;

  for (const message of messages) {
    if (message.role === 'user') {
      markdown += `## User\n\n${message.content}\n\n`;
    } else if (message.role === 'assistant') {
      markdown += `## Assistant\n\n${message.content}\n\n`;
    }
  }

  return markdown;
}

export function extractUserStories(content: string): string[] {
  const stories: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (
      line.match(/^(As a|User Story:|Story:|\*\*Story)/i) ||
      line.match(/^\d+\.\s*(As a|User Story)/i)
    ) {
      stories.push(line.trim());
    }
  }

  return stories;
}

export function extractTasks(content: string): string[] {
  const tasks: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.match(/^[-*]\s*\[[ x]\]/i) || line.match(/^\d+\.\s+/)) {
      tasks.push(line.trim());
    }
  }

  return tasks;
}

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

function convertToJiraFormat(content: string): string {
  let jira = content;

  jira = jira.replace(/^### (.*?)$/gm, 'h3. $1');
  jira = jira.replace(/^## (.*?)$/gm, 'h2. $1');
  jira = jira.replace(/^# (.*?)$/gm, 'h1. $1');

  jira = jira.replace(/\*\*(.*?)\*\*/g, '*$1*');

  jira = jira.replace(/\*(.*?)\*/g, '_$1_');

  jira = jira.replace(/```(\w+)?\n([\s\S]*?)```/g, '{code:$1}\n$2{code}');

  jira = jira.replace(/`(.*?)`/g, '{{$1}}');

  jira = jira.replace(/^- /gm, '* ');

  return jira;
}

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
