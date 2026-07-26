import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { eq, desc } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const storiesChatMessages = pgTable('stories_chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: text('document_id').notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    const data = await db
      .select()
      .from(storiesChatMessages)
      .where(eq(storiesChatMessages.documentId, documentId))
      .orderBy(desc(storiesChatMessages.timestamp))
      .limit(limit + 1)
      .offset(offset);

    const messages = data || [];
    const hasMore = messages.length > limit;

    if (hasMore) {
      messages.pop();
    }

    messages.reverse();

    return NextResponse.json({
      messages,
      total: 0,
      hasMore,
      offset,
      limit
    });
  } catch (error) {
    console.error('Error in GET /api/stories/chat-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, userId, role, content, timestamp } = body;

    if (!documentId || !userId || !role || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [message] = await db
      .insert(storiesChatMessages)
      .values({
        documentId,
        userId,
        role,
        content,
        timestamp: timestamp || new Date(),
      })
      .returning();

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in POST /api/stories/chat-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    await db
      .delete(storiesChatMessages)
      .where(eq(storiesChatMessages.documentId, documentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/stories/chat-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
