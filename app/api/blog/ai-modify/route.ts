import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { PartialBlock } from '@blocknote/core';

interface PageModification {
  type: 'replace' | 'insert' | 'append' | 'update_title' | 'add_section';
  target?: string;
  content?: string;
  title?: string;
  position?: number;
}

interface AIModifyRequest {
  postId: string;
  currentContent: PartialBlock[];
  currentTitle: string;
  instruction: string;
}

interface AIModifyResponse {
  modifications: PageModification[];
  explanation: string;
}

function detectLanguage(text: string): string {
  if (/[\u4e00-\u9fa5]/.test(text)) return 'Chinese';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'Japanese';
  if (/[\uac00-\ud7af]/.test(text)) return 'Korean';
  if (/[\u0400-\u04FF]/.test(text)) return 'Russian';
  return 'English';
}
function blocksToText(blocks: PartialBlock[]): string {
  return blocks.map(block => {
    if (typeof block.content === 'string') {
      return block.content;
    }
    if (Array.isArray(block.content)) {
      return block.content.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && 'text' in item) return item.text;
        return '';
      }).join('');
    }
    return '';
  }).filter(text => text.trim()).join('\n\n');
}


async function generateModifications(params: {
  currentContent: PartialBlock[];
  currentTitle: string;
  instruction: string;
  language: string;
}): Promise<AIModifyResponse> {
  const { currentContent, currentTitle, instruction, language } = params;

  const contentText = blocksToText(currentContent);
  const systemPrompt = `You are a professional blog editor and content creation expert. Generate high-quality, detailed, professional content based on user instructions.

**CRITICAL RULES:**
1. **ONLY return valid JSON format with English field names**
2. **DO NOT use Chinese field names like "修改操作" or "操作类型"**
3. **MUST use exact field names: "modifications", "type", "content", "title", "explanation"**
4. **Content must be detailed, professional, and in-depth**
5. **Content language should match user's language (${language})**

**REQUIRED JSON FORMAT:**
{
  "modifications": [
    {
      "type": "append",
      "content": "Detailed content with multiple paragraphs.\\n\\nFirst paragraph...\\n\\nSecond paragraph...\\n\\nThird paragraph..."
    }
  ],
  "explanation": "Added detailed content about xxx, containing xxx paragraphs"
}

**Modification Types:**
- update_title: Modify article title
- replace: Replace all content
- append: Append content at the end (recommended for adding detailed content)
- insert: Insert content at specific position
- add_section: Add new section

**Content Quality Requirements:**
- If user requests "detailed", "more", "expand": generate at least 300-500 words
- Split content into multiple paragraphs using \\n\\n
- Include specific facts, data, examples
- Clear logic and complete structure
- Professional but easy to understand language
- Use ${language} for content

**Example (Mars Exploration):**
If user requests "add detailed history of Mars exploration", generate like:

"Human exploration of Mars began in the early 1960s. In 1960, the Soviet Union launched the first Mars probe, although the mission failed, it opened the prelude to human exploration of Mars.\\n\\n In 1964, the American Mariner 4 became the first probe to successfully fly by Mars, sending back 21 precious photos of the Martian surface. These photos showed that the Martian surface was covered with craters, similar to the Moon, which changed people's understanding of Mars.\\n\\nIn 1971, the Soviet Mars 3 became the first probe to successfully land on Mars, although it only worked for 20 seconds, it marked the first time humans achieved a soft landing on the Martian surface. In the same year, the American Mariner 9 became the first probe to enter Mars orbit, mapping the Martian surface in detail.\\n\\nIn 1976, the American Viking 1 and 2 successfully landed on Mars, conducting years of scientific research to search for signs of Martian life. Although no conclusive evidence of life was found, these two probes provided us with a wealth of valuable data about Martian geology, climate, and atmosphere."

This is high-quality, detailed content.

**IMPORTANT: Return ONLY the JSON object, no other text, no markdown code blocks, no explanations outside the JSON.**`;

  const userPrompt = `Current Article Title: ${currentTitle}

Current Article Content:
${contentText || '(Content is empty)'}

User Instruction: ${instruction}

**Task Requirements:**
Generate high-quality, detailed modification operations based on user instructions.

If user requests:
- "detailed", "more", "expand" → generate at least 300-500 words of detailed content
- "add" → generate relevant, in-depth content
- "modify" → improve existing content to be more professional and detailed

**Content Requirements:**
1. Split into multiple paragraphs (use \\n\\n to separate)
2. Include specific facts, data, examples
3. Clear logic and complete structure
4. Use ${language} language for content
5. Professional but easy to understand

**CRITICAL: Return ONLY valid JSON with these exact field names:**
- "modifications" (array)
- "type" (string: "append", "replace", "update_title", etc.)
- "content" (string: the actual content)
- "explanation" (string: what you did)

Now generate the JSON for modification operations.`;

  try {
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        maxTokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API returned ${response.status}`);
    }

    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line.startsWith('0:')) {
          try {
            const jsonStr = line.substring(2);
            const text = JSON.parse(jsonStr);
            fullResponse += text;
          } catch (error) {
            console.error('Error parsing line:', error);
          }
        }
      }

      buffer = lines[lines.length - 1];
    }

    console.log('AI Full Response:', fullResponse);

    const cleanedResponse = fullResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    console.log('Cleaned Response:', cleanedResponse.substring(0, 200) + '...');

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in AI response, generating default response');
      console.log('Full response was:', cleanedResponse.substring(0, 500));
      return generateDefaultModifications(instruction, currentTitle, language);
    }

    try {
      
      let jsonStr = jsonMatch[0];

      if (jsonStr.includes('"修改操作"') || jsonStr.includes('"操作类型"')) {
        console.warn('Detected Chinese field names, attempting to convert...');
        jsonStr = jsonStr
          .replace(/"修改操作"/g, '"modifications"')
          .replace(/"操作类型"/g, '"type"')
          .replace(/"目标"/g, '"target"')
          .replace(/"新内容"/g, '"content"')
          .replace(/"新标题"/g, '"title"');
      }

      console.log('Cleaning control characters from JSON...');
      let result;
      try {
        
        result = JSON.parse(jsonStr);
      } catch {
        console.log('First parse failed, cleaning control characters...');
        const cleanedStr = jsonStr
          .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n');

        try {
          result = JSON.parse(cleanedStr);
        } catch {
          console.log('Second parse failed, trying manual content field cleaning...');
          const manualClean = cleanedStr.replace(
            /"content"\s*:\s*"([^"]*)"/g,
            (match, content) => {
              const cleaned = content
                .replace(/\n/g, '\\n\\n')
                .replace(/\t/g, ' ')
                .replace(/  +/g, ' ');
              return `"content": "${cleaned}"`;
            }
          );

          try {
            result = JSON.parse(manualClean);
          } catch (thirdError) {
            console.error('All parse attempts failed:', thirdError);
            console.log('Original JSON (first 500 chars):', jsonStr.substring(0, 500));
            console.log('Cleaned JSON (first 500 chars):', cleanedStr.substring(0, 500));
            return generateDefaultModifications(instruction, currentTitle, language);
          }
        }
      }

      console.log('JSON parsed successfully');

      
      if (!result.modifications || !Array.isArray(result.modifications)) {
        console.warn('Invalid response format, generating default response');
        console.log('Parsed result:', JSON.stringify(result).substring(0, 200));
        return generateDefaultModifications(instruction, currentTitle, language);
      }

      
      const validModifications = result.modifications.filter((mod: PageModification) => {
        return mod.type && (mod.content || mod.title);
      });

      if (validModifications.length === 0) {
        console.warn('No valid modifications found');
        return generateDefaultModifications(instruction, currentTitle, language);
      }

      console.log(`✅ Successfully parsed ${validModifications.length} modifications`);

      return {
        modifications: validModifications,
        explanation: result.explanation || `Modified based on your instruction.`,
      };
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.log('Attempted to parse:', jsonMatch[0].substring(0, 500));
      return generateDefaultModifications(instruction, currentTitle, language);
    }
  } catch (error) {
    console.error('Error generating modifications:', error);
    
    return generateDefaultModifications(instruction, currentTitle, language);
  }
}


function generateDefaultModifications(
  instruction: string,
  currentTitle: string,
  language: string
): AIModifyResponse {
  const modifications: PageModification[] = [];
  const lowerInstruction = instruction.toLowerCase();

  console.log('Generating default modifications for instruction:', instruction);

  const titlePatterns = [
    /title.*?["'"](.*?)["'"]/i,
    /标题.*?["'"](.*?)["'"]/i,
    /タイトル.*?["'"](.*?)["'"]/i,
    /title\s*改成\s*([^,，。内]+)/i,
    /标题\s*改成\s*([^,，。内]+)/i,
    /将\s*title\s*改成\s*([^,，。内]+)/i,
    /将\s*标题\s*改成\s*([^,，。内]+)/i,
  ];

  for (const pattern of titlePatterns) {
    const match = instruction.match(pattern);
    if (match && match[1]) {
      modifications.push({
        type: 'update_title',
        title: match[1],
      });
      console.log('Detected title change:', match[1]);
      break;
    }
  }

  const contentPatterns = [
    /content.*?["'"](.*?)["'"]/i,
    /内容.*?["'"](.*?)["'"]/i,
    /コンテンツ.*?["'"](.*?)["'"]/i,
    /内容\s*改成\s*([^。]+?)(?:等|。|$)/i,
    /将\s*内容\s*改成\s*([^。]+?)(?:等|。|$)/i,
  ];

  for (const pattern of contentPatterns) {
    const match = instruction.match(pattern);
    if (match && match[1]) {
      modifications.push({
        type: 'replace',
        content: match[1],
      });
      console.log('Detected content change:', match[1]);
      break;
    }
  }

  
  if (modifications.length === 0) {
    if (lowerInstruction.includes('add') || lowerInstruction.includes('添加') ||
      lowerInstruction.includes('追加') || lowerInstruction.includes('append')) {
      modifications.push({
        type: 'append',
        content: language === 'Chinese'
          ? '这是根据您的指令添加的新内容。请根据需要进一步编辑。'
          : 'This is new content added based on your instruction. Please edit as needed.',
      });
    } else {
      
      modifications.push({
        type: 'append',
        content: language === 'Chinese'
          ? `根据您的指令"${instruction}"，我已为您添加了这段内容。`
          : `Based on your instruction "${instruction}", I've added this content for you.`,
      });
    }
  }

  console.log('Generated modifications:', modifications);

  return {
    modifications,
    explanation: language === 'Chinese'
      ? `已根据您的指令进行修改。由于 AI 服务暂时不可用，使用了基本的文本匹配来理解您的需求。`
      : `Modifications applied based on your instruction. Basic text matching was used as AI service is temporarily unavailable.`,
  };
}

