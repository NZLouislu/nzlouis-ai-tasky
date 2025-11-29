/**
 * Tests for Agent Orchestrator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentOrchestrator } from '../agent-orchestrator';
import { AgentRequest } from '../agentic-types';
import { PartialBlock } from '@blocknote/core';

describe.skip('AgentOrchestrator', () => {
  // Mock external dependencies
  vi.mock('../cache/redis-cache', () => ({
    blogAICache: {
      getDocumentStructure: vi.fn().mockResolvedValue(null),
      getWritingStyle: vi.fn().mockResolvedValue(null),
      setDocumentStructure: vi.fn(),
      setWritingStyle: vi.fn(),
    },
  }));

  vi.mock('../context-builder', () => ({
    contextBuilder: {
      analyzeUserWritingStyle: vi.fn().mockResolvedValue('Generic style'),
    },
  }));

  vi.mock('@/lib/search/tavily', () => ({
    searchTavily: vi.fn().mockResolvedValue([]),
  }));

  vi.mock('../tools/seo-tool', () => ({
    checkSEO: vi.fn().mockResolvedValue({ overallScore: 80 }),
  }));

  vi.mock('../tools/readability-tool', () => ({
    analyzeReadability: vi.fn().mockResolvedValue({ overallScore: 80 }),
  }));

  // Dynamic mocks
  const mockPerceive = vi.fn();
  const mockPlan = vi.fn();
  const mockGenerate = vi.fn();

  vi.mock('../perception-agent', () => ({
    PerceptionAgent: vi.fn().mockImplementation(() => ({
      perceive: mockPerceive
    }))
  }));

  vi.mock('../planning-agent', () => ({
    PlanningAgent: vi.fn().mockImplementation(() => ({
      plan: mockPlan
    }))
  }));

  vi.mock('../content-generator', () => ({
    ContentGenerator: vi.fn().mockImplementation(() => ({
      generate: mockGenerate
    }))
  }));

  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    vi.clearAllMocks();
    orchestrator = new AgentOrchestrator();

    // Default mock implementations
    mockPerceive.mockResolvedValue({
      intent: 'modify_content',
      confidence: 1,
      documentStructure: { sections: [], outline: [], stats: {} },
      extractedEntities: { keywords: [] },
      paragraphAnalysis: { scope: 'single_paragraph' },
    });

    mockPlan.mockResolvedValue({
      thought_process: 'Plan',
      target_location: {},
      action_plan: { type: 'expand', estimated_words: 100 },
      needs_search: false,
      search_queries: [],
      clarification_needed: false,
      clarification_questions: [],
      suggestions: [],
    });

    mockGenerate.mockResolvedValue({
      modifications: [{ type: 'append', content: 'Mock content' }],
      explanation: 'Generated content',
      changes_summary: { words_added: 10, reading_time_increased: 0.1 },
    });
  });

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
      content: [{ type: 'text', text: 'Mars has been explored since the 1960s. Early missions included the Mariner and Viking programs.', styles: {} }],
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Future Outlook', styles: {} }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Future missions to Mars include SpaceX Starship and NASA Artemis programs.', styles: {} }],
    },
  ];

  // Mock LLM caller (not used directly by orchestrator logic anymore since agents are mocked, but passed to them)
  const mockLLM = vi.fn(async () => 'Mock LLM response');

  describe('Pipeline Execution', () => {
    it('should execute the complete pipeline successfully', async () => {
      const request: AgentRequest = {
        message: 'Expand the Mars Exploration History section',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, mockLLM);

      expect(response).toBeDefined();
      expect(response.conversation_id).toBeDefined();
      expect(response.message_id).toBeDefined();
      expect(response.reply).toBeDefined();
    });

    it('should return modification preview for content requests', async () => {
      const request: AgentRequest = {
        message: 'Add more details to the history section',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, mockLLM);

      expect(response.reply.type).toBe('modification_preview');
      expect(response.modification_preview).toBeDefined();
      expect(response.modification_preview?.modifications).toBeDefined();
    });

    it('should include debug information', async () => {
      const request: AgentRequest = {
        message: 'Improve the article',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, mockLLM);

      expect(response._debug).toBeDefined();
      expect(response._debug?.perception).toBeDefined();
      expect(response._debug?.planning).toBeDefined();
    });
  });

  describe('Clarification Handling', () => {
    it('should request clarification when needed', async () => {
      // Override mock for this test
      mockPlan.mockResolvedValueOnce({
        thought_process: 'Clarification needed',
        target_location: {},
        action_plan: { type: 'expand', estimated_words: 100 },
        needs_search: false,
        search_queries: [],
        clarification_needed: true,
        clarification_questions: ['Which section?'],
        suggestions: [],
      });

      const request: AgentRequest = {
        message: 'Make it better',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, mockLLM);

      expect(response.reply.type).toBe('clarification');
      expect(response.reply.content).toContain('Which section');
    });
  });

  describe('Error Handling', () => {
    it('should handle agent errors gracefully', async () => {
      mockPerceive.mockRejectedValueOnce(new Error('Perception failed'));

      const request: AgentRequest = {
        message: 'Expand the history',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, mockLLM);

      expect(response.reply.type).toBe('text');
      expect(response.reply.content).toContain('Perception failed');
    });
  });

  describe('Conversation Management', () => {
    it('should generate unique conversation IDs', async () => {
      const request: AgentRequest = {
        message: 'Test message',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response1 = await orchestrator.execute(request, mockLLM);
      const response2 = await orchestrator.execute(request, mockLLM);

      expect(response1.conversation_id).not.toBe(response2.conversation_id);
    });

    it('should preserve conversation ID when provided', async () => {
      const conversationId = 'existing-conv-123';
      const request: AgentRequest = {
        message: 'Follow-up message',
        conversation_id: conversationId,
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, mockLLM);

      expect(response.conversation_id).toBe(conversationId);
    });
  });

  describe('Quality Assessment', () => {
    it('should include quality score in response', async () => {
      const request: AgentRequest = {
        message: 'Expand the history section',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, mockLLM);

      expect(response.modification_preview?.quality_score).toBeDefined();
      expect(response.modification_preview?.quality_score).toBeGreaterThanOrEqual(0);
      expect(response.modification_preview?.quality_score).toBeLessThanOrEqual(1);
    });
  });

  describe('Diff Calculation', () => {
    it('should calculate diff statistics', async () => {
      const request: AgentRequest = {
        message: 'Add content',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, mockLLM);

      expect(response.modification_preview?.diff).toBeDefined();
      expect(response.modification_preview?.diff.stats).toBeDefined();
      expect(response.modification_preview?.diff.stats.words_added).toBeGreaterThanOrEqual(0);
    });
  });
});
