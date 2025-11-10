import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';

// GET /api/chat-sessions - Get all sessions for user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await taskyDb
      .from('chat_sessions')
      .select('*, messages:chat_messages(count)')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/chat-sessions - Create new session
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, provider, model } = body;

    const { data: chatSession, error } = await taskyDb
      .from('chat_sessions')
      .insert({
        user_id: session.user.id,
        title: title || 'New Chat',
        provider: provider || 'google',
        model: model || 'gemini-2.5-flash',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ session: chatSession });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
