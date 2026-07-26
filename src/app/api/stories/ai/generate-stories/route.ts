import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { storiesProjects, storiesDocuments } from '@/lib/db/schema/stories';
import { eq, and } from 'drizzle-orm';
import { generateText } from 'ai';

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
    const { reportDocumentId, projectId, platform = 'jira' } = body;

    if (!reportDocumentId && !projectId) {
      return NextResponse.json(
        { error: 'Either reportDocumentId or projectId is required' },
        { status: 400 }
      );
    }

    let reportContent = '';
    let projectData = null;

    if (reportDocumentId) {
      const [row] = await db
        .select()
        .from(storiesDocuments)
        .innerJoin(storiesProjects, eq(storiesDocuments.projectId, storiesProjects.id))
        .where(
          and(
            eq(storiesDocuments.id, reportDocumentId),
            eq(storiesProjects.userId, session.user.id),
            eq(storiesDocuments.documentType, 'report'),
          )
        );

      if (!row) {
        return NextResponse.json(
          { error: 'Report document not found or access denied' },
          { status: 404 }
        );
      }

      reportContent = extractTextFromBlockNote(row.stories_documents.content as any[]);
      projectData = row.stories_projects;
    } else if (projectId) {
      const [project] = await db
        .select()
        .from(storiesProjects)
        .where(
          and(
            eq(storiesProjects.id, projectId),
            eq(storiesProjects.userId, session.user.id),
          )
        );

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        );
      }

      projectData = project;
      reportContent = `Project: ${project.projectName}\nPlatform: ${project.platform}`;
    }

    const platformTemplates = {
      jira: {
        storyFormat: `- Story: STORY-XXX Story Title
  Description: Brief description of the story
  Acceptance_Criteria:
    - [ ] Criterion 1
    - [ ] Criterion 2
    - [ ] Criterion 3
  Priority: High/Medium/Low
  Labels: [feature, backend, frontend]
  Assignees: developer@example.com
  Reporter: reporter@example.com`,
        instructions: 'Generate user stories in Jira format with proper story IDs, acceptance criteria, priorities, labels, assignees, and reporters.'
      },
      trello: {
        storyFormat: `- Story: Story Title
  Description: Brief description of the story
  Acceptance_Criteria:
    - [ ] Criterion 1
    - [ ] Criterion 2
    - [ ] Criterion 3
  Priority: p1/p2/p3
  Labels: [feature, backend, frontend]
  Assignees: @developer`,
        instructions: 'Generate user stories in Trello format with priority levels (p1/p2/p3), labels, and member aliases (@username).'
      }
    };

    const template = platformTemplates[platform as keyof typeof platformTemplates] || platformTemplates.jira;

    const systemPrompt = `You are an expert product manager and user story writer specializing in ${platform.toUpperCase()} project management.

Your task is to analyze project reports and generate comprehensive user stories that cover all the requirements and features mentioned.

Guidelines:
1. Create detailed user stories with clear acceptance criteria
2. Use proper ${platform.toUpperCase()} formatting and conventions
3. Include appropriate priority levels and labels
4. Ensure stories are testable and implementable
5. Break down complex features into smaller, manageable stories
6. Follow the ${platform === 'jira' ? 'INVEST' : 'SMART'} criteria for good user stories

Story Format Template:
${template.storyFormat}

${template.instructions}

Project Platform: ${platform.toUpperCase()}
Project Name: ${projectData?.projectName || 'Unknown Project'}`;

    const userPrompt = `Based on the following project report, please generate comprehensive user stories:

Report Content:
${reportContent || 'No report content provided. Please generate basic user stories for project setup and initial features.'}

Please generate 5-10 user stories that cover the main features and requirements mentioned in the report. Each story should be well-structured with clear acceptance criteria.`;

    try {
      const { getUserAISettings } = await import('@/lib/ai/settings');
      const { getModel } = await import('@/lib/ai/models');
      
      const settings = await getUserAISettings(session.user.id);
      const model = await getModel(session.user.id, settings.defaultProvider, settings.defaultModel);
      
      const { text } = await generateText({
        model: model,
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens: settings.maxTokens || 3000,
        temperature: settings.temperature || 0.7,
      });

      const storiesFileName = `${projectData?.projectName?.replace(/\s+/g, '-') || 'Project'}-${platform.charAt(0).toUpperCase() + platform.slice(1)}-Stories.md`;
      
      const blockNoteContent = parseMarkdownToBlockNote(text);

      const [storiesDoc] = await db
        .insert(storiesDocuments)
        .values({
          projectId: projectData?.id || projectId,
          documentType: 'stories',
          fileName: storiesFileName,
          title: `${projectData?.projectName || 'Project'} ${platform.charAt(0).toUpperCase() + platform.slice(1)} Stories`,
          content: blockNoteContent,
          metadata: {
            generated_from: 'ai',
            source_report_id: reportDocumentId,
            platform,
            generated_at: new Date(),
            ai_model: 'gemini-3-flash-preview',
          },
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: 'User stories generated successfully',
        generatedContent: text,
        storiesDocument: storiesDoc,
        blockNoteContent,
      });

    } catch (aiError) {
      console.error('AI generation error:', aiError);
      return NextResponse.json(
        { error: 'Failed to generate user stories' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Generate stories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function extractTextFromBlockNote(content: any[]): string {
  if (!Array.isArray(content)) return '';
  
  return content.map(block => {
    if (block.content && Array.isArray(block.content)) {
      return block.content.map((item: any) => item.text || '').join('');
    }
    return '';
  }).join('\n');
}

function parseMarkdownToBlockNote(markdown: string): any[] {
  const lines = markdown.split('\n');
  const blocks: any[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      blocks.push({
        type: 'paragraph',
        content: [{ type: 'text', text: '' }]
      });
      continue;
    }
    
    if (line.startsWith('# ')) {
      blocks.push({
        type: 'heading',
        props: { level: 1 },
        content: [{ type: 'text', text: line.substring(2) }]
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        type: 'heading',
        props: { level: 2 },
        content: [{ type: 'text', text: line.substring(3) }]
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        type: 'heading',
        props: { level: 3 },
        content: [{ type: 'text', text: line.substring(4) }]
      });
    }
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        type: 'bulletListItem',
        content: [{ type: 'text', text: line.substring(2) }]
      });
    }
    else if (/^\d+\.\s/.test(line)) {
      blocks.push({
        type: 'numberedListItem',
        content: [{ type: 'text', text: line.replace(/^\d+\.\s/, '') }]
      });
    }
    else {
      blocks.push({
        type: 'paragraph',
        content: [{ type: 'text', text: line }]
      });
    }
  }
  
  return blocks;
}
