import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { storiesProjects, storiesDocuments } from '@/lib/db/schema/stories';
import { eq, desc } from 'drizzle-orm';
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

    const rows = await db
      .select()
      .from(storiesProjects)
      .leftJoin(storiesDocuments, eq(storiesDocuments.projectId, storiesProjects.id))
      .where(eq(storiesProjects.userId, userId))
      .orderBy(desc(storiesProjects.createdAt));

    const projectMap = new Map<string, any>();
    for (const row of rows) {
      const project = row.stories_projects;
      const doc = row.stories_documents;
      if (!projectMap.has(project.id)) {
        projectMap.set(project.id, { ...project, stories_documents: [] });
      }
      if (doc) {
        projectMap.get(project.id).stories_documents.push(doc);
      }
    }
    const projects = Array.from(projectMap.values());

    return NextResponse.json({
      success: true,
      projects: projects || [],
      totalCount: projects?.length || 0,
    });

  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
