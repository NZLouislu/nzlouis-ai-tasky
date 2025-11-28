/**
 * Agent Orchestrator - Main controller for the 6-stage Agentic Blog Editor Pipeline
 * Coordinates all agents and manages the workflow
 * Enhanced with Redis caching, context awareness, and quality tools
 */

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

/**
 * Main orchestrator that coordinates all agents in the pipeline
 */
export class AgentOrchestrator {
  private perceptionAgent: PerceptionAgent;
  private planningAgent: PlanningAgent;
  private contentGenerator: ContentGenerator;

  constructor() {
    this.perceptionAgent = new PerceptionAgent();
    this.planningAgent = new PlanningAgent();
    this.contentGenerator = new ContentGenerator();
  }

  /**
   * Main execution method - runs the complete 6-stage pipeline with optimizations
   */
  async execute(
    request: AgentRequest,
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>
  ): Promise<AgentResponse> {
    const conversationId = request.conversation_id || this.generateConversationId();
    const messageId = this.generateMessageId();
    const startTime = Date.now();

    try {
      // ========== 并行阶段 1：缓存读取 + 感知分析 ==========
      console.log('[Parallel Phase 1] Cache + Perception...');
      
      const [cachedDocStructure, cachedWritingStyle, perception] = await Promise.all([
        blogAICache.getDocumentStructure(request.post_id, request.current_content),
        blogAICache.getWritingStyle(request.user_id),
        this.perceptionAgent.perceive(request.message, request.current_content),
      ]);

      console.log(`✅ Phase 1 completed in ${Date.now() - startTime}ms`);

      // ========== 阶段 2：如果缓存未命中，分析并缓存 ==========
      let documentStructure = cachedDocStructure || perception.documentStructure;
      let writingStyle = cachedWritingStyle;

      // 如果文档结构未缓存，保存到 Redis（异步，不等待）
      if (!cachedDocStructure && documentStructure) {
        blogAICache.setDocumentStructure(
          request.post_id,
          request.current_content,
          documentStructure
        );
      }

      // 如果写作风格未缓存，分析并保存
      if (!writingStyle) {
        writingStyle = await contextBuilder.analyzeUserWritingStyle(request.user_id);
        blogAICache.setWritingStyle(request.user_id, writingStyle);
      }

      // ========== 阶段 3：规划 ==========
      console.log('[Stage 2] Planning - Generating execution plan...');
      const planning = await this.planningAgent.plan(
        perception,
        request.message,
        callLLM
      );

      // Check if clarification is needed
      if (planning.clarification_needed) {
        return this.createClarificationResponse(
          conversationId,
          messageId,
          planning,
          perception
        );
      }

      // ========== 并行阶段 4：搜索（如果需要）==========
      let searchContext: SearchContext | null = null;
      if (planning.needs_search && planning.search_queries.length > 0) {
        console.log('[Stage 3] Retrieval - Searching for information...');
        searchContext = await this.performSearch(planning.search_queries, callLLM);
      }

      // ========== 阶段 5：生成内容（带写作风格上下文）==========
      console.log('[Stage 4] Generation - Generating content with style context...');
      const generation = await this.contentGenerator.generate(
        planning,
        searchContext,
        request.current_content,
        request.message,
        callLLM,
        writingStyle // 传递写作风格
      );

      // ========== 并行阶段 6：质量验证 + 工具检查 ==========
      console.log('[Parallel Phase 5] Validation + Tool Checks...');
      
      const generatedText = JSON.stringify(generation.modifications);
      
      const [quality, seoAnalysis, readabilityAnalysis] = await Promise.all([
        this.validateQuality(generation, planning, callLLM),
        checkSEO(generatedText, request.current_title),
        analyzeReadability(generatedText),
      ]);

      console.log(`✅ Total execution time: ${Date.now() - startTime}ms`);

      // ========== 阶段 7：生成建议 ==========
      const suggestions = this.generateSuggestions(perception, planning);

      // Build modification preview with tool insights
      const modificationPreview = {
        modifications: generation.modifications,
        explanation: generation.explanation,
        quality_score: quality.overall_score / 10, // Normalize to 0-1
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

  /**
   * Performs web search using Tavily API
   */
  private async performSearch(
    queries: string[],
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>
  ): Promise<SearchContext> {
    try {
      // Execute searches in parallel
      const searchPromises = queries.slice(0, 3).map(query =>
        searchTavily(query, { max_results: 3 })
      );

      const allResults = await Promise.all(searchPromises);
      const flatResults = allResults.flat();

      // Deduplicate by URL
      const uniqueResults = Array.from(
        new Map(flatResults.map(r => [r.url, r])).values()
      ).slice(0, 5);

      // Generate summary using LLM
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

  /**
   * Summarizes search results using LLM
   */
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
      return summary;
    } catch (error) {
      console.error('Failed to summarize search results:', error);
      return results.map(r => `- ${r.title}: ${r.content.slice(0, 200)}...`).join('\n');
    }
  }

  /**
   * Validates the quality of generated content
   */
  private async validateQuality(
    generation: GenerationResult,
    planning: PlanningResult,
    callLLM: (systemPrompt: string, userPrompt: string) => Promise<string>
  ): Promise<QualityMetrics> {
    // Simplified quality assessment - can be enhanced with LLM-based validation
    const wordCount = generation.changes_summary.words_added;
    const targetWords = planning.action_plan.estimated_words;

    // Calculate scores based on simple heuristics
    const completeness = Math.min(10, (wordCount / targetWords) * 10);
    const overall = completeness * 0.8; // Simplified scoring

    return {
      factual_accuracy: 8, // Would need fact-checking
      relevance: 8,
      readability: 8,
      coherence: 8,
      completeness,
      overall_score: overall,
      issues: overall < 7 ? ['Content may be too brief'] : [],
      suggestions_for_improvement: overall < 7 ? ['Consider adding more details'] : [],
    };
  }

  /**
   * Generates smart suggestions based on analysis
   */
  private generateSuggestions(
    perception: PerceptionResult,
    planning: PlanningResult
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Add suggestions from planning
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

  /**
   * Applies modifications to create a preview
   */
  private applyModificationsPreview(
    currentContent: PartialBlock[],
    modifications: import('./agentic-types').PageModification[]
  ): PartialBlock[] {
    // This is a simplified preview - actual implementation would be more sophisticated
    return [...currentContent];
  }

  /**
   * Calculates diff between current and modified content
   */
  private calculateDiff(
    currentContent: PartialBlock[],
    modifications: import('./agentic-types').PageModification[]
  ): import('./agentic-types').DiffResult {
    // Simplified diff calculation
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

  /**
   * Creates a clarification response
   */
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

  /**
   * Creates an error response
   */
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

  /**
   * Generates a unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generates a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
