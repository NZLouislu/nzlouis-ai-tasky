/**
 * Context Builder - Analyzes user writing style and builds enhanced context
 * Implements intelligent context awareness for better content generation
 */

import { PartialBlock } from '@blocknote/core';
import { blogAICache, WritingStyle } from './cache/redis-cache';
import { blogDb } from '@/lib/supabase/blog-client';

/**
 * Enhanced context for content generation
 */
export interface EnhancedContext {
  documentStructure: any;
  writingStyle: WritingStyle | null;
  relatedParagraphs: any[];
  searchResults: any;
}

/**
 * Context Builder for Blog AI
 */
export class ContextBuilder {
  /**
   * 分析用户写作风格
   * 从用户最近的文章中提取写作特征
   */
  async analyzeUserWritingStyle(userId: string): Promise<WritingStyle> {
    try {
      // 获取用户最近 10 篇文章
      const { data: recentPosts, error } = await blogDb
        .from('posts')
        .select('content')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error || !recentPosts || recentPosts.length === 0) {
        console.log('No posts found for user, using default style');
        return this.getDefaultStyle();
      }

      // 分析所有文章的文本内容
      const allText = recentPosts
        .map((post) => this.extractTextFromBlocks(post.content))
        .join(' ');

      if (!allText) {
        return this.getDefaultStyle();
      }

      // 计算写作风格特征
      const sentences = this.splitIntoSentences(allText);
      const avgSentenceLength = this.calculateAvgSentenceLength(sentences);
      const formalityLevel = this.detectFormality(allText);
      const commonPhrases = this.extractCommonPhrases(allText);
      const technicalTermDensity = this.calculateTechnicalTermDensity(allText);

      const style: WritingStyle = {
        averageSentenceLength: avgSentenceLength,
        formalityLevel,
        preferredStructure: this.detectStructurePattern(recentPosts),
        commonPhrases,
        technicalTermDensity,
        useOfExamples: this.detectExampleUsage(allText),
      };

      return style;
    } catch (error) {
      console.error('Error analyzing writing style:', error);
      return this.getDefaultStyle();
    }
  }

  /**
   * 构建完整上下文（带缓存）
   */
  async buildContext(params: {
    userMessage: string;
    currentArticle: { blocks: PartialBlock[]; title: string };
    userId: string;
    postId: string;
  }): Promise<EnhancedContext> {
    const { currentArticle, userId, postId } = params;

    // 尝试从缓存获取写作风格
    let writingStyle = await blogAICache.getWritingStyle(userId);

    // 如果缓存未命中，分析并缓存
    if (!writingStyle) {
      writingStyle = await this.analyzeUserWritingStyle(userId);
      await blogAICache.setWritingStyle(userId, writingStyle);
    }

    // 构建上下文（文档结构由 orchestrator 提供）
    return {
      documentStructure: null, // Will be filled by orchestrator
      writingStyle,
      relatedParagraphs: [], // TODO: Implement related content finding
      searchResults: null, // Will be filled by orchestrator if search is performed
    };
  }

  // ========== 私有辅助方法 ==========

  /**
   * 从 BlockNote 内容中提取纯文本
   */
  private extractTextFromBlocks(blocks: any[]): string {
    if (!blocks || !Array.isArray(blocks)) return '';

    return blocks
      .map((block) => {
        if (block.content) {
          if (Array.isArray(block.content)) {
            return block.content.map((c: any) => c.text || '').join('');
          }
          return block.content;
        }
        return '';
      })
      .join(' ');
  }

  /**
   * 将文本分割成句子
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[。！？.!?]+/)
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim());
  }

  /**
   * 计算平均句长
   */
  private calculateAvgSentenceLength(sentences: string[]): number {
    if (sentences.length === 0) return 20; // Default

    const totalLength = sentences.reduce((sum, s) => sum + s.length, 0);
    return Math.round(totalLength / sentences.length);
  }

  /**
   * 检测正式度 (1-10)
   * 基于正式用语的使用频率
   */
  private detectFormality(text: string): number {
    const formalIndicators = [
      '因此',
      '然而',
      '此外',
      '综上所述',
      '鉴于',
      '基于',
      '根据',
      '显示',
      '表明',
    ];
    const informalIndicators = ['哈哈', '嘿', '哇', '呀', '啊', '吧', '呢'];

    let formalCount = 0;
    let informalCount = 0;

    formalIndicators.forEach((word) => {
      const matches = text.match(new RegExp(word, 'g'));
      if (matches) formalCount += matches.length;
    });

    informalIndicators.forEach((word) => {
      const matches = text.match(new RegExp(word, 'g'));
      if (matches) informalCount += matches.length;
    });

    // 计算正式度分数 (1-10)
    const totalIndicators = formalCount + informalCount;
    if (totalIndicators === 0) return 5; // Neutral

    const formalityRatio = formalCount / totalIndicators;
    return Math.round(formalityRatio * 10);
  }

  /**
   * 提取常用短语
   */
  private extractCommonPhrases(text: string): string[] {
    // 简化实现：提取常见的2-3字词组
    const words = text.match(/[\u4e00-\u9fa5]{2,3}/g) || [];
    const frequency: Record<string, number> = {};

    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // 返回出现频率最高的前5个短语
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase]) => phrase);
  }

  /**
   * 计算技术术语密度
   */
  private calculateTechnicalTermDensity(text: string): number {
    // 简化实现：检测英文单词和数字的比例
    const technicalPattern = /[A-Za-z0-9]+/g;
    const matches = text.match(technicalPattern) || [];
    const totalChars = text.length;

    if (totalChars === 0) return 0;

    const technicalChars = matches.join('').length;
    return Math.round((technicalChars / totalChars) * 100);
  }

  /**
   * 检测是否常用例子
   */
  private detectExampleUsage(text: string): boolean {
    const exampleIndicators = ['例如', '比如', '举例', '例子', '如：', '如下'];
    return exampleIndicators.some((indicator) => text.includes(indicator));
  }

  /**
   * 检测结构模式偏好
   */
  private detectStructurePattern(posts: any[]): string {
    // 简化实现：检测是否倾向于使用列表、标题等
    const hasLists = posts.some((post) =>
      JSON.stringify(post.content).includes('"type":"bulletListItem"')
    );
    const hasHeadings = posts.some((post) =>
      JSON.stringify(post.content).includes('"type":"heading"')
    );

    if (hasLists && hasHeadings) return 'structured';
    if (hasLists) return 'list-heavy';
    if (hasHeadings) return 'heading-heavy';
    return 'paragraph-focused';
  }

  /**
   * 获取默认写作风格
   */
  private getDefaultStyle(): WritingStyle {
    return {
      averageSentenceLength: 25,
      formalityLevel: 5,
      preferredStructure: 'paragraph-focused',
      commonPhrases: [],
      technicalTermDensity: 10,
      useOfExamples: false,
    };
  }
}

// 导出单例
export const contextBuilder = new ContextBuilder();
