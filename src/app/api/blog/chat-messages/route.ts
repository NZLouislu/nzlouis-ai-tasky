import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get('postId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    const supabaseClient = supabase;

    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not initialized' },
        { status: 500 }
      );
    }

    // Optimize: 
    // 1. Remove count: 'exact' which is slow on large tables
    // 2. Order by timestamp DESC to get latest messages first
    // 3. Fetch limit + 1 to determine hasMore without counting
    const { data, error } = await supabaseClient
      .from('blog_chat_messages')
      .select('*')
      .eq('post_id', postId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit);

    if (error) {
      console.error('Error fetching chat messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chat messages' },
        { status: 500 }
      );
    }

    const messages = data || [];
    const hasMore = messages.length > limit;
    
    // If we fetched an extra item to check hasMore, remove it
    if (hasMore) {
      messages.pop();
    }

    // Reverse messages to return them in chronological order (oldest -> newest)
    // This matches the UI expectation where messages are appended/prepended
    messages.reverse();

    return NextResponse.json({ 
      messages,
      total: 0, // Deprecated: counting is too slow
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

    const supabaseClient = supabase;

    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not initialized' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseClient
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

    const supabaseClient = supabase;

    if (!supabaseClient) {
      return NextResponse.json(
        { error: 'Supabase client not initialized' },
        { status: 500 }
      );
    }

    const { error } = await supabaseClient
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
