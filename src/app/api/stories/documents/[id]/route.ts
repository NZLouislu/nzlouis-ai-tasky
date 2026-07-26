import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { storiesProjects, storiesDocuments } from '@/lib/db/schema/stories';
import { eq, and } from 'drizzle-orm';
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

    const [row] = await db
      .select()
      .from(storiesDocuments)
      .innerJoin(storiesProjects, eq(storiesDocuments.projectId, storiesProjects.id))
      .where(
        and(
          eq(storiesDocuments.id, documentId),
          eq(storiesProjects.userId, userId),
        )
      );

    if (!row) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    const document = {
      ...row.stories_documents,
      stories_projects: row.stories_projects,
    };

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

    const [existingDoc] = await db
      .select({
        id: storiesDocuments.id,
        metadata: storiesDocuments.metadata,
      })
      .from(storiesDocuments)
      .innerJoin(storiesProjects, eq(storiesDocuments.projectId, storiesProjects.id))
      .where(
        and(
          eq(storiesDocuments.id, documentId),
          eq(storiesProjects.userId, userId),
        )
      );

    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (fileName !== undefined) updateData.fileName = fileName;
    if (metadata !== undefined) {
      updateData.metadata = {
        ...(existingDoc.metadata ?? {}),
        ...metadata,
        updated_from: 'api',
        last_modified_at: new Date(),
      };
    }

    const [document] = await db
      .update(storiesDocuments)
      .set(updateData)
      .where(eq(storiesDocuments.id, documentId))
      .returning();

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

    const [existingDoc] = await db
      .select({ id: storiesDocuments.id })
      .from(storiesDocuments)
      .innerJoin(storiesProjects, eq(storiesDocuments.projectId, storiesProjects.id))
      .where(
        and(
          eq(storiesDocuments.id, documentId),
          eq(storiesProjects.userId, userId),
        )
      );

    if (!existingDoc) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    await db
      .delete(storiesDocuments)
      .where(eq(storiesDocuments.id, documentId));

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
