import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { encrypt } from '@/lib/encryption';

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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: JiraConnectionRequest = await request.json();
    const { jiraUrl, jiraEmail, jiraApiToken, jiraProjectKey, configName = 'Default' } = body;

    // 验证必需字段
    if (!jiraUrl || !jiraEmail || !jiraApiToken || !jiraProjectKey) {
      return NextResponse.json(
        { error: 'Missing required fields: jiraUrl, jiraEmail, jiraApiToken, jiraProjectKey' },
        { status: 400 }
      );
    }

    // 验证Jira URL格式
    try {
      new URL(jiraUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Jira URL format' },
        { status: 400 }
      );
    }

    // 加密API Token
    const encryptedApiToken = encrypt(jiraApiToken);

    // 测试Jira连接
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

    // 保存配置到数据库
    const { data, error } = await taskyDb
      .from('user_platform_configs')
      .upsert({
        user_id: session.user.id,
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

    // 更新平台连接状态
    await taskyDb
      .from('stories_platform_connections')
      .upsert({
        user_id: session.user.id,
        platform: 'jira',
        google_account_email: session.user.email || '',
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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取用户的Jira配置
    const { data, error } = await taskyDb
      .from('user_platform_configs_safe')
      .select('*')
      .eq('user_id', session.user.id)
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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const configName = searchParams.get('configName') || 'Default';

    // 删除配置
    const { error } = await taskyDb
      .from('user_platform_configs')
      .delete()
      .eq('user_id', session.user.id)
      .eq('platform', 'jira')
      .eq('config_name', configName);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete Jira configuration' },
        { status: 500 }
      );
    }

    // 更新平台连接状态
    await taskyDb
      .from('stories_platform_connections')
      .update({
        connection_status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
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
}import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import crypto from 'crypto';

const JIRA_OAUTH_CONFIG = {
  consumerKey: process.env.JIRA_CONSUMER_KEY || 'nzlouis-ai-tasky',
  consumerSecret: process.env.JIRA_CONSUMER_SECRET || '',
  callbackUrl: process.env.NEXTAUTH_URL + '/api/stories/jira/callback',
  requestTokenUrl: 'https://auth.atlassian.com/oauth/request-token',
  accessTokenUrl: 'https://auth.atlassian.com/oauth/access-token',
  authorizeUrl: 'https://auth.atlassian.com/oauth/authorize'
};

// Encrypt sensitive data
function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.AI_ENCRYPTION_KEY || '', 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { googleAccountEmail, jiraBaseUrl } = await request.json();
    
    if (!googleAccountEmail || !jiraBaseUrl) {
      return NextResponse.json({ 
        error: 'Google account email and Jira base URL are required' 
      }, { status: 400 });
    }

    // For now, simulate OAuth flow - in real implementation, this would:
    // 1. Generate OAuth request token
    // 2. Redirect user to Jira authorization URL
    // 3. Handle callback with authorization code
    // 4. Exchange for access token
    
    // Simulate successful connection
    const mockAccessToken = 'mock_access_token_' + Date.now();
    const encryptedToken = encrypt(mockAccessToken);
    
    // Store connection in database
    const { data: existingConnection } = await taskyDb
      .from('stories_platform_connections')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('platform', 'jira')
      .eq('google_account_email', googleAccountEmail)
      .single();

    if (existingConnection) {
      // Update existing connection
      const { error } = await taskyDb
        .from('stories_platform_connections')
        .update({
          access_token_encrypted: encryptedToken,
          connection_status: 'connected',
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id);

      if (error) {
        console.error('Failed date Jira connection:', error);
        return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
      }
    } else {
      // Create new connection
      const { error } = await taskyDb
        .from('stories_platform_connections')
        .insert({
          user_id: session.user.id,
          platform: 'jira',
          google_account_email: googleAccountEmail,
          access_token_encrypted: encryptedToken,
          connection_status: 'connected',
          last_verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to create Jira connection:', error);
        return NextResponse.json({ error: 'Failed to create connection' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Jira',
      connectionStatus: 'connected'
    });

  } catch (error) {
    console.error('Jira connection error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Jira connections
    { data: connections, error } = await taskyDb
      .from('stories_platform_connections')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'jira');

    if (error) {
      console.error('Failed to fetch Jira connections:', error);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    return NextResponse.json({
      connections: connections || []
    });

  } catch (error) {
    console.error('Error fetching Jira connections:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { googleAccountEmail } = await request.json();

    if (!googleAccountEmail) {
      return NextResponse.json({ error: 'Google account email is required' }, { status: 400 });
    }

    // TODO: Implement Jira OAuth connection logic
    // This would involve:
    // 1. Redirect to Jira OAuth authorization URL
    // 2. Handle OAuth callback
    // 3. Store encrypted credentials in database
    // 4. Return connection status

    return NextResponse.json({
      message: 'Jira connection initiated',
      redirectUrl: '/api/stories/jira/oauth/callback',
      status: 'pending'
    });

  } catch (error) {
    console.error('Jira connection error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Jira' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Check existing Jira connection status
    // Query stories_platform_connections table

    return NextResponse.json({
      connected: false,
      status: 'disconnected'
    });

  } catch (error) {
    console.error('Error checking Jira connection:', error);
    return NextResponse.json(
      { error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}