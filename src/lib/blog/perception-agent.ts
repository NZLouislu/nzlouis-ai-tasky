/**
 * Perception Agent - Stage 1 of the Agentic Blog Editor Pipeline
 * Responsible for understanding user intent and analyzing document structure
 */

import { PartialBlock } from '@blocknote/core';
import { DocumentAnalyzer, DocumentStructure } from './document-analyzer';
import { PerceptionResult, IntentType, ScopeType } from './agentic-types';

/**
 * Analyzes user message and document to understand intent and scope
 */
export class PerceptionAgent {
  private documentAnalyzer: DocumentAnalyzer;

  constructor() {
    this.documentAnalyzer = new DocumentAnalyzer();
  }

  /**
   * Main perception function - analyzes user message and document
   */
  async perceive(
    userMessage: string,
    currentContent: PartialBlock[]
  ): Promise<PerceptionResult> {
    // Analyze document structure
    const documentStructure = this.documentAnalyzer.analyze(currentContent);

    // Classify intent
    const intent = this.classifyIntent(userMessage);

    // Detect scope (single paragraph, multiple paragraphs, or full article)
    const scope = this.detectScope(userMessage, documentStructure);

    // Extract entities and keywords
    const extractedEntities = this.extractEntities(userMessage, documentStructure);

    // Analyze paragraph-level requirements
    const paragraphAnalysis = {
      scope: scope.type,
      targetParagraphTitles: scope.targetParagraphs,
      targetParagraphIndices: scope.targetIndices,
      needsSubheadings: this.shouldAddSubheadings(scope, documentStructure),
    };

    return {
      intent,
      confidence: scope.confidence,
      documentStructure,
      extractedEntities,
      paragraphAnalysis,
    };
  }

  /**
   * Classifies user intent based on keywords and patterns
   */
  private classifyIntent(userMessage: string): IntentType {
    const lowerMsg = userMessage.toLowerCase();

    // Modification keywords
    const modifyKeywords = ['修改', '改', 'modify', 'change', 'edit', '调整'];
    if (modifyKeywords.some(kw => lowerMsg.includes(kw))) {
      return 'modify_content';
    }

    // Addition keywords
    const addKeywords = ['添加', '加', '增加', '扩充', 'add', 'expand', 'append', '补充'];
    if (addKeywords.some(kw => lowerMsg.includes(kw))) {
      return 'add_content';
    }

    // Deletion keywords
    const deleteKeywords = ['删除', '删', '移除', 'delete', 'remove'];
    if (deleteKeywords.some(kw => lowerMsg.includes(kw))) {
      return 'delete_content';
    }

    // Quality improvement keywords
    const improveKeywords = ['优化', '提升', '改进', 'improve', 'enhance', 'better', '完善'];
    if (improveKeywords.some(kw => lowerMsg.includes(kw))) {
      return 'improve_quality';
    }

    // Fact-checking keywords
    const factcheckKeywords = ['核查', '检查', '验证', 'check', 'verify', 'factcheck'];
    if (factcheckKeywords.some(kw => lowerMsg.includes(kw))) {
      return 'factcheck';
    }

    // Question keywords
    const questionKeywords = ['建议', '怎么', '如何', 'suggest', 'how', 'what', '?', '?'];
    if (questionKeywords.some(kw => lowerMsg.includes(kw))) {
      return 'ask_question';
    }

    // Default to modification
    return 'modify_content';
  }

  /**
   * Detects the scope of the modification (single/multiple paragraphs or full article)
   */
  private detectScope(
    userMessage: string,
    documentStructure: DocumentStructure
  ): {
    type: ScopeType;
    targetParagraphs?: string[];
    targetIndices?: number[];
    confidence: number;
  } {
    const lowerMsg = userMessage.toLowerCase();

    // Rule 1: Full article keywords (highest priority)
    const fullArticleKeywords = [
      '整个文章', '整篇文章', '全文', '整体', '所有段落',
      'whole article', 'entire article', 'all paragraphs', 'full article'
    ];
    if (fullArticleKeywords.some(kw => lowerMsg.includes(kw))) {
      return {
        type: 'full_article',
        targetParagraphs: ['全部'],
        confidence: 1.0,
      };
    }

    // Rule 2: Number indicators (e.g., "两段", "三个段落")
    const numberMatch = lowerMsg.match(/(前|后)?\s*([一二三四五六七八九十\d]+)\s*(个)?\s*(段落|段|章节)/);
    if (numberMatch) {
      const count = this.parseChineseNumber(numberMatch[2]);
      const h2Sections = documentStructure.sections.filter(s => s.heading?.level === 2);
      
      return {
        type: 'multiple_paragraphs',
        targetIndices: Array.from({ length: Math.min(count, h2Sections.length) }, (_, i) => i),
        confidence: 0.9,
      };
    }

    // Rule 3: Conjunction words (e.g., "历史和未来")
    const conjunctions = ['和', '与', '以及', 'and', ',', '、'];
    if (conjunctions.some(conj => lowerMsg.includes(conj))) {
      const matches = this.matchMultipleParagraphs(lowerMsg, documentStructure);
      if (matches.length > 1) {
        return {
          type: 'multiple_paragraphs',
          targetParagraphs: matches,
          confidence: 0.85,
        };
      }
    }

    // Rule 4: Single paragraph keywords
    const singleParagraphKeywords = ['这一段', '这段', '该段落', 'this paragraph', 'this section'];
    if (singleParagraphKeywords.some(kw => lowerMsg.includes(kw))) {
      return {
        type: 'single_paragraph',
        confidence: 0.9,
      };
    }

    // Rule 5: Try to match paragraph titles
    const matchedParagraphs = this.matchParagraphs(lowerMsg, documentStructure);
    if (matchedParagraphs.length === 1) {
      return {
        type: 'single_paragraph',
        targetParagraphs: [matchedParagraphs[0]],
        confidence: 0.8,
      };
    } else if (matchedParagraphs.length > 1) {
      return {
        type: 'multiple_paragraphs',
        targetParagraphs: matchedParagraphs,
        confidence: 0.7,
      };
    }

    // Rule 6: Default - unknown scope
    return {
      type: 'unknown',
      confidence: 0.5,
    };
  }

