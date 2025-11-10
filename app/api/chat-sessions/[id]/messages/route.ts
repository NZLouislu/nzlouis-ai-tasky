import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';

// POST /api/chat-sessions/[id]/messages - Save messages
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session belongs to user
    const { data: chatSession, error: sessionError } = await taskyDb
      .from('chat_sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (sessionError || !chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const body = await req.json();
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    // Save messages
    interface MessageInput {
      role: string;
      content: string;
      imageUrl?: string;
    }
    
    const { data: savedMessages, error: messagesError } = await taskyDb
      .from('chat_messages')
      .insert(
        (messages as MessageInput[]).map((msg) => ({
          id: crypto.randomUUID(),
          session_id: id,
          role: msg.role,
          content: msg.content,
          image_url: msg.imageUrl || null,
          created_at: new Date().toISOString(),
        }))
      )
      .select();

    if (messagesError) throw messagesError;

    // Update session timestamp
    await taskyDb
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ 
      success: true,
      count: savedMessages?.length || 0,
    });
  } catch (error) {
    console.error('Save messages error:', error);
    return NextResponse.json(
      { error: 'Failed to save messages' },
      { status: 500 }
    );
  }
}
