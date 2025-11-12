import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { PartialBlock } from '@blocknote/core';

interface ModificationRequest {
  postId: string;
  currentContent: PartialBlock[];
  currentTitle: string;
  instruction: string;
  context?: string;
}

interface ContentModification {
  type: 'replace' | 'insert' | 'append' | 'update_title' | 'add_section';
  target?: string;
  content?: PartialBlock[];
  title?: string;
  position?: number;
}

/**
 * AI Blog Content Modification API
 * 
 * This endpoint receives user instructions and current blog content,
 * then uses AI to generate content modifications.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ModificationRequest = await req.json();
    const { postId, currentContent, currentTitle, instruction, context } = body;

    console.log('AI Modification Request:', {
      postId,
      instruction,
      contentLength: currentContent?.length || 0,
    });

    if (!postId || !instruction) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build AI prompt
    const prompt = buildModificationPrompt({
      currentTitle,
      currentContent,
      instruction,
      context,
    });

    console.log('Calling AI API...');

    // Call AI API (using Google Gemini)
    const aiResponse = await callAIForModification(prompt);

    console.log('AI Response received:', {
      length: aiResponse.length,
      preview: aiResponse.substring(0, 200),
    });

    // Parse AI response into structured modifications
    const modifications = parseAIResponse(aiResponse);

    console.log('Parsed modifications:', modifications.length);

    if (modifications.length === 0) {
      return NextResponse.json({
        success: false,
        modifications: [],
        message: 'No modifications were generated. The AI response may be invalid. Please try rephrasing your request.',
        aiResponse,
      });
    }

    return NextResponse.json({
      success: true,
      modifications,
      message: `Successfully generated ${modifications.length} modification(s)`,
      aiResponse,
    });
  } catch (error) {
    console.error('AI modification error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process AI modification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Build prompt for AI to understand the modification request
 */
function buildModificationPrompt(params: {
  currentTitle: string;
  currentContent: PartialBlock[];
  instruction: string;
  context?: string;
}): string {
  const { currentTitle, currentContent, instruction } = params;

  // Convert BlockNote content to readable text
  const contentText = convertBlockNoteToText(currentContent);
  
  // Limit content length to avoid token limits
  const maxContentLength = 2000;
  const truncatedContent = contentText.length > maxContentLength 
    ? contentText.substring(0, maxContentLength) + '...[truncated]'
    : contentText;

  return `You are a blog content editor. Generate content modifications in JSON format.

Current Article:
Title: "${currentTitle}"
Content: ${truncatedContent || '[Empty]'}

User Request: "${instruction}"

Response Format (JSON only, no markdown):
{
  "modifications": [{
    "type": "append",
    "content": [{
      "type": "paragraph",
      "content": [{"type": "text", "text": "Your content here", "styles": {}}]
    }]
  }],
  "explanation": "What was changed"
}

Types: append, replace, insert, update_title, add_section

Rules:
1. Return ONLY valid JSON (no \`\`\`json blocks)
2. Start with { and end with }
3. Use proper BlockNote format
4. Keep content concise and relevant
5. If request is unclear, use type "append" with helpful content

Example for adding paragraphs:
{
  "modifications": [{
    "type": "append",
    "content": [
      {"type": "heading", "content": [{"type": "text", "text": "Section Title", "styles": {}}], "props": {"level": 2}},
      {"type": "paragraph", "content": [{"type": "text", "text": "First paragraph content.", "styles": {}}]},
      {"type": "paragraph", "content": [{"type": "text", "text": "Second paragraph content.", "styles": {}}]}
    ]
  }],
  "explanation": "Added new section with content"
}

Now generate the JSON response:`;
}

/**
 * Convert BlockNote content to readable text for AI
 */
