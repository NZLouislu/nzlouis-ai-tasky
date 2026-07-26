import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { userPlatformConfigs, storiesPlatformConnections, storiesProjects } from '@/lib/db/schema/stories';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { configName = 'Default' } = body;

    await db
      .delete(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, session.user.id),
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
          eq(storiesPlatformConnections.userId, session.user.id),
          eq(storiesPlatformConnections.platform, 'jira'),
        )
      );

    await db
      .update(storiesProjects)
      .set({
        connectionStatus: 'disconnected',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(storiesProjects.userId, session.user.id),
          eq(storiesProjects.platform, 'jira'),
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Jira connection disconnected successfully'
    });

  } catch (error) {
    console.error('Jira disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const configs = await db
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
          eq(userPlatformConfigs.userId, session.user.id),
          eq(userPlatformConfigs.platform, 'jira'),
          eq(userPlatformConfigs.isActive, true),
        )
      );

    const isConnected = configs && configs.length > 0;

    return NextResponse.json({
      success: true,
      connected: isConnected,
      configs: configs || [],
      message: isConnected ? 'Jira is connected' : 'Jira is not connected'
    });

  } catch (error) {
    console.error('Check Jira connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
