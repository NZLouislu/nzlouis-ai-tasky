import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { chatSessions, chatMessages } from '@/lib/db/schema/tasky';
import { eq, and } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/admin-auth';

// POST /api/chat-sessions/[id]/messages - Save messages
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session belongs to user
    const [chatSession] = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId)))
      .limit(1);

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    // Save messages
    interface MessageInput {
      role: 'user' | 'assistant' | 'system';
      content: string;
      imageUrl?: string;
    }
    
    const savedMessages = await db
      .insert(chatMessages)
      .values(
        (messages as MessageInput[]).map((msg) => ({
          id: crypto.randomUUID(),
          sessionId: id,
          role: msg.role,
          content: msg.content,
          imageUrl: msg.imageUrl || null,
        }))
      )
      .returning();

    // Update session timestamp
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, id));

    return NextResponse.json({ 
      success: true,
      count: savedMessages?.length || 0,
    });
  } catch (error) {
    console.error('Save messages error:', error);
    return NextResponse.json(
      { error: 'Failed to save messages' },
      { status: 500 }
    );
  }
}
