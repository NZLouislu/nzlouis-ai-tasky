import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { blogPosts } from '@/lib/db/schema/tasky';
import { defaultWelcomePosts } from '@/lib/blog/default-posts';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const existingPosts = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.userId, session.user.id))
      .limit(1);

    if (existingPosts && existingPosts.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'User already has posts',
        created: false,
      });
    }

    const now = new Date();
    const currentUserId = session.user.id;
    const postsToCreate = defaultWelcomePosts.map((post) => ({
      id: crypto.randomUUID(),
      userId: currentUserId,
      title: post.title,
      content: post.content,
      icon: post.icon,
      cover: post.cover,
      published: false,
      parentId: null,
      position: null,
      createdAt: now,
      updatedAt: now,
    }));

    const data = await db.insert(blogPosts).values(postsToCreate).returning();

    console.log(`Created ${data.length} welcome posts for user ${currentUserId}`);

    return NextResponse.json({
      success: true,
      message: 'Welcome posts created successfully',
      created: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
