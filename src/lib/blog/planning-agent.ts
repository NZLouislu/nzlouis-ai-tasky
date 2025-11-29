/**
 * Planning Agent - Stage 2 of the Agentic Blog Editor Pipeline
 * Responsible for generating execution plans based on perception results
 */

import { PerceptionResult, PlanningResult } from './agentic-types';

/**
 * Generates execution plans for content modifications
 */
export class PlanningAgent {
  /**
   * Creates a detailed plan based on perception results
   */
  async plan(
    perception: PerceptionResult,
    userMessage: string,
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>
  ): Promise<PlanningResult> {
    const systemPrompt = this.buildPlanningSystemPrompt();
    const userPrompt = this.buildPlanningUserPrompt(perception, userMessage);

    try {
      console.log('🤖 Calling LLM for planning...');
      const response = await callLLM(systemPrompt, userPrompt);
      console.log('📥 LLM response received, length:', response?.length || 0);
      
      if (!response || response.trim().length === 0) {
        console.warn('⚠️ Empty response from LLM, falling back to rule-based planning');
        return this.generateFallbackPlan(perception, userMessage);
      }

      console.log('📝 LLM response preview (first 500 chars):', response.substring(0, 500));
      
      const planningData = this.parsePlanningResponse(response);
      return planningData;
    } catch (error) {
      console.error('Planning failed:', error);
      // Fallback to rule-based planning
      return this.generateFallbackPlan(perception, userMessage);
    }
  }

  /**
   * Builds the system prompt for planning
   */
  private buildPlanningSystemPrompt(): string {
    return `You are a professional blog editing planning assistant.

**CRITICAL INSTRUCTIONS:**
1. You MUST respond with ONLY a valid JSON object.
2. Do not include any text before or after the JSON.
3. The JSON must follow the structure below exactly.

**Your Task:**
1. Analyze the user's request and the current document structure.
2. Decide on the best course of action (add, modify, delete, etc.).
3. Determine if web search is needed for accurate content.

**REQUIRED JSON Format:**
{
  "thought_process": "Brief reasoning",
  "target_location": {
    "section_index": 1,
    "section_title": "Target H2 Title or New Title",
    "block_range": [0, 0]
  },
  "action_plan": {
    "type": "expand",
    "estimated_words": 400,
    "estimated_reading_time_increase": 2
  },
  "needs_search": true,
  "search_queries": ["query 1", "query 2"],
  "clarification_needed": false,
  "clarification_questions": [],
  "suggestions": []
}`;
  }

  /**
   * Builds the user prompt with context
   */
  private buildPlanningUserPrompt(
    perception: PerceptionResult,
    userMessage: string
  ): string {
    const { documentStructure, paragraphAnalysis, extractedEntities } = perception;

    // Build document structure summary
    const outlineSummary = documentStructure.outline
      .filter(node => node.level <= 2)
      .map(node => `${'  '.repeat(node.level - 1)}- ${node.title} (${node.level === 1 ? 'H1' : 'H2'})`)
      .join('\n');

    // Build sections summary
    const sectionsSummary = documentStructure.sections
      .filter(s => s.heading?.level === 2)
      .map((s, idx) => {
        const hasH3 = s.content.some(
          block => block.type === 'heading' && (block.props as { level?: number })?.level === 3
        );
        return `${idx + 1}. ${s.heading?.title} (${s.wordCount} words, ${hasH3 ? 'has' : 'no'} H3 subheadings)`;
      })
      .join('\n');

    return `**Document Structure:**

Outline:
${outlineSummary}

H2 Paragraphs:
${sectionsSummary}

**Document Stats:**
- Total words: ${documentStructure.stats.totalWords}
- Reading time: ${documentStructure.stats.readingTimeMinutes} minutes
- Number of H2 paragraphs: ${documentStructure.sections.filter(s => s.heading?.level === 2).length}

**User Instruction:** "${userMessage}"

**Detected Intent:** ${perception.intent}
**Detected Scope:** ${paragraphAnalysis.scope}
${paragraphAnalysis.targetParagraphTitles ? `**Target Paragraphs:** ${paragraphAnalysis.targetParagraphTitles.join(', ')}` : ''}
${extractedEntities.actionType ? `**Action Type:** ${extractedEntities.actionType}` : ''}

Please generate a detailed execution plan in JSON format.`;
  }

  /**
   * Helper to repair malformed JSON strings
   */
  private repairJsonString(jsonStr: string): string {
    let inString = false;
    let escaped = false;
    let result = '';

    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i];

      if (char === '"' && !escaped) {
        inString = !inString;
        result += char;
      } else if (inString && char === '\n') {
        // If we are inside a string and see a newline, escape it
        result += '\\n';
      } else if (inString && char === '\r') {
        // Skip carriage returns inside strings
      } else if (inString && char === '\t') {
        // Escape tabs
        result += '\\t';
      } else {
        // Normal character
        result += char;
      }

