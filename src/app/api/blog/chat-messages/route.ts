import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('blog_chat_messages')
      .select('*')
      .eq('post_id', postId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching chat messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chat messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: data || [] });
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

    const { data, error } = await supabase
      .from('blog_chat_messages')
      .insert({
        post_id: postId,
        user_id: userId,
        role,
        content,
        timestamp: timestamp || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving chat message:', error);
      return NextResponse.json(
        { error: 'Failed to save chat message' },
        { status: 500 }
      );
    }

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

    const { error } = await supabase
      .from('blog_chat_messages')
      .delete()
      .eq('post_id', postId);

    if (error) {
      console.error('Error deleting chat messages:', error);
      return NextResponse.json(
        { error: 'Failed to delete chat messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/blog/chat-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
