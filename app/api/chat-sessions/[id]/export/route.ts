import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { PrismaClient } from '@prisma/client';
import {
  generateMarkdownFromSession,
  generateJiraMarkdown,
  generateTrelloMarkdown,
} from '@/lib/markdown-generator';

const prisma = new PrismaClient();

// GET /api/chat-sessions/[id]/export?format=markdown|jira|trello
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session belongs to user
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const format = searchParams.get('format') || 'markdown';

    let content: string;
    let filename: string;

    switch (format) {
      case 'jira':
        content = generateJiraMarkdown(chatSession);
        filename = `${chatSession.title.replace(/\s+/g, '-')}-jira.txt`;
        break;
      case 'trello':
        content = generateTrelloMarkdown(chatSession);
        filename = `${chatSession.title.replace(/\s+/g, '-')}-trello.md`;
        break;
      default:
        content = await generateMarkdownFromSession(id);
        filename = `${chatSession.title.replace(/\s+/g, '-')}.md`;
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
