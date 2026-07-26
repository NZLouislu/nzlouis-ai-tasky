import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { blogChatMessages } from '@/lib/db/schema/blog';
import { eq, desc, inArray } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, keepCount = 50 } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    console.log(`🧹 Cleaning up old messages for post: ${postId}, keeping latest ${keepCount}`);

    const allMessages = await db
      .select({ id: blogChatMessages.id, timestamp: blogChatMessages.timestamp })
      .from(blogChatMessages)
      .where(eq(blogChatMessages.postId, postId))
      .orderBy(desc(blogChatMessages.timestamp));

    if (!allMessages || allMessages.length <= keepCount) {
      console.log(`✅ No cleanup needed. Current count: ${allMessages?.length || 0}`);
      return NextResponse.json({
        cleaned: 0,
        remaining: allMessages?.length || 0,
        message: 'No cleanup needed'
      });
    }

    const messagesToDelete = allMessages.slice(keepCount).map(m => m.id);

    console.log(`🗑️  Deleting ${messagesToDelete.length} old messages`);

    await db
      .delete(blogChatMessages)
      .where(inArray(blogChatMessages.id, messagesToDelete));

    console.log(`✅ Cleaned up ${messagesToDelete.length} messages, kept ${keepCount}`);

    return NextResponse.json({
      cleaned: messagesToDelete.length,
      remaining: keepCount,
      message: `Successfully cleaned up ${messagesToDelete.length} old messages`
    });

  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
