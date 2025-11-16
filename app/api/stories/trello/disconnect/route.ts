import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';

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

    // Delete user's Trello configuration
    const { error: configError } = await taskyDb
      .from('user_platform_configs')
      .delete()
      .eq('user_id', session.user.id)
      .eq('platform', 'trello')
      .eq('config_name', configName);

    if (configError) {
      console.error('Database error:', configError);
      return NextResponse.json(
        { error: 'Failed to delete Trello configuration' },
        { status: 500 }
      );
    }

    // Update platform connection status to disconnected
    await taskyDb
      .from('stories_platform_connections')
      .update({
        connection_status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .eq('platform', 'trello');

    // Update all related projects connection status
    await taskyDb
      .from('stories_projects')
      .update({
        connection_status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .eq('platform', 'trello');

    return NextResponse.json({
      success: true,
      message: 'Trello connection disconnected successfully'
    });

  } catch (error) {
    console.error('Trello disconnect error:', error);
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

    // Check Trello connection status
    const { data: configs, error } = await taskyDb
      .from('user_platform_configs_safe')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'trello')
      .eq('is_active', true);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to check Trello connection status' },
        { status: 500 }
      );
    }

    const isConnected = configs && configs.length > 0;

    return NextResponse.json({
      success: true,
      connected: isConnected,
      configs: configs || [],
      message: isConnected ? 'Trello is connected' : 'Trello is not connected'
    });

  } catch (error) {
    console.error('Check Trello connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}