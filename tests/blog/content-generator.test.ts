import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentGenerator } from '@/lib/blog/content-generator';
import { PlanningResult, SearchContext } from '@/lib/blog/agentic-types';
import { PartialBlock } from '@blocknote/core';

describe('ContentGenerator', () => {
  let generator: ContentGenerator;
  let mockCallLLM: ReturnType<typeof vi.fn<[string, string], Promise<string>>>;

  beforeEach(() => {
    generator = new ContentGenerator();
    mockCallLLM = vi.fn<[string, string], Promise<string>>();
  });

  const createMockPlanning = (type: string = 'insert'): PlanningResult => ({
    thought_process: 'Test planning',
    target_location: {
      section_index: null,
      section_title: undefined,
      block_range: [0, 0],
    },
    action_plan: {
      type: type as 'expand' | 'rewrite' | 'insert' | 'delete' | 'correct',
      estimated_words: 300,
      estimated_reading_time_increase: 1.5,
    },
    needs_search: false,
    search_queries: [],
    clarification_needed: false,
    clarification_questions: [],
    suggestions: [],
  });

  const createMockContent = (): PartialBlock[] => [
    {
      type: 'heading',
      content: [{ type: 'text', text: 'Mars Exploration', styles: {} }],
      props: { level: 1 },
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'This is an article about Mars.', styles: {} }],
      props: {},
    },
  ];

  describe('generate', () => {
    it('should generate content when LLM returns valid JSON', async () => {
      const validResponse = JSON.stringify({
        modifications: [
          {
            type: 'append',
            content: '## Natural Conditions of Mars\n\nMars is the fourth planet in the solar system with a unique natural environment. The surface temperature of Mars is extremely low, averaging about -63°C. The atmosphere is mainly composed of carbon dioxide, with pressure only 1% of Earth. Mars has two small moons: Phobos and Deimos.',
            block_range: [0, 0],
            metadata: {
              word_count: 80,
              sources_used: [],
            },
          },
        ],
        explanation: 'Added a paragraph about Mars natural conditions',
        changes_summary: {
          words_added: 80,
          reading_time_increased: 0.5,
        },
      });

      mockCallLLM.mockResolvedValue(validResponse);

      const result = await generator.generate(
        createMockPlanning(),
        null,
        createMockContent(),
        'Add a paragraph about the natural conditions of Mars',
        mockCallLLM
      );

      expect(result.modifications).toHaveLength(1);
      expect(result.modifications[0].content).toContain('Mars');
      expect(result.modifications[0].content).not.toContain("couldn't generate");
    });

    it('should use fallback when JSON parsing fails but plain text works', async () => {
      mockCallLLM
        .mockRejectedValueOnce(new Error('JSON parse error'))
        .mockResolvedValueOnce('Mars is the fourth planet in the solar system with a unique natural environment. The surface temperature is extremely low, averaging about -63°C.');

      const result = await generator.generate(
        createMockPlanning(),
        null,
        createMockContent(),
        'Add a paragraph about the natural conditions of Mars',
        mockCallLLM
      );

      expect(result.modifications).toHaveLength(1);
      expect(result.modifications[0].content).toContain('Mars');
    });

    it('should use search context in safety net when all LLM calls fail', async () => {
      mockCallLLM.mockRejectedValue(new Error('LLM unavailable'));

      const searchContext: SearchContext = {
        raw_results: [],
        summary: 'Mars is the fourth planet in the solar system, about 228 million kilometers from the Sun.',
        sources: [{ title: 'NASA', url: 'https://nasa.gov' }],
      };

      const result = await generator.generate(
        createMockPlanning(),
        searchContext,
        createMockContent(),
        'Add a paragraph about the natural conditions of Mars',
        mockCallLLM
      );

      expect(result.modifications[0].content).toContain('Mars');
      expect(result.modifications[0].content).not.toContain("couldn't generate");
    });

    it('should generate placeholder only when no search context and all LLM calls fail', async () => {
      mockCallLLM.mockRejectedValue(new Error('LLM unavailable'));

      const result = await generator.generate(
        createMockPlanning(),
        null,
        createMockContent(),
        'Add a paragraph about the natural conditions of Mars',
        mockCallLLM
      );

      expect(result.modifications[0].content).toContain("couldn't generate");
    });

    it('should handle LLM returning empty string', async () => {
      mockCallLLM.mockResolvedValue('');

      const result = await generator.generate(
        createMockPlanning(),
        null,
        createMockContent(),
        'Add a paragraph about the natural conditions of Mars',
        mockCallLLM
      );

      expect(result.modifications).toHaveLength(1);
    });

    it('should handle LLM returning markdown code block with JSON', async () => {
      const responseWithCodeBlock = '```json\n' + JSON.stringify({
        modifications: [
          {
            type: 'append',
            content: '## Natural Conditions of Mars\n\nMars has a unique natural environment.',
            block_range: [0, 0],
            metadata: { word_count: 20, sources_used: [] },
          },
        ],
        explanation: 'Added content',
        changes_summary: { words_added: 20, reading_time_increased: 0.1 },
      }) + '\n```';

      mockCallLLM.mockResolvedValue(responseWithCodeBlock);

      const result = await generator.generate(
        createMockPlanning(),
        null,
        createMockContent(),
        'Add a paragraph about the natural conditions of Mars',
        mockCallLLM
      );

      expect(result.modifications).toHaveLength(1);
      expect(result.modifications[0].content).toContain('Mars');
    });
  });
});
