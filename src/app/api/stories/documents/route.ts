import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { generateDocument } from '@/lib/stories/document-generator';
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const documentType = searchParams.get('type') as 'report' | 'stories' | null;

    let query = taskyDb
      .from('stories_documents')
      .select(`
        *,
        stories_projects!inner(
          id,
          project_name,
          platform,
          user_id
        )
      `)
      .eq('stories_projects.user_id', userId);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (documentType) {
      query = query.eq('document_type', documentType);
    }

    const { data: documents, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
      totalCount: documents?.length || 0,
    });

  } catch (error) {
    console.error('Get documents error:', error);
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
    const { projectId, documentType, title, content, fileName, metadata } = body;

    if (!projectId || !documentType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, documentType, title' },
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await taskyDb
      .from('stories_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const { data: existingDoc } = await taskyDb
      .from('stories_documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('document_type', documentType)
      .single();

    if (existingDoc) {
      return NextResponse.json({
        success: true,
        message: 'Document already exists',
        document: existingDoc,
        isExisting: true,
      });
    }

    let documentContent = content;
    let documentFileName = fileName;
    
    if (!documentContent) {
      const generatedDoc = generateDocument({
        projectName: project.project_name,
        projectKey: project.platform_credentials?.project_key || project.platform_credentials?.board_id,
        platform: project.platform as 'jira' | 'trello',
        documentType: documentType as 'report' | 'stories',
      });
      
      documentContent = generatedDoc.content;
      documentFileName = documentFileName || generatedDoc.fileName;
    }

    const { data: document, error: docError } = await taskyDb
      .from('stories_documents')
      .insert({
        project_id: projectId,
        document_type: documentType,
        file_name: documentFileName || `${project.project_name}-${documentType}.md`,
        title,
        content: documentContent || [],
        metadata: {
          ...metadata,
          created_from: 'api',
          project_name: project.project_name,
          platform: project.platform,
        },
      })
      .select('*')
      .single();

    if (docError) {
      console.error('Database error:', docError);
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document created successfully',
      document,
    });

  } catch (error) {
    console.error('Create document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}