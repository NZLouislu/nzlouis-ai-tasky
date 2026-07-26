import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { chatSessions, chatMessages } from '@/lib/db/schema/tasky';
import { eq, and, asc } from 'drizzle-orm';
import {
  generateMarkdownFromSession,
  generateJiraMarkdown,
  generateTrelloMarkdown,
} from '@/lib/markdown-generator';
import { getUserIdFromRequest } from '@/lib/admin-auth';

// GET /api/chat-sessions/[id]/export?format=markdown|jira|trello
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session belongs to user and get messages
    const [chatSession] = await db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId)))
      .limit(1);

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, id))
      .orderBy(asc(chatMessages.createdAt));

    const sessionWithMessages = { ...chatSession, messages };

    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get('format') || 'markdown';

    let content: string;
    let filename: string;

    switch (format) {
      case 'jira':
        content = generateJiraMarkdown(sessionWithMessages);
        filename = `${sessionWithMessages.title.replace(/\s+/g, '-')}-jira.txt`;
        break;
      case 'trello':
        content = generateTrelloMarkdown(sessionWithMessages);
        filename = `${sessionWithMessages.title.replace(/\s+/g, '-')}-trello.md`;
        break;
      default:
        content = await generateMarkdownFromSession(id);
        filename = `${sessionWithMessages.title.replace(/\s+/g, '-')}.md`;
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export session' },
      { status: 500 }
    );
  }
}
