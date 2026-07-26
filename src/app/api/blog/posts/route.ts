import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { blogPosts, userProfiles } from '@/lib/db/schema/tasky';
import { eq, desc } from 'drizzle-orm';
import { getUserIdFromRequest } from '@/lib/admin-auth';

async function ensureUserProfile(userId: string) {
  const [existing] = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId));

  if (!existing) {
    await db.insert(userProfiles).values({
      id: userId,
      email: `${userId.substring(0, 8)}@placeholder.com`,
      name: 'User',
    });
    console.log(`Auto-created user profile for ${userId}`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserProfile(userId);

    const data = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.userId, userId))
      .orderBy(desc(blogPosts.createdAt));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUserProfile(userId);

    const body = await request.json();
    const postId = crypto.randomUUID();

    await db.insert(blogPosts).values({
      id: postId,
      userId,
      title: body.title || 'Untitled',
      content: body.content || null,
      icon: body.icon || null,
      cover: body.cover || null,
      parentId: body.parent_id || body.parentId || null,
      published: false,
      position: null,
    });

    const [data] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, postId));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, parent_id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    await db
      .update(blogPosts)
      .set({
        ...updates,
        ...(parent_id !== undefined ? { parentId: parent_id } : {}),
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id));

    const [data] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
