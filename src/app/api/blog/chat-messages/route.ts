import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { blogChatMessages } from '@/lib/db/schema/blog';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 20);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    console.log(`📨 Fetching chat messages: postId=${postId}, limit=${limit}, offset=${offset}`);

    const data = await db
      .select()
      .from(blogChatMessages)
      .where(eq(blogChatMessages.postId, postId))
      .orderBy(desc(blogChatMessages.timestamp))
      .limit(limit + 1)
      .offset(offset);

    const messages = data || [];
    const hasMore = messages.length > limit;

    if (hasMore) {
      messages.pop();
    }

    messages.reverse();

    console.log(`✅ Fetched ${messages.length} messages`);

    return NextResponse.json({
      messages,
      total: 0,
      hasMore,
      offset,
      limit
    });
  } catch (error) {
    console.error('Error in GET /api/blog/chat-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, userId, role, content, timestamp } = body;

    if (!postId || !userId || !role || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const MAX_CONTENT_LENGTH = 50000;
    if (content.length > MAX_CONTENT_LENGTH) {
      console.warn(`⚠️ Message content too large: ${content.length} bytes`);
      return NextResponse.json(
        {
          error: 'Message content too large',
          details: `Maximum allowed: ${MAX_CONTENT_LENGTH} bytes, received: ${content.length} bytes`
        },
        { status: 400 }
      );
    }

    console.log(`💾 Saving chat message: postId=${postId}, role=${role}, length=${content.length}`);

    const [data] = await db
      .insert(blogChatMessages)
      .values({
        postId: postId,
        userId: userId,
        role,
        content,
        timestamp: timestamp || new Date().toISOString(),
      })
      .returning();

    console.log(`✅ Saved message: ${data.id}`);

    return NextResponse.json({ message: data });
  } catch (error) {
    console.error('Error in POST /api/blog/chat-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    await db
      .delete(blogChatMessages)
      .where(eq(blogChatMessages.postId, postId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/blog/chat-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
