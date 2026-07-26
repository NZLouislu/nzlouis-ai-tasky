import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { userPlatformConfigs, storiesPlatformConnections } from '@/lib/db/schema/stories';
import { eq, and } from 'drizzle-orm';
import { encrypt } from '@/lib/encryption';
import { getUserIdFromRequest } from '@/lib/admin-auth';

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

    const [result] = await db
      .insert(userPlatformConfigs)
      .values({
        userId,
        platform: 'jira',
        jiraUrl,
        jiraEmail,
        jiraApiTokenEncrypted: encryptedApiToken,
        jiraProjectKey,
        configName,
        isActive: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userPlatformConfigs.userId, userPlatformConfigs.platform, userPlatformConfigs.configName],
        set: {
          jiraUrl,
          jiraEmail,
          jiraApiTokenEncrypted: encryptedApiToken,
          jiraProjectKey,
          isActive: true,
          updatedAt: new Date(),
        },
      })
      .returning({ id: userPlatformConfigs.id, createdAt: userPlatformConfigs.createdAt, updatedAt: userPlatformConfigs.updatedAt });

    await db
      .insert(storiesPlatformConnections)
      .values({
        userId,
        platform: 'jira',
        googleAccountEmail: session?.user?.email || '',
        platformUserId: jiraEmail,
        platformUsername: jiraEmail,
        connectionStatus: 'connected',
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [storiesPlatformConnections.userId, storiesPlatformConnections.platform, storiesPlatformConnections.googleAccountEmail],
        set: {
          platformUserId: jiraEmail,
          platformUsername: jiraEmail,
          connectionStatus: 'connected',
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      message: 'Jira connection established successfully',
      config: {
        id: result?.id,
        platform: 'jira',
        jiraUrl,
        jiraEmail,
        jiraProjectKey,
        configName,
        createdAt: result?.createdAt,
        updatedAt: result?.updatedAt,
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

    const data = await db
      .select({
        id: userPlatformConfigs.id,
        userId: userPlatformConfigs.userId,
        platform: userPlatformConfigs.platform,
        jiraUrl: userPlatformConfigs.jiraUrl,
        jiraEmail: userPlatformConfigs.jiraEmail,
        jiraProjectKey: userPlatformConfigs.jiraProjectKey,
        isActive: userPlatformConfigs.isActive,
        configName: userPlatformConfigs.configName,
        createdAt: userPlatformConfigs.createdAt,
        updatedAt: userPlatformConfigs.updatedAt,
      })
      .from(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, userId),
          eq(userPlatformConfigs.platform, 'jira'),
          eq(userPlatformConfigs.isActive, true),
        )
      );

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

    await db
      .delete(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, userId),
          eq(userPlatformConfigs.platform, 'jira'),
          eq(userPlatformConfigs.configName, configName),
        )
      );

    await db
      .update(storiesPlatformConnections)
      .set({
        connectionStatus: 'disconnected',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(storiesPlatformConnections.userId, userId),
          eq(storiesPlatformConnections.platform, 'jira'),
        )
      );

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
