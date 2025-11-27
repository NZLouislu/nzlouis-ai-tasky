import { PartialBlock } from '@blocknote/core';

export type ArticleTemplate = 'academic' | 'blog' | 'tutorial' | 'story';

export class RestructuringEngine {
  restructure(
    blocks: PartialBlock[],
    template: ArticleTemplate
  ): PartialBlock[] {
    switch (template) {
      case 'academic':
        return this.toAcademic(blocks);
      case 'blog':
        return this.toBlog(blocks);
      case 'tutorial':
        return this.toTutorial(blocks);
      case 'story':
        return this.toStory(blocks);
      default:
        return blocks;
    }
  }

  private toAcademic(blocks: PartialBlock[]): PartialBlock[] {
    const result: PartialBlock[] = [];

    result.push(this.createHeading('Abstract', 1));
    result.push(this.createParagraph('This article presents...'));

    result.push(this.createHeading('Introduction', 2));
    const intro = blocks.filter((b) => b.type === 'paragraph').slice(0, 2);
    result.push(...intro);

    result.push(this.createHeading('Methodology', 2));
    result.push(this.createParagraph('The approach used in this study...'));

    result.push(this.createHeading('Results', 2));
    const content = blocks.filter((b) => b.type === 'paragraph').slice(2);
    result.push(...content);

    result.push(this.createHeading('Conclusion', 2));
    result.push(this.createParagraph('In conclusion...'));

    return result;
  }

  private toBlog(blocks: PartialBlock[]): PartialBlock[] {
    const result: PartialBlock[] = [];

    result.push(this.createHeading('Introduction', 2));
    result.push(this.createParagraph('Hey there! Let me share...'));

    const paragraphs = blocks.filter((b) => b.type === 'paragraph');
    const sections = Math.ceil(paragraphs.length / 3);

    for (let i = 0; i < sections; i++) {
      result.push(this.createHeading(`Point ${i + 1}`, 2));
      result.push(...paragraphs.slice(i * 3, (i + 1) * 3));
    }

    result.push(this.createHeading('Wrapping Up', 2));
    result.push(this.createParagraph('Thanks for reading!'));

    return result;
  }

  private toTutorial(blocks: PartialBlock[]): PartialBlock[] {
    const result: PartialBlock[] = [];

    result.push(this.createHeading("What You'll Learn", 2));
    result.push(this.createParagraph('In this tutorial, you will learn...'));

    result.push(this.createHeading('Prerequisites', 2));
    result.push(this.createParagraph('Before starting, make sure you have...'));

    const paragraphs = blocks.filter((b) => b.type === 'paragraph');
    paragraphs.forEach((p, i) => {
      result.push(this.createHeading(`Step ${i + 1}`, 2));
      result.push(p);
    });

    result.push(this.createHeading('Next Steps', 2));
    result.push(
      this.createParagraph("Now that you've completed this tutorial...")
    );

    return result;
  }

  private toStory(blocks: PartialBlock[]): PartialBlock[] {
    const result: PartialBlock[] = [];

    result.push(this.createHeading('The Beginning', 2));
    const paragraphs = blocks.filter((b) => b.type === 'paragraph');
    result.push(...paragraphs.slice(0, Math.ceil(paragraphs.length / 3)));

    result.push(this.createHeading('The Journey', 2));
    result.push(
      ...paragraphs.slice(
        Math.ceil(paragraphs.length / 3),
        Math.ceil((paragraphs.length * 2) / 3)
      )
    );

    result.push(this.createHeading('The Resolution', 2));
    result.push(...paragraphs.slice(Math.ceil((paragraphs.length * 2) / 3)));

    return result;
  }

  private createHeading(text: string, level: number): PartialBlock {
    return {
      type: 'heading',
      content: text,
      props: { level: level as 1 | 2 | 3 | 4 | 5 | 6 },
    };
  }

  private createParagraph(text: string): PartialBlock {
    return {
      type: 'paragraph',
      content: text,
    };
  }
}
