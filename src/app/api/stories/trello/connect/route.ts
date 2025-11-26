import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
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
      
      const { data, error } = await taskyDb
        .from('user_platform_configs')
        .upsert({
          user_id: session.user.id,
          platform: 'trello',
          trello_key_encrypted: encryptedKey,
          trello_token_encrypted: encryptedToken,
          trello_board_id: trelloBoardId || null,
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
          { error: 'Failed to save Trello configuration' },
          { status: 500 }
        );
      }

      await taskyDb
        .from('stories_platform_connections')
        .upsert({
          user_id: session.user.id,
          platform: 'trello',
          google_account_email: session.user.email || '',
          platform_user_id: session.user.id,
          platform_username: session.user.name || session.user.email || '',
          connection_status: 'connected',
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,platform,google_account_email'
        });

      return NextResponse.json({
        success: true,
        message: 'Trello connection established successfully',
        boards: boards,
        config: {
          id: data?.[0]?.id,
          platform: 'trello',
          trelloBoardId,
          configName,
          createdAt: data?.[0]?.created_at,
          updatedAt: data?.[0]?.updated_at,
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Trello configuration
    const { data, error } = await taskyDb
      .from('user_platform_configs_safe')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'trello')
      .eq('is_active', true);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Trello configurations' },
        { status: 500 }
      );
    }

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

    // Delete configuration
    const { error } = await taskyDb
      .from('user_platform_configs')
      .delete()
      .eq('user_id', session.user.id)
      .eq('platform', 'trello')
      .eq('config_name', configName);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to delete Trello configuration' },
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
      .eq('platform', 'trello');

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