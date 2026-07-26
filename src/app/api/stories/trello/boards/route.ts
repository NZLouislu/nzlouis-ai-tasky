import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { userPlatformConfigs, storiesProjects, storiesDocuments } from '@/lib/db/schema/stories';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '@/lib/encryption';
import { getUserIdFromRequest } from '@/lib/admin-auth';

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

    const configs = await db
      .select()
      .from(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, userId),
          eq(userPlatformConfigs.platform, 'trello'),
          eq(userPlatformConfigs.isActive, true),
        )
      );

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'No active Trello configuration found' },
        { status: 404 }
      );
    }

    const config = configs[0];

    let trelloKey: string;
    let trelloToken: string;
    try {
      trelloKey = decrypt(config.trelloKeyEncrypted!);
      trelloToken = decrypt(config.trelloTokenEncrypted!);
    } catch (error) {
      console.error('Failed to decrypt Trello credentials:', error);
      return NextResponse.json(
        { error: 'Failed to decrypt credentials' },
        { status: 500 }
      );
    }

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
        configName: config.configName,
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
    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
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

    const configs = await db
      .select()
      .from(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, userId),
          eq(userPlatformConfigs.platform, 'trello'),
          eq(userPlatformConfigs.isActive, true),
        )
      );

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'No active Trello configuration found' },
        { status: 404 }
      );
    }

    const config = configs[0];

    const [project] = await db
      .insert(storiesProjects)
      .values({
        userId,
        platform: 'trello',
        platformProjectId: boardId,
        projectName: boardName,
        googleAccountEmail: session?.user?.email || '',
        connectionStatus: 'connected',
        platformCredentials: {
          board_id: boardId,
        },
        projectMetadata: {
          config_name: config.configName,
          created_from: 'api',
        },
      })
      .returning();

    const reportFileName = `${boardName.replace(/\s+/g, '-')}-Report.md`;
    const [reportDoc] = await db
      .insert(storiesDocuments)
      .values({
        projectId: project.id,
        documentType: 'report',
        fileName: reportFileName,
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
      .returning();

    const storiesFileName = `${boardName.replace(/\s+/g, '-')}-Trello-Stories.md`;
    await db
      .insert(storiesDocuments)
      .values({
        projectId: project.id,
        documentType: 'stories',
        fileName: storiesFileName,
        title: `${boardName} Stories`,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `# ${boardName} Trello Stories\n\nThis document contains user stories to be synced with Trello.\n\n## List: To Do\n\n- Story: Implement Feature A\n  Description: As a user, I want to...\n  Checklist: Acceptance Criteria\n    - [ ] Criteria 1\n    - [ ] Criteria 2\n  Labels: [feature-a]\n  Members: [me]\n`
              }
            ]
          }
        ],
        metadata: {
          created_from: 'api',
          board_id: boardId,
        },
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Trello board added successfully',
      project: {
        id: project.id,
        boardId,
        boardName,
        platform: 'trello',
        createdAt: project.createdAt,
        reportDocument: reportDoc ? {
          id: reportDoc.id,
          fileName: reportDoc.fileName,
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
