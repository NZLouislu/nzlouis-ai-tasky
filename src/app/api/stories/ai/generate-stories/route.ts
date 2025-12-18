import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { generateText } from 'ai';
import { generateDocument } from '@/lib/stories/document-generator';

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

    // Get report content if reportDocumentId provided
    if (reportDocumentId) {
      const { data: reportDoc, error: reportError } = await taskyDb
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
        .eq('id', reportDocumentId)
        .eq('stories_projects.user_id', session.user.id)
        .eq('document_type', 'report')
        .single();

      if (reportError || !reportDoc) {
        return NextResponse.json(
          { error: 'Report document not found or access denied' },
          { status: 404 }
        );
      }

      // Convert BlockNote content to text
      reportContent = extractTextFromBlockNote(reportDoc.content);
      projectData = reportDoc.stories_projects;
    } else if (projectId) {
      // Get project data
      const { data: project, error: projectError } = await taskyDb
        .from('stories_projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', session.user.id)
        .single();

      if (projectError || !project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 404 }
        );
      }

      projectData = project;
      reportContent = `Project: ${project.project_name}\nPlatform: ${project.platform}`;
    }

    // Create platform-specific prompt
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
Project Name: ${projectData?.project_name || 'Unknown Project'}`;

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

      // Create stories document
      const storiesFileName = `${projectData?.project_name?.replace(/\s+/g, '-') || 'Project'}-${platform.charAt(0).toUpperCase() + platform.slice(1)}-Stories.md`;
      
      // Convert generated text to BlockNote format
      const blockNoteContent = parseMarkdownToBlockNote(text);

      // Save stories document to database
      const { data: storiesDoc, error: saveError } = await taskyDb
        .from('stories_documents')
        .insert({
          project_id: projectData?.id || projectId,
          document_type: 'stories',
          file_name: storiesFileName,
          title: `${projectData?.project_name || 'Project'} ${platform.charAt(0).toUpperCase() + platform.slice(1)} Stories`,
          content: blockNoteContent,
          metadata: {
            generated_from: 'ai',
            source_report_id: reportDocumentId,
            platform,
            generated_at: new Date().toISOString(),
            ai_model: 'gemini-3-flash-preview',
          },
        })
        .select('*')
        .single();

      if (saveError) {
        console.error('Failed to save stories document:', saveError);
        return NextResponse.json(
          { error: 'Failed to save generated stories' },
          { status: 500 }
        );
      }

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

// Helper function to extract text from BlockNote content
function extractTextFromBlockNote(content: any[]): string {
  if (!Array.isArray(content)) return '';
  
  return content.map(block => {
    if (block.content && Array.isArray(block.content)) {
      return block.content.map((item: any) => item.text || '').join('');
    }
    return '';
  }).join('\n');
}

// Helper function to convert markdown to BlockNote format
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
    
    // Headers
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
    // Bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({
        type: 'bulletListItem',
        content: [{ type: 'text', text: line.substring(2) }]
      });
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line)) {
      blocks.push({
        type: 'numberedListItem',
        content: [{ type: 'text', text: line.replace(/^\d+\.\s/, '') }]
      });
    }
    // Regular paragraphs
    else {
      blocks.push({
        type: 'paragraph',
        content: [{ type: 'text', text: line }]
      });
    }
  }
  
  return blocks;
}