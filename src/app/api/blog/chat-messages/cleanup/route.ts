import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase-client';

/**
 * Cleanup old chat messages to prevent database bloat
 * This endpoint should be called periodically (e.g., via cron job)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, keepCount = 50 } = body;

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

    console.log(`🧹 Cleaning up old messages for post: ${postId}, keeping latest ${keepCount}`);

    // Get all messages for this post, ordered by timestamp DESC
    const { data: allMessages, error: fetchError } = await supabaseClient
      .from('blog_chat_messages')
      .select('id, timestamp')
      .eq('post_id', postId)
      .order('timestamp', { ascending: false });

    if (fetchError) {
      console.error('Error fetching messages for cleanup:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    if (!allMessages || allMessages.length <= keepCount) {
      console.log(`✅ No cleanup needed. Current count: ${allMessages?.length || 0}`);
      return NextResponse.json({ 
        cleaned: 0,
        remaining: allMessages?.length || 0,
        message: 'No cleanup needed'
      });
    }

    // Get IDs of messages to delete (all except the latest keepCount)
    const messagesToDelete = allMessages.slice(keepCount).map(m => m.id);

    console.log(`🗑️  Deleting ${messagesToDelete.length} old messages`);

    const { error: deleteError } = await supabaseClient
      .from('blog_chat_messages')
      .delete()
      .in('id', messagesToDelete);

    if (deleteError) {
      console.error('Error deleting old messages:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete old messages' },
        { status: 500 }
      );
    }

    console.log(`✅ Cleaned up ${messagesToDelete.length} messages, kept ${keepCount}`);

    return NextResponse.json({
      cleaned: messagesToDelete.length,
      remaining: keepCount,
      message: `Successfully cleaned up ${messagesToDelete.length} old messages`
    });

  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
