import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';
import { syncStoriesToJira, parseStoriesContent } from '@/lib/stories/sync/jira-sync';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

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

    const supabase = getSupabaseClient();

    // Get document content
    const { data: document, error: docError } = await supabase
      .from('stories_documents')
      .select(`
        *,
        project:stories_projects(*)
      `)
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify user owns this document
    if (document.project.user_id !== session.user.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if document is a stories document
    if (document.document_type !== 'stories') {
      return NextResponse.json({ error: 'Only stories documents can be synced' }, { status: 400 });
    }

    // Get Jira connection for this project
    const { data: connection, error: connError } = await supabase
      .from('stories_platform_connections')
      .select('*')
      .eq('user_id', session.user.email)
      .eq('platform', 'jira')
      .eq('google_account_email', document.project.google_account_email)
      .single();

    if (connError || !connection) {
      return NextResponse.json({ error: 'Jira connection not found' }, { status: 404 });
    }

    if (connection.connection_status !== 'connected') {
      return NextResponse.json({ error: 'Jira connection is not active' }, { status: 400 });
    }

    // Convert BlockNote content to markdown (simplified)
    const markdownContent = convertBlockNoteToMarkdown(document.content);
    
    // Parse stories from content
    const stories = parseStoriesContent(markdownContent);

    if (stories.length === 0) {
      return NextResponse.json({ error: 'No stories found in document' }, { status: 400 });
    }

    // Get Jira configuration
    const jiraConfig = {
      baseUrl: document.project.project_metadata?.jira_url || 'https://your-domain.atlassian.net',
      email: connection.google_account_email,
      apiToken: decryptToken(connection.access_token_encrypted),
      projectKey: document.project.platform_project_id,
      issueTypeId: '10001', // Story issue type
      subTaskTypeId: '10003', // Sub-task issue type
      priorityMap: {
        'high': '1',
        'medium': '3',
        'low': '4'
      },
      userMap: {} // Would be populated from Jira users
    };

    // Start sync process
    const syncStartTime = new Date();
    
    // Create sync history record
    const { data: syncHistory, error: syncError } = await supabase
      .from('stories_sync_history')
      .insert({
        document_id: documentId,
        sync_direction: 'to_platform',
        platform: 'jira',
        sync_status: 'in_progress',
        started_at: syncStartTime.toISOString()
      })
      .select()
      .single();

    if (syncError) {
      return NextResponse.json({ error: 'Failed to create sync record' }, { status: 500 });
    }

    try {
      // Sync stories to Jira
      const results = await syncStoriesToJira(stories, jiraConfig);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      // Update sync history
      await supabase
        .from('stories_sync_history')
        .update({
          sync_status: failureCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed'),
          items_synced: successCount,
          items_failed: failureCount,
          sync_details: { results },
          completed_at: new Date().toISOString()
        })
        .eq('id', syncHistory.id);

      // Update document last_synced_at
      await supabase
        .from('stories_documents')
        .update({
          last_synced_at: new Date().toISOString()
        })
        .eq('id', documentId);

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
      await supabase
        .from('stories_sync_history')
        .update({
          sync_status: 'failed',
          error_message: syncError instanceof Error ? syncError.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', syncHistory.id);

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

    const supabase = getSupabaseClient();

    // Get sync history for document
    const { data: syncHistory, error } = await supabase
      .from('stories_sync_history')
      .select('*')
      .eq('document_id', documentId)
      .eq('platform', 'jira')
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sync history' }, { status: 500 });
    }

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
  // Simplified conversion - would need proper BlockNote to Markdown converter
  return content.map(block => {
    if (block.type === 'paragraph') {
      return block.content?.map((item: any) => item.text || '').join('') || '';
    }
    return '';
  }).join('\n');
}

function decryptToken(encryptedToken: string): string {
  // Placeholder - would use actual decryption
  return encryptedToken;
}