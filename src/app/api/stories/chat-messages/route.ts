import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
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
      .from('stories_chat_messages')
      .select('*')
      .eq('document_id', documentId)
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
    messages.reverse();

    return NextResponse.json({ 
      messages,
      total: 0, // Deprecated
      hasMore,
      offset,
      limit
    });
  } catch (error) {
    console.error('Error in GET /api/stories/chat-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, userId, role, content, timestamp } = body;

    if (!documentId || !userId || !role || !content) {
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
      .from('stories_chat_messages')
      .insert({
        document_id: documentId,
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
    console.error('Error in POST /api/stories/chat-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
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
      .from('stories_chat_messages')
      .delete()
      .eq('document_id', documentId);

    if (error) {
      console.error('Error deleting chat messages:', error);
      return NextResponse.json(
        { error: 'Failed to delete chat messages' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/stories/chat-messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
