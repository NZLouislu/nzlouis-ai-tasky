import { PartialBlock } from "@blocknote/core";

export interface OutlineNode {
  id: string;
  level: number;
  title: string;
  children: OutlineNode[];
  blockIndex: number;
}

export interface Section {
  id: string;
  heading: OutlineNode | null;
  content: PartialBlock[];
  wordCount: number;
  startIndex: number;
  endIndex: number;
}

export interface DocumentStats {
  totalWords: number;
  totalParagraphs: number;
  totalHeadings: number;
  readingTimeMinutes: number;
  averageSentenceLength: number;
}

export interface DocumentStructure {
  outline: OutlineNode[];
  sections: Section[];
  stats: DocumentStats;
}

export class DocumentAnalyzer {
  analyze(blocks: PartialBlock[]): DocumentStructure {
    const outline = this.generateOutline(blocks);
    const sections = this.parseSections(blocks, outline);
    const stats = this.calculateStats(blocks);

    return { outline, sections, stats };
  }

  private generateOutline(blocks: PartialBlock[]): OutlineNode[] {
    const outline: OutlineNode[] = [];
    const stack: { node: OutlineNode; level: number }[] = [];

    blocks.forEach((block, index) => {
      if (block.type === "heading") {
        const level = (block.props?.level as number) || 1;
        const title = this.extractText(block);

        const node: OutlineNode = {
          id: `heading-${index}`,
          level,
          title,
          children: [],
          blockIndex: index,
        };

        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length === 0) {
          outline.push(node);
        } else {
          stack[stack.length - 1].node.children.push(node);
        }

        stack.push({ node, level });
      }
    });

    return outline;
  }

  private parseSections(
    blocks: PartialBlock[],
    outline: OutlineNode[]
  ): Section[] {
    const sections: Section[] = [];
    const flattenedHeadings = this.flattenOutline(outline);

    if (flattenedHeadings.length === 0) {
      sections.push({
        id: "section-0",
        heading: null,
        content: blocks,
        wordCount: this.countWords(blocks),
        startIndex: 0,
        endIndex: blocks.length,
      });
      return sections;
    }

    flattenedHeadings.forEach((headingNode, idx) => {
      const startIndex = headingNode.blockIndex;
      const nextHeading = flattenedHeadings[idx + 1];
      const endIndex = nextHeading ? nextHeading.blockIndex : blocks.length;

      const content = blocks.slice(startIndex + 1, endIndex);

      sections.push({
        id: headingNode.id,
        heading: headingNode,
        content,
        wordCount: this.countWords(content),
        startIndex,
        endIndex,
      });
    });

    return sections;
  }

  private flattenOutline(outline: OutlineNode[]): OutlineNode[] {
    const result: OutlineNode[] = [];

    const traverse = (nodes: OutlineNode[]) => {
      nodes.forEach((node) => {
        result.push(node);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      });
    };

    traverse(outline);
    return result.sort((a, b) => a.blockIndex - b.blockIndex);
  }

  private calculateStats(blocks: PartialBlock[]): DocumentStats {
    const text = this.blocksToText(blocks);
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

    const paragraphs = blocks.filter((b) => b.type === "paragraph").length;
    const headings = blocks.filter((b) => b.type === "heading").length;

    return {
      totalWords: words.length,
      totalParagraphs: paragraphs,
      totalHeadings: headings,
      readingTimeMinutes: Math.ceil(words.length / 200),
      averageSentenceLength:
        sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
    };
  }

  private extractText(block: PartialBlock): string {
    if (typeof block.content === "string") return block.content;
    if (Array.isArray(block.content)) {
      return block.content
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && "text" in item) return item.text;
          return "";
        })
        .join("");
    }
    return "";
  }

  private blocksToText(blocks: PartialBlock[]): string {
    return blocks.map((b) => this.extractText(b)).join(" ");
  }

  private countWords(blocks: PartialBlock[]): number {
    const text = this.blocksToText(blocks);
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }
}
