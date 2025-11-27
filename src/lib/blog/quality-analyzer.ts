import { PartialBlock } from '@blocknote/core';

export interface QualityScore {
  overall: number;
  structure: number;
  content: number;
  readability: number;
  details: {
    structureIssues: string[];
    contentIssues: string[];
    readabilityIssues: string[];
  };
}

export class QualityAnalyzer {
  analyze(blocks: PartialBlock[], title: string): QualityScore {
    const structureScore = this.analyzeStructure(blocks);
    const contentScore = this.analyzeContent(blocks);
    const readabilityScore = this.analyzeReadability(blocks);

    const overall = Math.round(
      (structureScore.score + contentScore.score + readabilityScore.score) / 3
    );

    return {
      overall,
      structure: structureScore.score,
      content: contentScore.score,
      readability: readabilityScore.score,
      details: {
        structureIssues: structureScore.issues,
        contentIssues: contentScore.issues,
        readabilityIssues: readabilityScore.issues,
      },
    };
  }

  private analyzeStructure(blocks: PartialBlock[]): {
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    const headings = blocks.filter((b) => b.type === 'heading');
    if (headings.length === 0) {
      issues.push('No headings found - add section headings');
      score -= 20;
    }

    const paragraphs = blocks.filter((b) => b.type === 'paragraph');
    if (paragraphs.length < 3) {
      issues.push('Too few paragraphs - expand content');
      score -= 15;
    }

    if (blocks.length < 5) {
      issues.push('Article too short - add more content');
      score -= 25;
    }

    return { score: Math.max(0, score), issues };
  }

  private analyzeContent(blocks: PartialBlock[]): {
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    const text = this.extractText(blocks);
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length;

    if (wordCount < 300) {
      issues.push(`Word count too low (${wordCount}/300) - add more detail`);
      score -= 30;
    }

    const avgWordLength =
      words.reduce((sum, w) => sum + w.length, 0) / words.length;
    if (avgWordLength < 4) {
      issues.push('Words too simple - use more descriptive language');
      score -= 10;
    }

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length < 5) {
      issues.push('Too few sentences - expand your ideas');
      score -= 15;
    }

    return { score: Math.max(0, score), issues };
  }

  private analyzeReadability(blocks: PartialBlock[]): {
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 100;

    const text = this.extractText(blocks);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const words = text.split(/\s+/).filter((w) => w.length > 0);

    if (sentences.length === 0 || words.length === 0) {
      return { score: 0, issues: ['No content to analyze'] };
    }

    const avgSentenceLength = words.length / sentences.length;
    if (avgSentenceLength > 25) {
      issues.push('Sentences too long - break into shorter sentences');
      score -= 20;
    }

    const syllables = words.reduce(
      (sum, word) => sum + this.countSyllables(word),
      0
    );
    const fleschScore =
      206.835 - 1.015 * avgSentenceLength - 84.6 * (syllables / words.length);

    if (fleschScore < 60) {
      issues.push('Text difficult to read - simplify language');
      score -= 15;
    }

    return { score: Math.max(0, score), issues };
  }

  private extractText(blocks: PartialBlock[]): string {
    return blocks
      .map((block) => {
        if (typeof block.content === 'string') return block.content;
        if (Array.isArray(block.content)) {
          return block.content
            .map((item) => {
              if (typeof item === 'string') return item;
              if (typeof item === 'object' && 'text' in item) return item.text;
              return '';
            })
            .join('');
        }
        return '';
      })
      .join(' ');
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }
}
