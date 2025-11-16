import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { createClient } from '@supabase/supabase-js';
import { syncStoriesToTrello, parseStoriesForTrello } from '@/lib/stories/sync/trello-sync';

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

    // Get Trello connection for this project
    const { data: connection, error: connError } = await supabase
      .from('stories_platform_connections')
      .select('*')
      .eq('user_id', session.user.email)
      .eq('platform', 'trello')
      .eq('google_account_email', document.project.google_account_email)
      .single();

    if (connError || !connection) {
      return NextResponse.json({ error: 'Trello connection not found' }, { status: 404 });
    }

    if (connection.connection_status !== 'connected') {
      return NextResponse.json({ error: 'Trello connection is not active' }, { status: 400 });
    }

    // Convert BlockNote content to markdown (simplified)
    const markdownContent = convertBlockNoteToMarkdown(document.content);
    
    // Parse stories from content
    const stories = parseStoriesForTrello(markdownContent);

    if (stories.length === 0) {
      return NextResponse.json({ error: 'No stories found in document' }, { status: 400 });
    }

    // Get Trello configuration
    const trelloConfig = {
      key: process.env.TRELLO_API_KEY!,
      token: decryptToken(connection.access_token_encrypted),
      boardId: document.project.platform_project_id,
      listId: document.project.project_metadata?.trello_list_id || 'default-list-id',
      priorityLabelMap: {
        'high': 'High Priority',
        'medium': 'Medium Priority',
        'low': 'Low Priority',
        'critical': 'Critical'
      },
      memberAliasMap: document.project.project_metadata?.member_aliases || {}
    };

    // Start sync process
    const syncStartTime = new Date();
    
    // Create sync history record
    const { data: syncHistory, error: syncError } = await supabase
      .from('stories_sync_history')
      .insert({
        document_id: documentId,
        sync_direction: 'to_platform',
        platform: 'trello',
        sync_status: 'in_progress',
        started_at: syncStartTime.toISOString()
      })
      .select()
      .single();

    if (syncError) {
      return NextResponse.json({ error: 'Failed to create sync record' }, { status: 500 });
    }

    try {
      // Sync stories to Trello
      const results = await syncStoriesToTrello(stories, trelloConfig);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const totalChecklists = results.reduce((sum, r) => sum + (r.checklistsCreated || 0), 0);
      
      // Update sync history
      await supabase
        .from('stories_sync_history')
        .update({
          sync_status: failureCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed'),
          items_synced: successCount,
          items_failed: failureCount,
          sync_details: { results, checklistsCreated: totalChecklists },
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
          checklistsCreated: totalChecklists,
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
    console.error('Trello sync error:', error);
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
      .eq('platform', 'trello')
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