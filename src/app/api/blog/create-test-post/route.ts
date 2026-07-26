import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { blogPosts } from '@/lib/db/schema/tasky';


export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { user_id, title } = body;

    if (user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const postId = crypto.randomUUID();
    const now = new Date();

    const insertData = {
      id: postId,
      userId: user_id,
      title,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'This is a test post created via API.',
              styles: {},
            },
          ],
        },
      ],
      published: false,
      parentId: null,
      position: null,
      icon: '📝',
      cover: null,
      createdAt: now,
      updatedAt: now,
    };

    const [data] = await db.insert(blogPosts).values(insertData).returning();

    return NextResponse.json({
      success: true,
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
