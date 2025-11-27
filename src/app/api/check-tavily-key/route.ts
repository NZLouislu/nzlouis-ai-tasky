import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getUserIdFromRequest } from '@/lib/admin-auth';
import { taskyDb } from '@/lib/supabase/tasky-db-client';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);

    if (!userId) {
      return NextResponse.json({ hasKey: false });
    }

    const { data } = await taskyDb
      .from('user_api_keys')
      .select('provider')
      .eq('user_id', userId)
      .eq('provider', 'tavily')
      .single();

    return NextResponse.json({ hasKey: !!data });
  } catch (error) {
    console.error('Error checking Tavily API key:', error);
    return NextResponse.json({ hasKey: false });
  }
}
