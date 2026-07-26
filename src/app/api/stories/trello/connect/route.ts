import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { userPlatformConfigs, storiesPlatformConnections } from '@/lib/db/schema/stories';
import { eq, and } from 'drizzle-orm';
import { encrypt } from '@/lib/encryption';

interface TrelloConnectionRequest {
  trelloKey: string;
  trelloToken: string;
  trelloBoardId?: string;
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

    const body: TrelloConnectionRequest = await request.json();
    const { trelloKey, trelloToken, trelloBoardId, configName = 'Default' } = body;

    if (!trelloKey || !trelloToken) {
      return NextResponse.json(
        { error: 'Missing required fields: trelloKey, trelloToken' },
        { status: 400 }
      );
    }

    const encryptedKey = encrypt(trelloKey);
    const encryptedToken = encrypt(trelloToken);

    try {
      const testResponse = await fetch(
        `https://api.trello.com/1/members/me/boards?key=${trelloKey}&token=${trelloToken}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!testResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to connect to Trello. Please check your API key and token.' },
          { status: 400 }
        );
      }

      const boards = await testResponse.json();
      
      const [result] = await db
        .insert(userPlatformConfigs)
        .values({
          userId: session.user.id,
          platform: 'trello',
          trelloKeyEncrypted: encryptedKey,
          trelloTokenEncrypted: encryptedToken,
          trelloBoardId: trelloBoardId || null,
          configName,
          isActive: true,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [userPlatformConfigs.userId, userPlatformConfigs.platform, userPlatformConfigs.configName],
          set: {
            trelloKeyEncrypted: encryptedKey,
            trelloTokenEncrypted: encryptedToken,
            trelloBoardId: trelloBoardId || null,
            isActive: true,
            updatedAt: new Date(),
          },
        })
        .returning({ id: userPlatformConfigs.id, createdAt: userPlatformConfigs.createdAt, updatedAt: userPlatformConfigs.updatedAt });

      await db
        .insert(storiesPlatformConnections)
        .values({
          userId: session.user.id,
          platform: 'trello',
          googleAccountEmail: session.user.email || '',
          platformUserId: session.user.id,
          platformUsername: session.user.name || session.user.email || '',
          connectionStatus: 'connected',
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [storiesPlatformConnections.userId, storiesPlatformConnections.platform, storiesPlatformConnections.googleAccountEmail],
          set: {
            platformUserId: session.user.id,
            platformUsername: session.user.name || session.user.email || '',
            connectionStatus: 'connected',
            lastVerifiedAt: new Date(),
            updatedAt: new Date(),
          },
        });

      return NextResponse.json({
        success: true,
        message: 'Trello connection established successfully',
        boards: boards,
        config: {
          id: result?.id,
          platform: 'trello',
          trelloBoardId,
          configName,
          createdAt: result?.createdAt,
          updatedAt: result?.updatedAt,
        }
      });

    } catch (error) {
      console.error('Trello connection test failed:', error);
      return NextResponse.json(
        { error: 'Failed to connect to Trello. Please check your API key and token.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Trello connection error:', error);
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

    const data = await db
      .select({
        id: userPlatformConfigs.id,
        userId: userPlatformConfigs.userId,
        platform: userPlatformConfigs.platform,
        trelloBoardId: userPlatformConfigs.trelloBoardId,
        isActive: userPlatformConfigs.isActive,
        configName: userPlatformConfigs.configName,
        createdAt: userPlatformConfigs.createdAt,
        updatedAt: userPlatformConfigs.updatedAt,
      })
      .from(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, session.user.id),
          eq(userPlatformConfigs.platform, 'trello'),
          eq(userPlatformConfigs.isActive, true),
        )
      );

    return NextResponse.json({
      success: true,
      configs: data || []
    });

  } catch (error) {
    console.error('Get Trello configs error:', error);
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

    await db
      .delete(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, session.user.id),
          eq(userPlatformConfigs.platform, 'trello'),
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
          eq(storiesPlatformConnections.platform, 'trello'),
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Trello configuration deleted successfully'
    });

  } catch (error) {
    console.error('Delete Trello config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
