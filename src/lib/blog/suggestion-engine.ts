import { PartialBlock } from '@blocknote/core';

export interface Suggestion {
  type:
    | 'long_paragraph'
    | 'weak_transition'
    | 'repetitive'
    | 'missing_example'
    | 'heading_gap';
  severity: 'high' | 'medium' | 'low';
  message: string;
  location: number;
  autoFix?: string;
}

export class SuggestionEngine {
  analyze(blocks: PartialBlock[]): Suggestion[] {
    const suggestions: Suggestion[] = [];

    suggestions.push(...this.detectLongParagraphs(blocks));
    suggestions.push(...this.detectWeakTransitions(blocks));
    suggestions.push(...this.detectRepetitiveWords(blocks));
    suggestions.push(...this.detectMissingExamples(blocks));
    suggestions.push(...this.detectHeadingGaps(blocks));

    return suggestions.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private detectLongParagraphs(blocks: PartialBlock[]): Suggestion[] {
    const suggestions: Suggestion[] = [];

    blocks.forEach((block, index) => {
      if (block.type === 'paragraph') {
        const text = this.extractText(block);
        const wordCount = text.split(/\s+/).length;

        if (wordCount > 200) {
          suggestions.push({
            type: 'long_paragraph',
            severity: 'high',
            message: `Paragraph ${index + 1} is too long (${wordCount} words). Consider breaking it into smaller paragraphs.`,
            location: index,
            autoFix: 'Split this paragraph into 2-3 shorter paragraphs',
          });
        }
      }
    });

    return suggestions;
  }

  private detectWeakTransitions(blocks: PartialBlock[]): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const transitionWords = [
      'however',
      'therefore',
      'moreover',
      'furthermore',
      'additionally',
      'consequently',
    ];

    for (let i = 1; i < blocks.length; i++) {
      if (blocks[i].type === 'paragraph') {
        const text = this.extractText(blocks[i]).toLowerCase();
        const hasTransition = transitionWords.some((word) =>
          text.startsWith(word)
        );

        if (!hasTransition && blocks[i - 1].type === 'paragraph') {
          suggestions.push({
            type: 'weak_transition',
            severity: 'medium',
            message: `Paragraph ${i + 1} lacks a transition word. Consider adding one for better flow.`,
            location: i,
            autoFix: 'Add transition word at the beginning',
          });
        }
      }
    }

    return suggestions;
  }

  private detectRepetitiveWords(blocks: PartialBlock[]): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const text = blocks
      .map((b) => this.extractText(b))
      .join(' ')
      .toLowerCase();
    const words = text.split(/\s+/).filter((w) => w.length > 4);

    const wordCount = new Map<string, number>();
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    const repetitive = Array.from(wordCount.entries())
      .filter(([word, count]) => count > 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    repetitive.forEach(([word, count]) => {
      suggestions.push({
        type: 'repetitive',
        severity: 'low',
        message: `The word "${word}" appears ${count} times. Consider using synonyms.`,
        location: 0,
      });
    });

    return suggestions;
  }

  private detectMissingExamples(blocks: PartialBlock[]): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const headings = blocks.filter((b) => b.type === 'heading');

    headings.forEach((heading, index) => {
      const headingIndex = blocks.indexOf(heading);
      const nextHeadingIndex = headings[index + 1]
        ? blocks.indexOf(headings[index + 1])
        : blocks.length;
      const sectionBlocks = blocks.slice(headingIndex + 1, nextHeadingIndex);

      const hasExample = sectionBlocks.some((block) => {
        const text = this.extractText(block).toLowerCase();
        return (
          text.includes('example') ||
          text.includes('for instance') ||
          text.includes('such as')
        );
      });

      if (!hasExample && sectionBlocks.length > 2) {
        suggestions.push({
          type: 'missing_example',
          severity: 'medium',
          message: `Section "${this.extractText(heading)}" lacks examples. Add concrete examples to illustrate your points.`,
          location: headingIndex,
          autoFix: 'Add an example to this section',
        });
      }
    });

    return suggestions;
  }

  private detectHeadingGaps(blocks: PartialBlock[]): Suggestion[] {
    const suggestions: Suggestion[] = [];
    let paragraphsSinceHeading = 0;

    blocks.forEach((block, index) => {
      if (block.type === 'heading') {
        paragraphsSinceHeading = 0;
      } else if (block.type === 'paragraph') {
        paragraphsSinceHeading++;

        if (paragraphsSinceHeading > 5) {
          suggestions.push({
            type: 'heading_gap',
            severity: 'medium',
            message: `Consider adding a subheading after paragraph ${index + 1} to break up the content.`,
            location: index,
            autoFix: 'Insert a subheading here',
          });
          paragraphsSinceHeading = 0;
        }
      }
    });

    return suggestions;
  }

  private extractText(block: PartialBlock): string {
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
  }
}
