import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
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
    const { data: apiKeyRecord } = await taskyDb
      .from('user_api_keys')
      .select('key_encrypted, iv, auth_tag')
      .eq('user_id', userId)
      .eq('provider', 'tavily')
      .single();

    if (!apiKeyRecord) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tavily API key not configured. Please save your API key first.' 
      });
    }

    const tavilyApiKey = decryptAPIKey(
      apiKeyRecord.key_encrypted,
      apiKeyRecord.iv,
      apiKeyRecord.auth_tag
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
