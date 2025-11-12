import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { user_id, title } = body;

    // 验证 user_id 匹配
    if (user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'User ID mismatch' },
        { status: 403 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not configured' },
        { status: 500 }
      );
    }

    // 生成 UUID 和时间戳
    const postId = crypto.randomUUID();
    const now = new Date().toISOString();

    // 使用 admin client 创建 post（绕过 RLS）
    const insertData = {
      id: postId,
      user_id,
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
      parent_id: null,
      position: null,
      icon: '📝',
      cover: null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insertData as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating test post:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

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
