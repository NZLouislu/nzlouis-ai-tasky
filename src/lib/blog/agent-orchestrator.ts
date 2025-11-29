import { PartialBlock } from '@blocknote/core';
import { PerceptionAgent } from './perception-agent';
import { PlanningAgent } from './planning-agent';
import { ContentGenerator } from './content-generator';
import {
  AgentRequest,
  AgentResponse,
  PerceptionResult,
  PlanningResult,
  SearchContext,
  GenerationResult,
  QualityMetrics,
  Suggestion,
} from './agentic-types';
import { searchTavily } from '@/lib/search/tavily';
import { blogAICache } from './cache/redis-cache';
import { contextBuilder } from './context-builder';
import { checkSEO } from './tools/seo-tool';
import { analyzeReadability } from './tools/readability-tool';

export class AgentOrchestrator {
  private perceptionAgent: PerceptionAgent;
  private planningAgent: PlanningAgent;
  private contentGenerator: ContentGenerator;

  constructor() {
    this.perceptionAgent = new PerceptionAgent();
    this.planningAgent = new PlanningAgent();
    this.contentGenerator = new ContentGenerator();
  }

  async execute(
    request: AgentRequest,
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>
  ): Promise<AgentResponse> {
    const conversationId = request.conversation_id || this.generateConversationId();
    const messageId = this.generateMessageId();
    const startTime = Date.now();

    try {
      console.log('[Parallel Phase 1] Cache + Perception...');
      
      const [cachedDocStructure, cachedWritingStyle, perception] = await Promise.all([
        blogAICache.getDocumentStructure(request.post_id, request.current_content),
        blogAICache.getWritingStyle(request.user_id),
        this.perceptionAgent.perceive(request.message, request.current_content),
      ]);

      console.log(`✅ Phase 1 completed in ${Date.now() - startTime}ms`);

      let documentStructure = cachedDocStructure || perception.documentStructure;
      let writingStyle = cachedWritingStyle;

      if (!cachedDocStructure && documentStructure) {
        blogAICache.setDocumentStructure(
          request.post_id,
          request.current_content,
          documentStructure
        );
      }

      if (!writingStyle) {
        writingStyle = await contextBuilder.analyzeUserWritingStyle(request.user_id);
        blogAICache.setWritingStyle(request.user_id, writingStyle);
      }

      console.log('[Stage 2] Planning - Generating execution plan...');
      const planning = await this.planningAgent.plan(
        perception,
        request.message,
        callLLM
      );

      if (planning.clarification_needed) {
        return this.createClarificationResponse(
          conversationId,
          messageId,
          planning,
          perception
        );
      }

      let searchContext: SearchContext | null = null;
      if (planning.needs_search && planning.search_queries.length > 0) {
        console.log('[Stage 3] Retrieval - Searching for information...');
        searchContext = await this.performSearch(planning.search_queries, callLLM);
      }

      console.log('[Stage 4] Generation - Generating content with style context...');
      const generation = await this.contentGenerator.generate(
        planning,
        searchContext,
        request.current_content,
        request.message,
        callLLM,
        writingStyle
      );

      console.log('[Parallel Phase 5] Validation + Tool Checks...');
      
      const generatedText = JSON.stringify(generation.modifications);
      
      const [quality, seoAnalysis, readabilityAnalysis] = await Promise.all([
        this.validateQuality(generation, planning, callLLM),
        checkSEO(generatedText, request.current_title),
        analyzeReadability(generatedText),
      ]);

      console.log(`✅ Total execution time: ${Date.now() - startTime}ms`);

      const suggestions = this.generateSuggestions(perception, planning);

      const modificationPreview = {
        modifications: generation.modifications,
        explanation: generation.explanation,
        quality_score: quality.overall_score / 10,
        preview_blocks: this.applyModificationsPreview(
          request.current_content,
          generation.modifications
        ),
        diff: this.calculateDiff(request.current_content, generation.modifications),
        toolInsights: {
          seo: seoAnalysis,
          readability: readabilityAnalysis,
          overallScore: Math.round((seoAnalysis.overallScore + readabilityAnalysis.overallScore) / 2),
        },
      };

      return {
        conversation_id: conversationId,
        message_id: messageId,
        reply: {
          type: 'modification_preview',
          content: generation.explanation,
          metadata: {
            thought_process: planning.thought_process,
            search_performed: planning.needs_search,
            cache_hit: {
              documentStructure: !!cachedDocStructure,
              writingStyle: !!cachedWritingStyle,
            },
            performance: {
              totalTime: Date.now() - startTime,
            },
          },
        },
        modification_preview: modificationPreview,
        suggestions,
        _debug: {
          perception,
          planning,
          search: searchContext || undefined,
          quality,
          writingStyle,
        },
      };
    } catch (error) {
      console.error('Agent orchestrator error:', error);
      return this.createErrorResponse(conversationId, messageId, error);
    }
  }

