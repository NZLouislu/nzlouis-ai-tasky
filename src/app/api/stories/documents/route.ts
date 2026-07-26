import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { storiesProjects, storiesDocuments } from '@/lib/db/schema/stories';
import { eq, and, desc } from 'drizzle-orm';
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

    const conditions = [eq(storiesProjects.userId, userId)];
    if (projectId) conditions.push(eq(storiesDocuments.projectId, projectId));
    if (documentType) conditions.push(eq(storiesDocuments.documentType, documentType));

    const rows = await db
      .select()
      .from(storiesDocuments)
      .innerJoin(storiesProjects, eq(storiesDocuments.projectId, storiesProjects.id))
      .where(and(...conditions))
      .orderBy(desc(storiesDocuments.updatedAt));

    const documents = rows.map(row => ({
      ...row.stories_documents,
      stories_projects: row.stories_projects,
    }));

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

    const [project] = await db
      .select()
      .from(storiesProjects)
      .where(
        and(
          eq(storiesProjects.id, projectId),
          eq(storiesProjects.userId, userId),
        )
      );

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const [existingDoc] = await db
      .select()
      .from(storiesDocuments)
      .where(
        and(
          eq(storiesDocuments.projectId, projectId),
          eq(storiesDocuments.documentType, documentType),
        )
      );

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
        projectName: project.projectName,
        projectKey: (project.platformCredentials as any)?.project_key || (project.platformCredentials as any)?.board_id,
        platform: project.platform as 'jira' | 'trello',
        documentType: documentType as 'report' | 'stories',
      });
      
      documentContent = generatedDoc.content;
      documentFileName = documentFileName || generatedDoc.fileName;
    }

    const [document] = await db
      .insert(storiesDocuments)
      .values({
        projectId,
        documentType,
        fileName: documentFileName || `${project.projectName}-${documentType}.md`,
        title,
        content: documentContent || [],
        metadata: {
          ...metadata,
          created_from: 'api',
          project_name: project.projectName,
          platform: project.platform,
        },
      })
      .returning();

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
