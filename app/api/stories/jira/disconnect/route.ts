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

    // 删除用户的Jira配置
    const { error: configError } = await taskyDb
      .from('user_platform_configs')
      .delete()
      .eq('user_id', session.user.id)
      .eq('platform', 'jira')
      .eq('config_name', configName);

    if (configError) {
      console.error('Database error:', configError);
      return NextResponse.json(
        { error: 'Failed to delete Jira configuration' },
        { status: 500 }
      );
    }

    // 更新平台连接状态为断开
    await taskyDb
      .from('stories_platform_connections')
      .update({
        connection_status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .eq('platform', 'jira');

    // 更新所有相关项目的连接状态
    await taskyDb
      .from('stories_projects')
      .update({
        connection_status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .eq('platform', 'jira');

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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 检查Jira连接状态
    const { data: configs, error } = await taskyDb
      .from('user_platform_configs_safe')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'jira')
      .eq('is_active', true);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to check Jira connection status' },
        { status: 500 }
      );
    }

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