import { DocumentAnalyzer } from "../document-analyzer";
import { PartialBlock } from "@blocknote/core";

describe("DocumentAnalyzer", () => {
  const analyzer = new DocumentAnalyzer();

  describe("generateOutline", () => {
    it("should parse document outline correctly", () => {
      const blocks: PartialBlock[] = [
        {
          type: "heading",
          content: [{ type: "text", text: "Chapter 1" }],
          props: { level: 1 },
        },
        { type: "paragraph", content: [{ type: "text", text: "Content 1" }] },
        {
          type: "heading",
          content: [{ type: "text", text: "Section 1.1" }],
          props: { level: 2 },
        },
        { type: "paragraph", content: [{ type: "text", text: "Content 1.1" }] },
      ];

      const result = analyzer.analyze(blocks);

      expect(result.outline).toHaveLength(1);
      expect(result.outline[0].title).toBe("Chapter 1");
      expect(result.outline[0].children).toHaveLength(1);
      expect(result.outline[0].children[0].title).toBe("Section 1.1");
    });

    it("should handle documents with no headings", () => {
      const blocks: PartialBlock[] = [
        { type: "paragraph", content: [{ type: "text", text: "Paragraph 1" }] },
        { type: "paragraph", content: [{ type: "text", text: "Paragraph 2" }] },
      ];

      const result = analyzer.analyze(blocks);

      expect(result.outline).toHaveLength(0);
      expect(result.sections).toHaveLength(1);
      expect(result.sections[0].heading).toBeNull();
    });

    it("should handle deeply nested headings", () => {
      const blocks: PartialBlock[] = [
        {
          type: "heading",
          content: [{ type: "text", text: "H1" }],
          props: { level: 1 },
        },
        {
          type: "heading",
          content: [{ type: "text", text: "H2" }],
          props: { level: 2 },
        },
        {
          type: "heading",
          content: [{ type: "text", text: "H3" }],
          props: { level: 3 },
        },
        {
          type: "heading",
          content: [{ type: "text", text: "H4" }],
          props: { level: 4 },
        },
        {
          type: "heading",
          content: [{ type: "text", text: "H5" }],
          props: { level: 5 },
        },
        {
          type: "heading",
          content: [{ type: "text", text: "H6" }],
          props: { level: 6 },
        },
      ];

      const result = analyzer.analyze(blocks);

      expect(result.outline).toHaveLength(1);
      expect(result.outline[0].title).toBe("H1");
      expect(result.outline[0].children[0].title).toBe("H2");
      expect(result.outline[0].children[0].children[0].title).toBe("H3");
    });
  });

  describe("calculateStats", () => {
    it("should calculate stats correctly", () => {
      const blocks: PartialBlock[] = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world this is a test" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Another paragraph here" }],
        },
      ];

      const result = analyzer.analyze(blocks);

      expect(result.stats.totalWords).toBe(9);
      expect(result.stats.totalParagraphs).toBe(2);
      expect(result.stats.totalHeadings).toBe(0);
    });

    it("should calculate reading time correctly", () => {
      const words = Array(400).fill("word").join(" ");
      const blocks: PartialBlock[] = [
        {
          type: "paragraph",
          content: [{ type: "text", text: words }],
        },
      ];

      const result = analyzer.analyze(blocks);

      expect(result.stats.readingTimeMinutes).toBe(2);
    });

    it("should handle empty content", () => {
      const blocks: PartialBlock[] = [];

      const result = analyzer.analyze(blocks);

      expect(result.stats.totalWords).toBe(0);
      expect(result.stats.totalParagraphs).toBe(0);
      expect(result.stats.readingTimeMinutes).toBe(0);
    });
  });

  describe("parseSections", () => {
    it("should group content by headings", () => {
      const blocks: PartialBlock[] = [
        {
          type: "heading",
          content: [{ type: "text", text: "Introduction" }],
          props: { level: 1 },
        },
        { type: "paragraph", content: [{ type: "text", text: "Intro text" }] },
        {
          type: "heading",
          content: [{ type: "text", text: "Body" }],
          props: { level: 1 },
        },
        { type: "paragraph", content: [{ type: "text", text: "Body text" }] },
      ];

      const result = analyzer.analyze(blocks);

      expect(result.sections).toHaveLength(2);
      expect(result.sections[0].heading?.title).toBe("Introduction");
      expect(result.sections[0].content).toHaveLength(1);
      expect(result.sections[1].heading?.title).toBe("Body");
      expect(result.sections[1].content).toHaveLength(1);
    });

    it("should calculate word count per section", () => {
      const blocks: PartialBlock[] = [
        {
          type: "heading",
          content: [{ type: "text", text: "Section 1" }],
          props: { level: 1 },
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "One two three four five" }],
        },
      ];

      const result = analyzer.analyze(blocks);

      expect(result.sections[0].wordCount).toBe(5);
    });
  });

  describe("edge cases", () => {
    it("should handle mixed content types", () => {
      const blocks: PartialBlock[] = [
        {
          type: "heading",
          content: [{ type: "text", text: "Title" }],
          props: { level: 1 },
        },
        { type: "paragraph", content: [{ type: "text", text: "Text" }] },
        { type: "bulletListItem", content: [{ type: "text", text: "Item" }] },
        { type: "numberedListItem", content: [{ type: "text", text: "Item" }] },
      ];

      const result = analyzer.analyze(blocks);

      expect(result.stats.totalWords).toBeGreaterThan(0);
      expect(result.outline).toHaveLength(1);
    });

    it("should handle string content format", () => {
      const blocks: PartialBlock[] = [
        { type: "paragraph", content: "Simple string content" },
      ];

      const result = analyzer.analyze(blocks);

      expect(result.stats.totalWords).toBe(3);
    });

    it("should handle large documents efficiently", () => {
      const blocks: PartialBlock[] = [];
      for (let i = 0; i < 1000; i++) {
        blocks.push({
          type: "paragraph",
          content: [{ type: "text", text: "Test paragraph content" }],
        });
      }

      const startTime = Date.now();
      const result = analyzer.analyze(blocks);
      const endTime = Date.now();

      expect(result.stats.totalParagraphs).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