      // Update escaped state
      if (char === '\\' && !escaped) {
        escaped = true;
      } else {
        escaped = false;
      }
    }

    return result;
  }

  /**
   * Extracts JSON from LLM response that may contain explanatory text
   */
  private extractJSON(text: string): string | null {
    // Try to find JSON object in the response
    // First, try to match the outermost {}
    const stack: string[] = [];
    let start = -1;
    let inString = false;
    let escape = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\') {
        escape = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') {
        if (stack.length === 0) start = i;
        stack.push('{');
      } else if (char === '}') {
        stack.pop();
        if (stack.length === 0 && start !== -1) {
          // Found complete JSON object
          return text.substring(start, i + 1);
        }
      }
    }

    return null;
  }

  /**
   * Parses the LLM response into PlanningResult
   */
  private parsePlanningResponse(response: string): PlanningResult {
    try {
      console.log('🔍 Parsing planning response...');
      console.log('Raw response type:', typeof response);
      console.log('Raw response length:', response?.length || 0);
      
      // Check if response is valid
      if (!response || typeof response !== 'string' || response.trim().length === 0) {
        console.error('❌ Invalid or empty response from LLM');
        console.error('Response value:', response);
        throw new Error('Empty or invalid response from LLM');
      }
      
      // Clean up response (remove markdown code blocks)
      let cleanedResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      console.log('Cleaned response length:', cleanedResponse.length);
      console.log('Cleaned response preview:', cleanedResponse.substring(0, 300));

      // Try to extract JSON using improved extraction
      let jsonStr = this.extractJSON(cleanedResponse);
      
      if (!jsonStr) {
        // Fallback: try simple regex match
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      if (!jsonStr) {
        // If no JSON found, try to infer plan from text content
        console.warn('No JSON found in planning response, triggering fallback');
        console.warn('Full response:', response);
        throw new Error('No JSON found in response');
      }

      let data;
      try {
        data = JSON.parse(jsonStr);
      } catch (e) {
        console.warn('Standard JSON parse failed, attempting repair...', e);
        const repairedStr = this.repairJsonString(jsonStr);
        data = JSON.parse(repairedStr);
      }

      return {
        thought_process: data.thought_process || 'Planning generated',
        target_location: data.target_location || {
          section_index: null,
          section_title: undefined,
          paragraph_index: null,
          block_range: undefined,
        },
        action_plan: data.action_plan || {
          type: 'expand',
          estimated_words: 200,
          estimated_reading_time_increase: 1,
        },
        needs_search: data.needs_search || false,
        search_queries: data.search_queries || [],
        clarification_needed: data.clarification_needed || false,
        clarification_questions: data.clarification_questions || [],
        suggestions: data.suggestions || [],
      };
    } catch (error) {
      console.error('Failed to parse planning response:', error);
      throw error;
    }
  }

  /**
   * Generates a fallback plan using rule-based logic
   */
  private generateFallbackPlan(
    perception: PerceptionResult,
    userMessage: string
  ): PlanningResult {
    const { paragraphAnalysis, documentStructure, intent } = perception;

    // Find target section
    let targetSectionIndex: number | null = null;
    let targetSectionTitle: string | undefined;

    if (paragraphAnalysis.targetParagraphTitles && paragraphAnalysis.targetParagraphTitles.length > 0) {
      const targetTitle = paragraphAnalysis.targetParagraphTitles[0];
      const targetSection = documentStructure.sections.find(
        s => s.heading?.title === targetTitle && s.heading?.level === 2
      );
      if (targetSection) {
        targetSectionIndex = documentStructure.sections.indexOf(targetSection);
        targetSectionTitle = targetTitle;
      }
    }

    // Determine action type
    let actionType: 'expand' | 'rewrite' | 'insert' | 'delete' | 'correct' = 'expand';
    if (intent === 'delete_content') {
      actionType = 'delete';
    } else if (intent === 'add_content' || userMessage.includes('添加') || userMessage.includes('add')) {
      actionType = 'insert';
    } else if (userMessage.toLowerCase().includes('rewrite') || userMessage.includes('重写')) {
      actionType = 'rewrite';
    }

    // Determine if search is needed
    const needsSearch = userMessage.toLowerCase().includes('search') ||
      userMessage.includes('搜索') ||
      userMessage.includes('最新') ||
      userMessage.toLowerCase().includes('latest') ||
      actionType === 'insert'; // Always search for new content

    // If inserting, we don't need a target section index (will append or insert at appropriate place)
    const isInsert = actionType === 'insert';

    return {
      thought_process: `Based on the user's request "${userMessage}", I will ${actionType} content. Fallback plan activated.`,
      target_location: {
        section_index: targetSectionIndex,
        section_title: targetSectionTitle,
        paragraph_index: null,
      },
      action_plan: {
        type: actionType,
        estimated_words: 300,
        estimated_reading_time_increase: 1.5,
      },
      needs_search: needsSearch,
      search_queries: needsSearch ? [userMessage] : [],
      clarification_needed: !isInsert && targetSectionIndex === null && paragraphAnalysis.scope !== 'full_article',
      clarification_questions: (!isInsert && targetSectionIndex === null) ? [
        'Which paragraph would you like me to modify? Please specify the H2 section title.'
      ] : [],
      suggestions: [],
    };
  }
}
