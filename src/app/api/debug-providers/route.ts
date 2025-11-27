import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getUserIdFromRequest } from '@/lib/admin-auth';
import { taskyDb } from '@/lib/supabase/tasky-db-client';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: keys, error } = await taskyDb
      .from('user_api_keys')
      .select('provider, created_at, updated_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching API keys:', error);
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
    }

    return NextResponse.json({ 
      userId,
      configuredProviders: keys?.map(k => k.provider) || [],
      details: keys || []
    });
  } catch (error) {
    console.error('Error in debug-providers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
