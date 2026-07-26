import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { getUserIdFromRequest } from '@/lib/admin-auth';
import { db } from '@/lib/db/connection';
import { userAPIKeys } from '@/lib/db/schema/tasky';
import { and, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);

    if (!userId) {
      return NextResponse.json({ hasKey: false });
    }

    const [data] = await db
      .select({ provider: userAPIKeys.provider })
      .from(userAPIKeys)
      .where(and(eq(userAPIKeys.userId, userId), eq(userAPIKeys.provider, 'tavily')))
      .limit(1);

    return NextResponse.json({ hasKey: !!data });
  } catch (error) {
    console.error('Error checking Tavily API key:', error);
    return NextResponse.json({ hasKey: false });
  }
}
