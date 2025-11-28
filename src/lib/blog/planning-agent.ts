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
      const response = await callLLM(systemPrompt, userPrompt);
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

**Core Principle: Work with H2 paragraphs as the unit of modification!**

**Your Task:**
1. **Locate target paragraph**: Find the H2 paragraph the user wants to modify
2. **Analyze current state**: Current word count, whether it has H3 subheadings, content completeness
3. **Plan modification approach**:
   - If paragraph doesn't exist → Create new H2 paragraph
   - If content is sparse → Expand content, add H3 subheadings
   - If content is outdated → Search for latest information and update
   - If structure is messy → Reorganize into H3 + Paragraph structure
4. **Decide if search is needed**: If latest data or in-depth content is required, then search
5. **Clarify unclear instructions**: If user hasn't specified paragraph, ask

**Output JSON format:**
{
  "thought_process": "Detailed reasoning about what to do and why",
  "target_location": {
    "section_index": 1,
    "section_title": "Target H2 Title",
    "block_range": [3, 12]
  },
  "action_plan": {
    "type": "expand" | "rewrite" | "insert" | "delete" | "correct",
    "estimated_words": 400,
    "estimated_reading_time_increase": 2
  },
  "needs_search": true,
  "search_queries": ["query 1", "query 2"],
  "clarification_needed": false,
  "clarification_questions": [],
  "suggestions": ["suggestion 1", "suggestion 2"]
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
   * Parses the LLM response into PlanningResult
   */
  private parsePlanningResponse(response: string): PlanningResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);

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
    } else if (intent === 'add_content') {
      actionType = 'insert';
    } else if (userMessage.toLowerCase().includes('rewrite') || userMessage.includes('重写')) {
      actionType = 'rewrite';
    }

    // Determine if search is needed
    const needsSearch = userMessage.toLowerCase().includes('search') ||
      userMessage.includes('搜索') ||
      userMessage.includes('最新') ||
      userMessage.toLowerCase().includes('latest');

    return {
      thought_process: `Based on the user's request "${userMessage}", I will ${actionType} the content${targetSectionTitle ? ` in the "${targetSectionTitle}" section` : ''}.`,
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
      clarification_needed: targetSectionIndex === null && paragraphAnalysis.scope !== 'full_article',
      clarification_questions: targetSectionIndex === null ? [
        'Which paragraph would you like me to modify? Please specify the H2 section title.'
      ] : [],
      suggestions: [],
    };
  }
}
