import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { storiesDocuments, storiesProjects, storiesPlatformConnections, storiesSyncHistory } from '@/lib/db/schema/stories';
import { eq, and, desc } from 'drizzle-orm';
import { syncStoriesToJira, parseStoriesContent } from '@/lib/stories/sync/jira-sync';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get document content
    const [document] = await db
      .select()
      .from(storiesDocuments)
      .where(eq(storiesDocuments.id, documentId));

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get project info
    const [project] = await db
      .select()
      .from(storiesProjects)
      .where(eq(storiesProjects.id, document.projectId));

    // Verify user owns this document
    if (project?.userId !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if document is a stories document
    if (document.documentType !== 'stories') {
      return NextResponse.json({ error: 'Only stories documents can be synced' }, { status: 400 });
    }

    // Get Jira connection for this project
    const [connection] = await db
      .select()
      .from(storiesPlatformConnections)
      .where(
        and(
          eq(storiesPlatformConnections.userId, session.user.email),
          eq(storiesPlatformConnections.platform, 'jira'),
          eq(storiesPlatformConnections.googleAccountEmail, project!.googleAccountEmail)
        )
      );

    if (!connection) {
      return NextResponse.json({ error: 'Jira connection not found' }, { status: 404 });
    }

    if (connection.connectionStatus !== 'connected') {
      return NextResponse.json({ error: 'Jira connection is not active' }, { status: 400 });
    }

    // Convert BlockNote content to markdown (simplified)
    const markdownContent = convertBlockNoteToMarkdown(document.content as any[]);
    
    // Parse stories from content
    const stories = parseStoriesContent(markdownContent);

    if (stories.length === 0) {
      return NextResponse.json({ error: 'No stories found in document' }, { status: 400 });
    }

    // Get Jira configuration
    const projectMeta = project?.projectMetadata as { jira_url?: string } | null;
    const jiraConfig = {
      baseUrl: projectMeta?.jira_url || 'https://your-domain.atlassian.net',
      email: connection.googleAccountEmail,
      apiToken: decryptToken(connection.accessTokenEncrypted || ''),
      projectKey: project?.platformProjectId || '',
      issueTypeId: '10001',
      subTaskTypeId: '10003',
      priorityMap: {
        'high': '1',
        'medium': '3',
        'low': '4'
      },
      userMap: {}
    };

    // Start sync process
    const syncStartTime = new Date();
    
    // Create sync history record
    const [syncHistory] = await db
      .insert(storiesSyncHistory)
      .values({
        documentId,
        syncDirection: 'to_platform',
        platform: 'jira',
        syncStatus: 'in_progress',
        startedAt: syncStartTime,
      })
      .returning();

    if (!syncHistory) {
      return NextResponse.json({ error: 'Failed to create sync record' }, { status: 500 });
    }

    try {
      const results = await syncStoriesToJira(stories, jiraConfig);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      // Update sync history
      await db
        .update(storiesSyncHistory)
        .set({
          syncStatus: failureCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed'),
          itemsSynced: successCount,
          itemsFailed: failureCount,
          syncDetails: { results },
          completedAt: new Date(),
        })
        .where(eq(storiesSyncHistory.id, syncHistory.id));

      // Update document last_synced_at
      await db
        .update(storiesDocuments)
        .set({
          lastSyncedAt: new Date(),
        })
        .where(eq(storiesDocuments.id, documentId));

      return NextResponse.json({
        success: true,
        syncId: syncHistory.id,
        results: {
          total: stories.length,
          synced: successCount,
          failed: failureCount,
          details: results
        }
      });

    } catch (syncError) {
      // Update sync history with error
      await db
        .update(storiesSyncHistory)
        .set({
          syncStatus: 'failed',
          errorMessage: syncError instanceof Error ? syncError.message : 'Unknown error',
          completedAt: new Date(),
        })
        .where(eq(storiesSyncHistory.id, syncHistory.id));

      throw syncError;
    }

  } catch (error) {
    console.error('Jira sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Get sync history for document
    const syncHistory = await db
      .select()
      .from(storiesSyncHistory)
      .where(
        and(
          eq(storiesSyncHistory.documentId, documentId),
          eq(storiesSyncHistory.platform, 'jira')
        )
      )
      .orderBy(desc(storiesSyncHistory.startedAt))
      .limit(10);

    return NextResponse.json({ syncHistory });

  } catch (error) {
    console.error('Get sync history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function convertBlockNoteToMarkdown(content: any[]): string {
  return content.map(block => {
    if (block.type === 'paragraph') {
      return block.content?.map((item: any) => item.text || '').join('') || '';
    }
    return '';
  }).join('\n');
}

function decryptToken(encryptedToken: string): string {
  return encryptedToken;
}