  /**
   * Extracts entities and keywords from user message
   */
  private extractEntities(
    userMessage: string,
    documentStructure: DocumentStructure
  ): {
    targetSection?: string;
    keywords: string[];
    actionType?: 'expand' | 'rewrite' | 'correct';
  } {
    const lowerMsg = userMessage.toLowerCase();

    // Determine action type
    let actionType: 'expand' | 'rewrite' | 'correct' | undefined;
    if (lowerMsg.includes('扩充') || lowerMsg.includes('expand')) {
      actionType = 'expand';
    } else if (lowerMsg.includes('重写') || lowerMsg.includes('rewrite')) {
      actionType = 'rewrite';
    } else if (lowerMsg.includes('纠正') || lowerMsg.includes('correct')) {
      actionType = 'correct';
    }

    // Extract keywords (simple approach - can be enhanced with NLP)
    const keywords = userMessage
      .split(/[\s,。、]+/)
      .filter(word => word.length > 1)
      .slice(0, 5);

    // Try to find target section
    const targetSection = this.matchParagraphs(lowerMsg, documentStructure)[0];

    return {
      targetSection,
      keywords,
      actionType,
    };
  }

  /**
   * Matches paragraph titles from user message
   */
  private matchParagraphs(
    userMessage: string,
    documentStructure: DocumentStructure
  ): string[] {
    const h2Sections = documentStructure.sections.filter(s => s.heading?.level === 2);
    const matches: string[] = [];

    for (const section of h2Sections) {
      const title = section.heading?.title || '';
      const lowerTitle = title.toLowerCase();
      const lowerMsg = userMessage.toLowerCase();

      // Exact match
      if (lowerMsg.includes(lowerTitle)) {
        matches.push(title);
        continue;
      }

      // Reverse match - check if title is contained in message
      if (lowerTitle.includes(lowerMsg.trim()) && lowerMsg.trim().length > 2) {
        matches.push(title);
        continue;
      }

      // Word-level partial match
      const titleWords = lowerTitle.split(/\s+/).filter(w => w.length > 2);
      const msgWords = lowerMsg.split(/\s+/).filter(w => w.length > 2);
      
      if (titleWords.length === 0 || msgWords.length === 0) {
        continue;
      }

      // Count matching words
      const matchCount = titleWords.filter(word => 
        msgWords.some(msgWord => {
          // Check if words contain each other (for partial matches)
          return msgWord.includes(word) || word.includes(msgWord);
        })
      ).length;

      // Match if at least 50% of title words are found, or at least 2 words match
      const threshold = Math.max(1, Math.min(2, Math.ceil(titleWords.length * 0.5)));
      if (matchCount >= threshold) {
        matches.push(title);
      }
    }

    return matches;
  }

  /**
   * Matches multiple paragraphs from user message
   */
  private matchMultipleParagraphs(
    userMessage: string,
    documentStructure: DocumentStructure
  ): string[] {
    // Split by conjunctions
    const parts = userMessage.split(/[和与以及and,、]/);
    const matches: string[] = [];

    for (const part of parts) {
      const partMatches = this.matchParagraphs(part.trim(), documentStructure);
      matches.push(...partMatches);
    }

    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Determines if subheadings (H3) should be added
   */
  private shouldAddSubheadings(
    scope: { type: ScopeType; targetParagraphs?: string[] },
    documentStructure: DocumentStructure
  ): boolean {
    if (scope.type !== 'single_paragraph' || !scope.targetParagraphs) {
      return false;
    }

    // Find the target section
    const targetTitle = scope.targetParagraphs[0];
    const targetSection = documentStructure.sections.find(
      s => s.heading?.title === targetTitle && s.heading?.level === 2
    );

    if (!targetSection) {
      return false;
    }

    // Check if section is long enough to warrant subheadings
    const hasH3 = targetSection.content.some(
      block => block.type === 'heading' && (block.props as { level?: number })?.level === 3
    );

    // Suggest H3 if section is > 300 words and doesn't have H3 yet
    return !hasH3 && targetSection.wordCount > 300;
  }

  /**
   * Parses Chinese numbers to integers
   */
  private parseChineseNumber(chinese: string): number {
    const chineseMap: Record<string, number> = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
      '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    };

    // If it's already a digit, return it
    if (/^\d+$/.test(chinese)) {
      return parseInt(chinese, 10);
    }

    // Simple Chinese number parsing
    if (chineseMap[chinese]) {
      return chineseMap[chinese];
    }

    // Handle "十X" (e.g., "十一" = 11)
    if (chinese.startsWith('十')) {
      const remainder = chinese.slice(1);
      return 10 + (chineseMap[remainder] || 0);
    }

    return 1; // Default
  }
}