function convertBlockNoteToText(content: PartialBlock[]): string {
  if (!content || !Array.isArray(content)) return '';

  return content
    .map((block, index) => {
      if (!block || typeof block !== 'object') return '';

      const { type, content: blockContent, props } = block;

      // Handle different block types
      switch (type) {
        case 'paragraph':
          return extractTextFromContent(blockContent);

        case 'heading':
          const level = props?.level || 1;
          const headingText = extractTextFromContent(blockContent);
          return `${'#'.repeat(level)} ${headingText}`;

        case 'bulletListItem':
          return `• ${extractTextFromContent(blockContent)}`;

        case 'numberedListItem':
          return `${index + 1}. ${extractTextFromContent(blockContent)}`;

        case 'checkListItem':
          const checked = props?.checked ? '[x]' : '[ ]';
          return `${checked} ${extractTextFromContent(blockContent)}`;

        case 'codeBlock':
          return `\`\`\`\n${extractTextFromContent(blockContent)}\n\`\`\``;

        case 'image':
          return `[Image: ${props?.url || 'embedded'}]`;

        default:
          return extractTextFromContent(blockContent);
      }
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Extract text from BlockNote content array
 */
function extractTextFromContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && item.text) {
        return item.text;
      }
      return '';
    })
    .join('');
}

/**
 * Call AI API to get modification suggestions
 */
async function callAIForModification(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const apiUrl = process.env.GEMINI_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('AI API configuration missing');
  }

  console.log('Calling Gemini API with prompt length:', prompt.length);

  const response = await fetch(`${apiUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096, // Increased from 2048
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI API error response:', errorText);
    throw new Error(`AI API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log('AI API response data:', JSON.stringify(data, null, 2));

  // Check for blocked content or empty response
  if (data.promptFeedback?.blockReason) {
    console.error('Content blocked:', data.promptFeedback.blockReason);
    throw new Error(`Content blocked: ${data.promptFeedback.blockReason}`);
  }

  const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!aiText || aiText.trim().length === 0) {
    console.error('AI returned empty response');
    console.error('Full response:', JSON.stringify(data, null, 2));
    
    // Check finish reason
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
      throw new Error(`AI generation stopped: ${finishReason}`);
    }
    
    throw new Error('AI returned empty response. Please try a simpler request.');
  }

  console.log('AI response text length:', aiText.length);
  return aiText;
}

/**
 * Parse AI response into structured modifications
 */
function parseAIResponse(aiResponse: string): ContentModification[] {
  try {
    // Check if response is empty
    if (!aiResponse || aiResponse.trim().length === 0) {
      console.warn('AI response is empty');
      return [];
    }

    // Try multiple parsing strategies
    let parsed: { modifications?: ContentModification[]; explanation?: string } | null = null;

    // Strategy 1: Extract JSON from markdown code blocks
    const jsonCodeBlockMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonCodeBlockMatch) {
      try {
        parsed = JSON.parse(jsonCodeBlockMatch[1]) as { modifications?: ContentModification[]; explanation?: string };
      } catch {
        console.warn('Failed to parse JSON from code block');
      }
    }

    // Strategy 2: Extract JSON object directly
    if (!parsed) {
      const jsonObjectMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonObjectMatch) {
        try {
          parsed = JSON.parse(jsonObjectMatch[0]);
        } catch {
          console.warn('Failed to parse JSON object');
        }
      }
    }

    // Strategy 3: Try parsing the entire response as JSON
    if (!parsed) {
      try {
        parsed = JSON.parse(aiResponse);
      } catch {
        console.warn('Failed to parse entire response as JSON');
      }
    }

    // Validate parsed result
    if (!parsed) {
      console.error('Could not extract valid JSON from AI response');
      console.error('AI Response:', aiResponse);
      return [];
    }

    if (!parsed.modifications || !Array.isArray(parsed.modifications)) {
      console.warn('Invalid modification format, attempting to infer modifications');
      
      // Try to infer modifications from the response
      return inferModificationsFromText(aiResponse);
    }

    return parsed.modifications;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('AI Response:', aiResponse);

    // Fallback: return empty modifications
    return [];
  }
}

/**
 * Infer modifications from plain text response
 * This is a fallback when AI doesn't return proper JSON
 */
function inferModificationsFromText(text: string): ContentModification[] {
  // If AI just returns text without JSON, treat it as content to append
  if (text && text.length > 0 && !text.includes('{') && !text.includes('[')) {
    return [
      {
        type: 'append',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: text.trim(),
                styles: {},
              },
            ],
          },
        ],
      },
    ];
  }

  return [];
}
