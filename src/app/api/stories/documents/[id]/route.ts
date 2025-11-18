import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { getUserIdFromRequest } from '@/lib/admin-auth';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    // Get document with project info
    const { data: document, error } = await taskyDb
      .from('stories_documents')
      .select(`
        *,
        stories_projects!inner(
          id,
          project_name,
          platform,
          user_id,
          platform_credentials,
          project_metadata
        )
      `)
      .eq('id', documentId)
      .eq('stories_projects.user_id', userId)
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document,
    });

  } catch (error) {
    console.error('Get document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const documentId = resolvedParams.id;
    const body = await request.json();
    const { title, content, fileName, metadata } = body;

    // Verify document belongs to user
    const { data: existingDoc, error: checkError } = await taskyDb
      .from('stories_documents')
      .select(`
        id,
        metadata,
        stories_projects!inner(user_id)
      `)
      .eq('id', documentId)
      .eq('stories_projects.user_id', userId)
      .single();

    if (checkError || !existingDoc) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // Update document
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (fileName !== undefined) updateData.file_name = fileName;
    if (metadata !== undefined) {
      updateData.metadata = {
        ...(existingDoc.metadata ?? {}),
        ...metadata,
        updated_from: 'api',
        last_modified_at: new Date().toISOString(),
      };
    }

    const { data: document, error: updateError } = await taskyDb
      .from('stories_documents')
      .update(updateData)
      .eq('id', documentId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document updated successfully',
      document,
    });

  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    // Verify document belongs to user
    const { data: existingDoc, error: checkError } = await taskyDb
      .from('stories_documents')
      .select(`
        id,
        stories_projects!inner(user_id)
      `)
      .eq('id', documentId)
      .eq('stories_projects.user_id', userId)
      .single();

    if (checkError || !existingDoc) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // Delete document
    const { error: deleteError } = await taskyDb
      .from('stories_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}