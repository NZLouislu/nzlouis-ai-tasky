import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase/supabase-admin';

// Clean up and recreate test data
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not configured' },
        { status: 500 }
      );
    }

    // 1. Delete all user posts
    console.log('Deleting all posts for user:', session.user.id);
    const { error: deleteError } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Error deleting posts:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    // 2. Create new test data
    const now = new Date().toISOString();
    const testPosts = [
      {
        id: crypto.randomUUID(),
        user_id: session.user.id,
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
        parent_id: null,
        position: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        user_id: session.user.id,
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
        parent_id: null,
        position: null,
        created_at: now,
        updated_at: now,
      },
      {
        id: crypto.randomUUID(),
        user_id: session.user.id,
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
        parent_id: null,
        position: null,
        created_at: now,
        updated_at: now,
      },
    ];

    const { data, error: insertError } = await supabaseAdmin
      .from('blog_posts')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(testPosts as any)
      .select();

    if (insertError) {
      console.error('Error creating test posts:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

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
