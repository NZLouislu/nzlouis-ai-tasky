import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
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
    const { documentId, instruction, currentContent, documentType = 'report', platform = 'jira' } = body;

    if (!documentId || !instruction) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, instruction' },
        { status: 400 }
      );
    }

    // Create context-aware prompt for report improvement
    const systemPrompt = `You are an expert technical writer and project manager specializing in creating comprehensive project reports. 

Your task is to help improve and enhance project reports based on user instructions. You should:

1. Analyze the current content structure and identify areas for improvement
2. Add relevant sections, details, or content based on the instruction
3. Maintain professional tone and clear structure
4. Focus on actionable and practical content
5. Ensure the content is suitable for ${platform.toUpperCase()} project management

Current document type: ${documentType}
Platform: ${platform}

When generating content, use proper markdown formatting and structure it logically.`;

    const userPrompt = `Current report content:
${currentContent || 'No content provided'}

Instruction: ${instruction}

Please provide improved content for this report. Focus on the specific instruction while maintaining the overall structure and adding valuable information.`;

    try {
      const { getUserAISettings } = await import('@/lib/ai/settings');
      const { getModel } = await import('@/lib/ai/models');
      
      const settings = await getUserAISettings(session.user.id);
      const model = await getModel(session.user.id, settings.defaultProvider, settings.defaultModel);

      const { text } = await generateText({
        model: model,
        system: systemPrompt,
        prompt: userPrompt,
        maxTokens: settings.maxTokens || 2000,
        temperature: settings.temperature || 0.7,
      });

      // Parse the generated content into BlockNote format
      const blockNoteContent = parseMarkdownToBlockNote(text);

      return NextResponse.json({
        success: true,
        generatedContent: text,
        blockNoteContent,
        instruction,
        documentId,
      });

    } catch (aiError) {
      console.error('AI generation error:', aiError);
      return NextResponse.json(
        { error: 'Failed to generate improved content' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Improve report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to convert markdown to BlockNote format
function parseMarkdownToBlockNote(markdown: string): any[] {
  const lines = markdown.split('\n');
  const blocks: any[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      // Empty line - add paragraph break
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
    // Code blocks
    else if (line.startsWith('```')) {
      const language = line.substring(3);
      const codeLines = [];
      i++; // Move to next line
      
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      
      blocks.push({
        type: 'codeBlock',
        props: { language: language || 'text' },
        content: [{ type: 'text', text: codeLines.join('\n') }]
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