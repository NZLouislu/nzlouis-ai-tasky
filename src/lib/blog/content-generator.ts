/**
 * Content Generator - Stage 4 of the Agentic Blog Editor Pipeline
 * Responsible for generating high-quality content based on planning and search results
 */

import { PartialBlock } from '@blocknote/core';
import { PlanningResult, SearchContext, GenerationResult, PageModification } from './agentic-types';
import { WritingStyle } from './cache/redis-cache';

/**
 * Generates content modifications based on planning and search context
 */
export class ContentGenerator {
  /**
   * Generates content modifications with writing style awareness
   */
  async generate(
    planning: PlanningResult,
    searchContext: SearchContext | null,
    currentContent: PartialBlock[],
    userMessage: string,
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>,
    writingStyle?: WritingStyle | null
  ): Promise<GenerationResult> {
    const systemPrompt = this.buildGenerationSystemPrompt(writingStyle);
    const userPrompt = this.buildGenerationUserPrompt(
      planning,
      searchContext,
      currentContent,
      userMessage,
      writingStyle
    );

    try {
      const response = await callLLM(systemPrompt, userPrompt);
      const generationData = this.parseGenerationResponse(response);
      
      return generationData;
    } catch (error) {
      console.error('Content generation failed:', error);
      throw error;
    }
  }

  /**
   * Builds the system prompt for content generation with writing style awareness
   */
  private buildGenerationSystemPrompt(writingStyle?: WritingStyle | null): string {
    let styleGuidance = '';
    
    if (writingStyle) {
      styleGuidance = `\n**User Writing Style Profile:**\n\n`;
      styleGuidance += `- Average Sentence Length: ${writingStyle.averageSentenceLength} characters\n`;
      styleGuidance += `- Formality Level: ${writingStyle.formalityLevel}/10 (${writingStyle.formalityLevel > 7 ? 'Formal' : writingStyle.formalityLevel > 4 ? 'Neutral' : 'Casual'})\n`;
      styleGuidance += `- Preferred Structure: ${writingStyle.preferredStructure}\n`;
      
      if (writingStyle.commonPhrases && writingStyle.commonPhrases.length > 0) {
        styleGuidance += `- Common Phrases: ${writingStyle.commonPhrases.slice(0, 3).join(', ')}\n`;
      }
      
      if (writingStyle.useOfExamples) {
        styleGuidance += `- Frequently uses examples and illustrations\n`;
      }
      
      styleGuidance += `\n**Important:** Match the user's writing style closely. Use similar sentence lengths, formality level, and phrasing patterns.\n\n`;
    }
    
    return `You are a professional blog content creation assistant.

**Task:** Generate high-quality blog content based on user requirements.
${styleGuidance}
**Generation Requirements:**

1. **Accuracy**: All facts must be supported by sources, cite data sources when referencing
2. **Fluency**: Natural language, appropriate blog style, avoid stiff translation tone
3. **Structure**: Clear logic, appropriate paragraphing (use \\n\\n to separate)
4. **Detail**: Target word count as specified
5. **Timeliness**: Prioritize using latest 2024-2025 information
6. **Readability**: Suitable for general readers, explain technical terms

**📌 BlockNote Heading Hierarchy Rules (Important!):**

This system uses BlockNote editor, must strictly follow these heading levels:

- **H1 (level 1)**: Only for article main title, one per article
- **H2 (level 2)**: For main section titles (e.g., "Mars Exploration History", "Future Outlook")
- **H3 (level 3)**: For subsection titles within sections (e.g., "Early Exploration Phase", "Modern Rover Era")
- **Paragraph (paragraph)**: Regular body content

**Incorrect Example:**
\`\`\`markdown
## About the Origin of the Universe ❌ (Markdown syntax, BlockNote doesn't support)
\`\`\`

**Correct Example (BlockNote JSON):**
\`\`\`json
{
  "type": "heading",
  "props": { "level": 2 },
  "content": [{ "type": "text", "text": "Mars Exploration History" }]
}
\`\`\`

**Content Hierarchy Example:**
\`\`\`
H1: Mars: Humanity's Next Home (Article Title)
  H2: Mars Exploration History (Main Section)
    H3: Early Exploration Phase (1960-1990) (Subsection)
      Paragraph: In 1960, the Soviet Union launched the first Mars probe...
    H3: Modern Rover Era (2000-Present) (Subsection)
      Paragraph: In 2004, Opportunity and Spirit successfully landed...
  H2: Future Outlook (Main Section)
    H3: SpaceX's Mars Plan (Subsection)
      Paragraph: Elon Musk plans to establish a self-sustaining city on Mars by 2050...
\`\`\`

**Notes for Content Generation:**

- If adding a new section, use H2 (level 2)
- If adding a subtopic within an existing section, use H3 (level 3)
- Never use Markdown syntax (like ## or ###), must use BlockNote's heading block
- Ensure heading hierarchy is coherent, don't skip levels (e.g., directly from H2 to H4)

**Output Format (JSON):**

\`\`\`json
{
  "modifications": [
    {
      "type": "append",
      "content": "Generated detailed content...",
      "block_range": [12, 12],
      "metadata": {
        "word_count": 380,
        "sources_used": [1, 2, 3]
      }
    }
  ],
  "explanation": "Added 380 words to 'Mars Exploration History', covering 2024 Perseverance organic matter discovery, Ingenuity flight records, and China's Zhurong ice layer data.",
  "changes_summary": {
    "words_added": 380,
    "reading_time_increased": 1.9
  }
}
\`\`\``;
  }

