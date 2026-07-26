import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { chatSessions, chatMessages } from '@/lib/db/schema/tasky';
import { eq, desc, inArray, count } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/admin-auth';

// GET /api/chat-sessions - Get all sessions for user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionsList = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));

    let counts: Array<{ sessionId: string; count: number }> = [];
    if (sessionsList.length > 0) {
      const countResults = await db
        .select({
          sessionId: chatMessages.sessionId,
          count: count(),
        })
        .from(chatMessages)
        .where(inArray(chatMessages.sessionId, sessionsList.map(s => s.id)))
        .groupBy(chatMessages.sessionId);
      counts = countResults.map(r => ({ sessionId: r.sessionId, count: Number(r.count) }));
    }

    const countMap = new Map(counts.map(c => [c.sessionId, c.count]));

    const sessions = sessionsList.map(session => ({
      ...session,
      messages: [{ count: countMap.get(session.id) ?? 0 }],
    }));

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/chat-sessions - Create new session
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, provider, model } = body;

    const [chatSession] = await db
      .insert(chatSessions)
      .values({
        id: crypto.randomUUID(),
        userId,
        title: title || 'New Chat',
        provider: provider || 'google',
        model: model || 'gemini-2.5-flash',
      })
      .returning();

    return NextResponse.json({ session: chatSession });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
