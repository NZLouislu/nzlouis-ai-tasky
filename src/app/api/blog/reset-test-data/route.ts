import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { blogPosts } from '@/lib/db/schema/tasky';
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

    console.log('Deleting all posts for user:', session.user.id);
    await db.delete(blogPosts).where(eq(blogPosts.userId, session.user.id));

    const now = new Date();
    const testPosts = [
      {
        id: crypto.randomUUID(),
        userId: session.user.id,
        title: 'Getting Started',
        content: [
          {
            type: 'heading',
            content: [{ type: 'text', text: 'Welcome to Your Blog!', styles: {} }],
            props: { level: 1 },
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'This is your first blog post. You can edit this content by clicking on it.',
                styles: {},
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Try adding some text, images, or other content!',
                styles: { bold: true },
              },
            ],
          },
        ],
        icon: '🚀',
        cover: { type: 'color', value: 'bg-blue-500' },
        published: false,
        parentId: null,
        position: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        userId: session.user.id,
        title: 'My Second Post',
        content: [
          {
            type: 'heading',
            content: [{ type: 'text', text: 'This is the second post', styles: {} }],
            props: { level: 2 },
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Each post has its own unique content.',
                styles: {},
              },
            ],
          },
        ],
        icon: '📝',
        cover: null,
        published: false,
        parentId: null,
        position: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: crypto.randomUUID(),
        userId: session.user.id,
        title: 'Ideas and Notes',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Use this space to jot down your ideas and notes.',
                styles: { italic: true },
              },
            ],
          },
          {
            type: 'bulletListItem',
            content: [{ type: 'text', text: 'Idea 1', styles: {} }],
          },
          {
            type: 'bulletListItem',
            content: [{ type: 'text', text: 'Idea 2', styles: {} }],
          },
          {
            type: 'bulletListItem',
            content: [{ type: 'text', text: 'Idea 3', styles: {} }],
          },
        ],
        icon: '💡',
        cover: { type: 'color', value: 'bg-yellow-500' },
        published: false,
        parentId: null,
        position: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const data = await db.insert(blogPosts).values(testPosts).returning();

    return NextResponse.json({
      success: true,
      message: 'Test data reset successfully',
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
