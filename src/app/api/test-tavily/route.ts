import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { userAPIKeys } from '@/lib/db/schema/tasky';
import { eq, and } from 'drizzle-orm';
import { decryptAPIKey } from '@/lib/encryption';
import { getUserIdFromRequest } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Tavily API key from database
    const [apiKeyRecord] = await db
      .select({
        keyEncrypted: userAPIKeys.keyEncrypted,
        iv: userAPIKeys.iv,
        authTag: userAPIKeys.authTag,
      })
      .from(userAPIKeys)
      .where(
        and(
          eq(userAPIKeys.userId, userId),
          eq(userAPIKeys.provider, 'tavily')
        )
      );

    if (!apiKeyRecord) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tavily API key not configured. Please save your API key first.' 
      });
    }

    const tavilyApiKey = decryptAPIKey(
      apiKeyRecord.keyEncrypted,
      apiKeyRecord.iv,
      apiKeyRecord.authTag
    );

    // Test the API key with a simple search
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: 'test search',
        search_depth: 'basic',
        max_results: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Tavily Test] API error:', response.status, errorText);
      
      return NextResponse.json({ 
        success: false, 
        error: `Tavily API error (${response.status}): ${errorText.substring(0, 200)}` 
      });
    }

    const data = await response.json();

    return NextResponse.json({ 
      success: true, 
      response: `✓ Tavily API key is valid! Test search returned ${data.results?.length || 0} result(s).` 
    });

  } catch (error) {
    console.error('[Tavily Test] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    });
  }
}
