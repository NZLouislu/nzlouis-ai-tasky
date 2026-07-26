import { PartialBlock } from '@blocknote/core';
import { blogAICache, WritingStyle } from './cache/redis-cache';

export interface EnhancedContext {
  documentStructure: any;
  writingStyle: WritingStyle | null;
  relatedParagraphs: any[];
  searchResults: any;
}

export class ContextBuilder {
  async analyzeUserWritingStyle(userId: string): Promise<WritingStyle> {
    try {
      const recentPosts = await db
        .select({ content: blogPosts.content })
        .from(blogPosts)
        .where(eq(blogPosts.userId, userId))
        .orderBy(desc(blogPosts.updatedAt))
        .limit(10);

      if (!recentPosts || recentPosts.length === 0) {
        console.log('No posts found for user, using default style');
        return this.getDefaultStyle();
      }

      const allText = recentPosts
        .map((post) => this.extractTextFromBlocks(post.content as any[]))
        .join(' ');

      if (!allText) {
        return this.getDefaultStyle();
      }

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

  async buildContext(params: {
    userMessage: string;
    currentArticle: { blocks: PartialBlock[]; title: string };
    userId: string;
    postId: string;
  }): Promise<EnhancedContext> {
    const { userId } = params;

    let writingStyle = await blogAICache.getWritingStyle(userId);

    if (!writingStyle) {
      writingStyle = await this.analyzeUserWritingStyle(userId);
      await blogAICache.setWritingStyle(userId, writingStyle);
    }

    return {
      documentStructure: null,
      writingStyle,
      relatedParagraphs: [],
      searchResults: null,
    };
  }

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

  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[。！？.!?]+/)
      .filter((s) => s.trim().length > 0)
      .map((s) => s.trim());
  }

  private calculateAvgSentenceLength(sentences: string[]): number {
    if (sentences.length === 0) return 20;

    const totalLength = sentences.reduce((sum, s) => sum + s.length, 0);
    return Math.round(totalLength / sentences.length);
  }

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

    const totalIndicators = formalCount + informalCount;
    if (totalIndicators === 0) return 5;

    const formalityRatio = formalCount / totalIndicators;
    return Math.round(formalityRatio * 10);
  }

  private extractCommonPhrases(text: string): string[] {
    const words = text.match(/[\u4e00-\u9fa5]{2,3}/g) || [];
    const frequency: Record<string, number> = {};

    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([phrase]) => phrase);
  }

  private calculateTechnicalTermDensity(text: string): number {
    const technicalPattern = /[A-Za-z0-9]+/g;
    const matches = text.match(technicalPattern) || [];
    const totalChars = text.length;

    if (totalChars === 0) return 0;

    const technicalChars = matches.join('').length;
    return Math.round((technicalChars / totalChars) * 100);
  }

  private detectExampleUsage(text: string): boolean {
    const exampleIndicators = ['例如', '比如', '举例', '例子', '如：', '如下'];
    return exampleIndicators.some((indicator) => text.includes(indicator));
  }

  private detectStructurePattern(posts: any[]): string {
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

export const contextBuilder = new ContextBuilder();