export async function POST(request: NextRequest) {
  console.log('=== AI Modify API Called ===');

  try {
    
    const session = await auth();
    console.log('Session:', session ? 'exists' : 'null');

    if (!session?.user?.id) {
      console.log('No session, returning 401');
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Please log in to use this feature.' },
        { status: 401 }
      );
    }

    
    console.log('Parsing request body...');
    const body: AIModifyRequest = await request.json();
    const { postId, currentContent, currentTitle, instruction } = body;
    console.log('Request parsed:', { postId, currentTitle, instruction });

    
    if (!postId || !instruction) {
      return NextResponse.json(
        { error: 'Invalid request', details: 'Missing required fields: postId or instruction' },
        { status: 400 }
      );
    }

    if (instruction.trim().length < 5) {
      return NextResponse.json(
        { error: 'Instruction too short', details: 'Please provide a more detailed instruction (at least 5 characters).' },
        { status: 400 }
      );
    }

    
    const language = detectLanguage(instruction);
    console.log('Detected language:', language);

    
    console.log('Generating modifications...');

    const lowerInstruction = instruction.toLowerCase();

    
    const needsAIGeneration =
      lowerInstruction.includes('详细') ||
      lowerInstruction.includes('更多') ||
      lowerInstruction.includes('添加') ||
      lowerInstruction.includes('扩展') ||
      lowerInstruction.includes('丰富') ||
      lowerInstruction.includes('add more') ||
      lowerInstruction.includes('detailed') ||
      lowerInstruction.includes('expand');

    let result;

    if (needsAIGeneration) {
      console.log('🤖 Detected request for AI-generated content, using AI...');
      try {
        result = await generateModifications({
          currentContent: currentContent || [],
          currentTitle: currentTitle || 'Untitled',
          instruction: instruction.trim(),
          language,
        });
        console.log('✅ AI generation successful');
      } catch (error) {
        console.error('❌ AI generation failed, falling back to default:', error);
        result = generateDefaultModifications(
          instruction.trim(),
          currentTitle || 'Untitled',
          language
        );
      }
    } else {
      console.log('📝 Using default text matching...');
      result = generateDefaultModifications(
        instruction.trim(),
        currentTitle || 'Untitled',
        language
      );
    }

    console.log('Generated modifications:', result);
    
    console.log('Returning result:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('=== AI Modify API Error ===');
    console.error('Error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');

    return NextResponse.json(
      {
        error: 'Failed to generate modifications',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
