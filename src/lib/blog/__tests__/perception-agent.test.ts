/**
 * Tests for Perception Agent
 */

import { describe, it, expect } from 'vitest';
import { PerceptionAgent } from '../perception-agent';
import { PartialBlock } from '@blocknote/core';

describe('PerceptionAgent', () => {
  const agent = new PerceptionAgent();

  const sampleContent: PartialBlock[] = [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: 'Mars Exploration', styles: {} }],
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Mars Exploration History', styles: {} }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Mars has been explored since the 1960s...', styles: {} }],
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Future Outlook', styles: {} }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Future missions to Mars...', styles: {} }],
    },
  ];

  describe('Intent Classification', () => {
    it('should classify modification intent', async () => {
      const result = await agent.perceive('修改火星探索历史', sampleContent);
      expect(result.intent).toBe('modify_content');
    });

    it('should classify addition intent', async () => {
      const result = await agent.perceive('添加关于SpaceX的内容', sampleContent);
      expect(result.intent).toBe('add_content');
    });

    it('should classify improvement intent', async () => {
      const result = await agent.perceive('优化整篇文章', sampleContent);
      expect(result.intent).toBe('improve_quality');
    });

    it('should classify deletion intent', async () => {
      const result = await agent.perceive('删除第二段', sampleContent);
      expect(result.intent).toBe('delete_content');
    });
  });

  describe('Scope Detection', () => {
    it('should detect single paragraph scope', async () => {
      const result = await agent.perceive('expand Mars Exploration History', sampleContent);
      expect(result.paragraphAnalysis.scope).toBe('single_paragraph');
      expect(result.paragraphAnalysis.targetParagraphTitles).toContain('Mars Exploration History');
    });

    it('should detect multiple paragraphs scope', async () => {
      const result = await agent.perceive('modify Mars Exploration History and Future Outlook', sampleContent);
      expect(result.paragraphAnalysis.scope).toBe('multiple_paragraphs');
    });

    it('should detect full article scope', async () => {
      const result = await agent.perceive('整体优化文章', sampleContent);
      expect(result.paragraphAnalysis.scope).toBe('full_article');
    });

    it('should detect full article scope with Chinese keywords', async () => {
      const result = await agent.perceive('分析整篇文章', sampleContent);
      expect(result.paragraphAnalysis.scope).toBe('full_article');
    });
  });

  describe('Entity Extraction', () => {
    it('should extract target section', async () => {
      const result = await agent.perceive('expand Mars Exploration History', sampleContent);
      expect(result.extractedEntities.targetSection).toBe('Mars Exploration History');
    });

    it('should extract action type', async () => {
      const result = await agent.perceive('扩充火星探索历史', sampleContent);
      expect(result.extractedEntities.actionType).toBe('expand');
    });

    it('should extract keywords', async () => {
      const result = await agent.perceive('添加关于SpaceX的最新信息', sampleContent);
      expect(result.extractedEntities.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('Document Structure Analysis', () => {
    it('should analyze document structure correctly', async () => {
      const result = await agent.perceive('修改文章', sampleContent);
      expect(result.documentStructure).toBeDefined();
      expect(result.documentStructure.sections.length).toBeGreaterThan(0);
    });

    it('should identify H2 sections', async () => {
      const result = await agent.perceive('修改文章', sampleContent);
      const h2Sections = result.documentStructure.sections.filter(
        s => s.heading?.level === 2
      );
      expect(h2Sections.length).toBe(2);
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence for clear instructions', async () => {
      const result = await agent.perceive('整体优化文章', sampleContent);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should have lower confidence for ambiguous instructions', async () => {
      const result = await agent.perceive('改一下', sampleContent);
      expect(result.confidence).toBeLessThan(0.9);
    });
  });

  describe('Subheading Detection', () => {
    it('should suggest subheadings for long sections without H3', async () => {
      const longContent: PartialBlock[] = [
        {
          type: 'heading',
          props: { level: 2 },
          content: [{ type: 'text', text: 'Long Section', styles: {} }],
        },
        ...Array(20).fill({
          type: 'paragraph',
          content: [{ type: 'text', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10), styles: {} }],
        }),
      ];

      const result = await agent.perceive('修改Long Section', longContent);
      expect(result.paragraphAnalysis.needsSubheadings).toBe(true);
    });

    it('should not suggest subheadings for short sections', async () => {
      const result = await agent.perceive('修改Future Outlook', sampleContent);
      expect(result.paragraphAnalysis.needsSubheadings).toBe(false);
    });
  });

  describe('Multi-language Support', () => {
    it('should handle English instructions', async () => {
      const result = await agent.perceive('expand the history section', sampleContent);
      expect(result.intent).toBe('add_content');
    });

    it('should handle Chinese instructions', async () => {
      const result = await agent.perceive('扩充历史部分', sampleContent);
      expect(result.intent).toBe('add_content');
    });
  });
});
