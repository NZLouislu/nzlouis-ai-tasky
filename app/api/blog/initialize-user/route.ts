import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase/supabase-admin';
import { defaultWelcomePosts } from '@/lib/blog/default-posts';

export async function POST(request: NextRequest) {
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

    const { data: existingPosts, error: checkError } = await supabaseAdmin
      .from('blog_posts')
      .select('id')
      .eq('user_id', session.user.id)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing posts:', checkError);
      return NextResponse.json(
        { error: checkError.message },
        { status: 500 }
      );
    }

    if (existingPosts && existingPosts.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'User already has posts',
        created: false,
      });
    }

    const now = new Date().toISOString();
    const postsToCreate = defaultWelcomePosts.map((post) => ({
      id: crypto.randomUUID(),
      user_id: session.user?.id,
      title: post.title,
      content: post.content,
      icon: post.icon,
      cover: post.cover,
      published: false,
      parent_id: null,
      position: null,
      created_at: now,
      updated_at: now,
    }));

    const { data, error: insertError } = await supabaseAdmin
      .from('blog_posts')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(postsToCreate as any)
      .select();

    if (insertError) {
      console.error('Error creating welcome posts:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    console.log(`Created ${data.length} welcome posts for user ${session.user.id}`);

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