  /**
   * Builds the user prompt with all context including writing style
   */
  private buildGenerationUserPrompt(
    planning: PlanningResult,
    searchContext: SearchContext | null,
    currentContent: PartialBlock[],
    userMessage: string,
    writingStyle?: WritingStyle | null
  ): string {
    // Extract target content
    let targetContent = 'N/A';
    if (planning.target_location.block_range) {
      const [start, end] = planning.target_location.block_range;
      const targetBlocks = currentContent.slice(start, end + 1);
      targetContent = this.blocksToText(targetBlocks);
    } else if (planning.target_location.section_title) {
      targetContent = `Section: ${planning.target_location.section_title}`;
    }

    let prompt = `**Task:** ${planning.action_plan.type}

**Target Paragraph Original Content:**
"""
${targetContent}
"""

**User Requirement:** "${userMessage}"

**Planning Suggestions:**
${planning.suggestions.join('\n')}
`;

    // Add search context if available
    if (searchContext) {
      prompt += `
**Reference Materials from Search:**
"""
${searchContext.summary}

Sources:
${searchContext.sources.map((s, i) => `[${i + 1}] ${s.title} - ${s.url}`).join('\n')}
"""
`;
    }

    prompt += `
**Generation Requirements:**

1. **Accuracy**: All facts must be supported by sources
2. **Fluency**: Natural language, appropriate blog style
3. **Structure**: Clear logic, appropriate paragraphing
4. **Detail**: Target word count ~${planning.action_plan.estimated_words} words
5. **Timeliness**: Prioritize using 2024-2025 latest information
6. **Readability**: Suitable for general readers
`;

    if (writingStyle) {
      prompt += `7. **Style Matching**: Match the user's writing style (avg sentence length: ${writingStyle.averageSentenceLength} chars, formality: ${writingStyle.formalityLevel}/10)\n`;
    }

    prompt += `\nPlease generate the content in JSON format as specified in the system prompt.`;

    return prompt;
  }

  /**
   * Parses the LLM response into GenerationResult
   */
  private parseGenerationResponse(response: string): GenerationResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);

      return {
        modifications: data.modifications || [],
        explanation: data.explanation || 'Content generated',
        changes_summary: data.changes_summary || {
          words_added: 0,
          reading_time_increased: 0,
        },
      };
    } catch (error) {
      console.error('Failed to parse generation response:', error);
      throw error;
    }
  }

  /**
   * Converts BlockNote blocks to plain text
   */
  private blocksToText(blocks: PartialBlock[]): string {
    return blocks
      .map(block => {
        if (block.type === 'heading') {
          const level = (block.props as { level?: number })?.level || 1;
          const text = this.extractTextFromContent(block.content);
          return '#'.repeat(level) + ' ' + text;
        } else if (block.type === 'paragraph') {
          return this.extractTextFromContent(block.content);
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n');
  }

  /**
   * Extracts text from BlockNote content
   */
  private extractTextFromContent(content: unknown): string {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item !== null && 'text' in item) {
            return String(item.text);
          }
          return '';
        })
        .join('');
    }
    return '';
  }
}
