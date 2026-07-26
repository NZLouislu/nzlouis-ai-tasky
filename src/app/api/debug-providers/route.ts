import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getUserIdFromRequest } from '@/lib/admin-auth';
import { db } from '@/lib/db/connection';
import { userAPIKeys } from '@/lib/db/schema/tasky';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await db
      .select({
        provider: userAPIKeys.provider,
        createdAt: userAPIKeys.createdAt,
        updatedAt: userAPIKeys.updatedAt,
      })
      .from(userAPIKeys)
      .where(eq(userAPIKeys.userId, userId));

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
