import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { encrypt } from '@/lib/encryption';
import { getUserIdFromRequest } from '@/lib/admin-auth';
import crypto from 'crypto';

interface JiraConnectionRequest {
  jiraUrl: string;
  jiraEmail: string;
  jiraApiToken: string;
  jiraProjectKey: string;
  configName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: JiraConnectionRequest = await request.json();
    const { jiraUrl, jiraEmail, jiraApiToken, jiraProjectKey, configName = 'Default' } = body;

    if (!jiraUrl || !jiraEmail || !jiraApiToken || !jiraProjectKey) {
      return NextResponse.json(
        { error: 'Missing required fields: jiraUrl, jiraEmail, jiraApiToken, jiraProjectKey' },
        { status: 400 }
      );
    }

    try {
      new URL(jiraUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Jira URL format' },
        { status: 400 }
      );
    }

    const encryptedApiToken = encrypt(jiraApiToken);

    try {
      const testResponse = await fetch(`${jiraUrl}/rest/api/3/myself`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });

      if (!testResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to connect to Jira. Please check your credentials.' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Jira connection test failed:', error);
      return NextResponse.json(
        { error: 'Failed to connect to Jira. Please check your URL and credentials.' },
        { status: 400 }
      );
    }

    const { data, error } = await taskyDb
      .from('user_platform_configs')
      .upsert({
        user_id: userId,
        platform: 'jira',
        jira_url: jiraUrl,
        jira_email: jiraEmail,
        jira_api_token_encrypted: encryptedApiToken,
        jira_project_key: jiraProjectKey,
        config_name: configName,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform,config_name'
      })
      .select('id, created_at, updated_at');

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save Jira configuration' },
        { status: 500 }
      );
    }

    await taskyDb
      .from('stories_platform_connections')
      .upsert({
        user_id: userId,
        platform: 'jira',
        google_account_email: session?.user?.email || '',
        platform_user_id: jiraEmail,
        platform_username: jiraEmail,
        connection_status: 'connected',
        last_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,platform,google_account_email'
      });

    return NextResponse.json({
      success: true,
      message: 'Jira connection established successfully',
      config: {
        id: data?.[0]?.id,
        platform: 'jira',
        jiraUrl,
        jiraEmail,
        jiraProjectKey,
        configName,
        createdAt: data?.[0]?.created_at,
        updatedAt: data?.[0]?.updated_at,
      }
    });

  } catch (error) {
    console.error('Jira connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await taskyDb
      .from('user_platform_configs_safe')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'jira')
      .eq('is_active', true);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Jira configurations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      configs: data || []
    });

  } catch (error) {
    console.error('Get Jira configs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const configName = searchParams.get('configName') || 'Default';

    const { error } = await taskyDb
      .from('user_platform_configs')
      .delete()
      .eq('user_id', userId)
      .eq('platform', 'jira')
      .eq('config_name', configName);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete Jira configuration' },
        { status: 500 }
      );
    }

    await taskyDb
      .from('stories_platform_connections')
      .update({
        connection_status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', 'jira');

    return NextResponse.json({
      success: true,
      message: 'Jira configuration deleted successfully'
    });

  } catch (error) {
    console.error('Delete Jira config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}