  private async performSearch(
    queries: string[],
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>
  ): Promise<SearchContext> {
    try {
      const searchPromises = queries.slice(0, 3).map(query =>
        searchTavily(query, { max_results: 3 })
      );

      const allResults = await Promise.all(searchPromises);
      const flatResults = allResults.flat();

      const uniqueResults = Array.from(
        new Map(flatResults.map(r => [r.url, r])).values()
      ).slice(0, 5);

      const summary = await this.summarizeSearchResults(uniqueResults, callLLM);

      return {
        raw_results: uniqueResults,
        summary,
        sources: uniqueResults.map(r => ({ title: r.title, url: r.url })),
      };
    } catch (error) {
      console.error('Search failed:', error);
      return {
        raw_results: [],
        summary: 'Search unavailable. Proceeding with existing knowledge.',
        sources: [],
      };
    }
  }

  private async summarizeSearchResults(
    results: { title: string; content: string; url: string }[],
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>
  ): Promise<string> {
    if (results.length === 0) {
      return 'No search results available.';
    }

    const systemPrompt = 'You are a research assistant. Summarize the following search results into a concise, informative summary.';
    const userPrompt = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.content.slice(0, 500)}...\nSource: ${r.url}`)
      .join('\n\n');

    try {
      const summary = await callLLM(systemPrompt, userPrompt);
      
      if (!summary || summary.trim().length < 50) {
        console.warn('[Search] LLM summary too short, using raw content fallback');
        return this.createFallbackSummary(results);
      }
      
      return summary;
    } catch (error) {
      console.error('Failed to summarize search results:', error);
      return this.createFallbackSummary(results);
    }
  }

  private createFallbackSummary(results: { title: string; content: string; url: string }[]): string {
    const summaryParts = results.slice(0, 3).map(r => {
      const cleanContent = r.content
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 400);
      return cleanContent;
    }).filter(c => c.length > 50);

    if (summaryParts.length === 0) {
      return 'Search completed but no detailed content available.';
    }

    return summaryParts.join('\n\n');
  }

  private async validateQuality(
    generation: GenerationResult,
    planning: PlanningResult,
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>
  ): Promise<QualityMetrics> {
    const wordCount = generation.changes_summary.words_added;
    const targetWords = planning.action_plan.estimated_words;

    const completeness = Math.min(10, (wordCount / targetWords) * 10);
    const overall = completeness * 0.8;

    return {
      factual_accuracy: 8,
      relevance: 8,
      readability: 8,
      coherence: 8,
      completeness,
      overall_score: overall,
      issues: overall < 7 ? ['Content may be too brief'] : [],
      suggestions_for_improvement: overall < 7 ? ['Consider adding more details'] : [],
    };
  }

  private generateSuggestions(
    perception: PerceptionResult,
    planning: PlanningResult
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    if (planning.suggestions.length > 0) {
      suggestions.push({
        type: 'content',
        priority: 'medium',
        title: 'Content Enhancement',
        description: planning.suggestions[0],
        action: planning.suggestions[0],
      });
    }

    return suggestions;
  }

  private applyModificationsPreview(
    currentContent: PartialBlock[],
    modifications: import('./agentic-types').PageModification[]
  ): PartialBlock[] {
    return [...currentContent];
  }

  private calculateDiff(
    currentContent: PartialBlock[],
    modifications: import('./agentic-types').PageModification[]
  ): import('./agentic-types').DiffResult {
    const wordsAdded = modifications.reduce((sum, mod) => {
      if (mod.content) {
        return sum + mod.content.split(/\s+/).length;
      }
      return sum;
    }, 0);

    return {
      changes: modifications.map((mod, idx) => ({
        type: 'add',
        block_index: idx,
        new_content: mod.content || '',
      })),
      stats: {
        blocks_added: modifications.length,
        blocks_modified: 0,
        blocks_deleted: 0,
        words_added: wordsAdded,
        words_deleted: 0,
      },
    };
  }

  private createClarificationResponse(
    conversationId: string,
    messageId: string,
    planning: PlanningResult,
    perception: PerceptionResult
  ): AgentResponse {
    return {
      conversation_id: conversationId,
      message_id: messageId,
      reply: {
        type: 'clarification',
        content: planning.clarification_questions.join('\n'),
        metadata: {
          available_paragraphs: perception.documentStructure.sections
            .filter(s => s.heading?.level === 2)
            .map(s => s.heading?.title),
        },
      },
      _debug: {
        perception,
        planning,
      },
    };
  }

  private createErrorResponse(
    conversationId: string,
    messageId: string,
    error: unknown
  ): AgentResponse {
    return {
      conversation_id: conversationId,
      message_id: messageId,
      reply: {
        type: 'text',
        content: `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your request.`,
      },
    };
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
