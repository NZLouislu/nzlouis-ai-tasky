import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { decrypt } from '@/lib/encryption';

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
    const { data: configs, error: configError } = await taskyDb
      .from('user_platform_configs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'trello')
      .eq('is_active', true);

    if (configError) {
      console.error('Database error:', configError);
      return NextResponse.json(
        { error: 'Failed to fetch Trello configurations' },
        { status: 500 }
      );
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'No active Trello configuration found' },
        { status: 404 }
      );
    }

    const config = configs[0]; // Use first active configuration

    // Decrypt credentials
    let trelloKey: string;
    let trelloToken: string;
    try {
      trelloKey = decrypt(config.trello_key_encrypted);
      trelloToken = decrypt(config.trello_token_encrypted);
    } catch (error) {
      console.error('Failed to decrypt Trello credentials:', error);
      return NextResponse.json(
        { error: 'Failed to decrypt credentials' },
        { status: 500 }
      );
    }

    // Get Trello boards list
    try {
      const boardsResponse = await fetch(
        `https://api.trello.com/1/members/me/boards?key=${trelloKey}&token=${trelloToken}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!boardsResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch boards from Trello' },
          { status: 400 }
        );
      }

      const boards = await boardsResponse.json();

      // Filter and format board data
      const formattedBoards = boards.map((board: any) => ({
        id: board.id,
        name: board.name,
        desc: board.desc || '',
        closed: board.closed,
        url: board.url,
        shortUrl: board.shortUrl,
        prefs: {
          background: board.prefs?.background || '',
          backgroundColor: board.prefs?.backgroundColor || '',
        },
        dateLastActivity: board.dateLastActivity,
      }));

      return NextResponse.json({
        success: true,
        boards: formattedBoards,
        totalCount: formattedBoards.length,
        configName: config.config_name,
      });

    } catch (error) {
      console.error('Trello API error:', error);
      return NextResponse.json(
        { error: 'Failed to connect to Trello API' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Get Trello boards error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const { boardId, boardName } = body;

    if (!boardId || !boardName) {
      return NextResponse.json(
        { error: 'Missing required fields: boardId, boardName' },
        { status: 400 }
      );
    }

    // Get user's Trello configuration
    const { data: configs, error: configError } = await taskyDb
      .from('user_platform_configs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'trello')
      .eq('is_active', true);

    if (configError || !configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'No active Trello configuration found' },
        { status: 404 }
      );
    }

    const config = configs[0];

    // Create Stories project record
    const { data: project, error: projectError } = await taskyDb
      .from('stories_projects')
      .insert({
        user_id: session.user.id,
        platform: 'trello',
        platform_project_id: boardId,
        project_name: boardName,
        google_account_email: session.user.email || '',
        connection_status: 'connected',
        platform_credentials: {
          board_id: boardId,
        },
        project_metadata: {
          config_name: config.config_name,
          created_from: 'api',
        },
      })
      .select('*')
      .single();

    if (projectError) {
      console.error('Database error:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project record' },
        { status: 500 }
      );
    }

    // Create default Report document
    const reportFileName = `${boardName.replace(/\s+/g, '-')}-Report.md`;
    const { data: reportDoc, error: reportError } = await taskyDb
      .from('stories_documents')
      .insert({
        project_id: project.id,
        document_type: 'report',
        file_name: reportFileName,
        title: `${boardName} Report`,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `# ${boardName} Board Report\n\nThis is the project report for ${boardName}.\n\n## Overview\n\n## Requirements\n\n## Implementation Plan\n\n## Notes\n`
              }
            ]
          }
        ],
        metadata: {
          created_from: 'api',
          board_id: boardId,
        },
      })
      .select('*')
      .single();

    if (reportError) {
      console.error('Failed to create report document:', reportError);
    }

    return NextResponse.json({
      success: true,
      message: 'Trello board added successfully',
      project: {
        id: project.id,
        boardId,
        boardName,
        platform: 'trello',
        createdAt: project.created_at,
        reportDocument: reportDoc ? {
          id: reportDoc.id,
          fileName: reportDoc.file_name,
          title: reportDoc.title,
        } : null,
      }
    });

  } catch (error) {
    console.error('Add Trello board error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}