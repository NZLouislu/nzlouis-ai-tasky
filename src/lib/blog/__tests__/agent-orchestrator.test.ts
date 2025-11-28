/**
 * Tests for Agent Orchestrator
 */

import { describe, it, expect, vi } from 'vitest';
import { AgentOrchestrator } from '../agent-orchestrator';
import { AgentRequest } from '../agentic-types';
import { PartialBlock } from '@blocknote/core';

describe('AgentOrchestrator', () => {
  const orchestrator = new AgentOrchestrator();

  const sampleContent: PartialBlock[] = [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: 'Mars Exploration' }],
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Mars Exploration History' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Mars has been explored since the 1960s. Early missions included the Mariner and Viking programs.' }],
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Future Outlook' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Future missions to Mars include SpaceX Starship and NASA Artemis programs.' }],
    },
  ];

  // Mock LLM caller
  const mockLLM = vi.fn(async (systemPrompt: string, userPrompt: string) => {
    // Return a mock planning response
    if (systemPrompt.includes('planning')) {
      return JSON.stringify({
        thought_process: 'User wants to expand the Mars Exploration History section.',
        target_location: {
          section_index: 1,
          section_title: 'Mars Exploration History',
          block_range: [1, 2],
        },
        action_plan: {
          type: 'expand',
          estimated_words: 300,
          estimated_reading_time_increase: 1.5,
        },
        needs_search: false,
        search_queries: [],
        clarification_needed: false,
        clarification_questions: [],
        suggestions: ['Add information about recent Mars rovers', 'Include 2024 discoveries'],
      });
    }

    // Return a mock generation response
    if (systemPrompt.includes('content creation')) {
      return JSON.stringify({
        modifications: [
          {
            type: 'append',
            content: 'In recent years, Mars exploration has accelerated with missions like Perseverance and Ingenuity.',
            block_range: [2, 2],
            metadata: {
              word_count: 15,
              sources_used: [],
            },
          },
        ],
        explanation: 'Added information about recent Mars exploration missions.',
        changes_summary: {
          words_added: 15,
          reading_time_increased: 0.1,
        },
      });
    }

    // Default response
    return 'Mock LLM response';
  });

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
      // Mock LLM to return clarification needed
      const clarificationLLM = vi.fn(async () => {
        return JSON.stringify({
          thought_process: 'User instruction is ambiguous.',
          target_location: {
            section_index: null,
          },
          action_plan: {
            type: 'expand',
            estimated_words: 200,
            estimated_reading_time_increase: 1,
          },
          needs_search: false,
          search_queries: [],
          clarification_needed: true,
          clarification_questions: ['Which section would you like me to modify?'],
          suggestions: [],
        });
      });

      const request: AgentRequest = {
        message: 'Make it better',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, clarificationLLM);

      expect(response.reply.type).toBe('clarification');
      expect(response.reply.content).toContain('Which section');
    });
  });

  describe('Error Handling', () => {
    it('should handle LLM errors gracefully', async () => {
      const errorLLM = vi.fn(async () => {
        throw new Error('LLM API error');
      });

      const request: AgentRequest = {
        message: 'Expand the history',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, errorLLM);

      // Should return either error text or clarification (fallback behavior)
      expect(['text', 'clarification']).toContain(response.reply.type);
      expect(response.reply.content).toBeDefined();
    });

    it('should handle invalid JSON responses', async () => {
      const invalidLLM = vi.fn(async () => {
        return 'This is not valid JSON';
      });

      const request: AgentRequest = {
        message: 'Expand the history',
        post_id: 'test-post-123',
        current_content: sampleContent,
        current_title: 'Mars Exploration',
        user_id: 'test-user-123',
      };

      const response = await orchestrator.execute(request, invalidLLM);

      // Should fallback to error response
      expect(response).toBeDefined();
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
