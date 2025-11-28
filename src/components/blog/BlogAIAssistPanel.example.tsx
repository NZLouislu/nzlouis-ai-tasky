/**
 * Example: How to integrate AI Blog Editor components into BlogPage
 * This is a reference implementation showing how to use all the components
 */

'use client';

import { useState } from 'react';
import { PartialBlock } from '@blocknote/core';
import {
  ThinkingIndicator,
  ModificationPreviewCard,
  SuggestionList,
  ProgressIndicator,
} from '@/components/blog';
import { AgentResponse } from '@/lib/blog/agentic-types';

interface AIAssistState {
  isProcessing: boolean;
  currentStage?: 'perception' | 'planning' | 'retrieval' | 'generation' | 'validation';
  progress?: number;
  response?: AgentResponse;
  isApplying?: boolean;
}

export function BlogAIAssistPanel({
  postId,
  currentContent,
  currentTitle,
  onContentUpdate,
}: {
  postId: string;
  currentContent: PartialBlock[];
  currentTitle: string;
  onContentUpdate: (newContent: PartialBlock[]) => void;
}) {
  const [aiState, setAiState] = useState<AIAssistState>({
    isProcessing: false,
  });

  /**
   * Handle AI assist request
   */
  async function handleAIAssist(message: string) {
    setAiState({ isProcessing: true, currentStage: 'perception', progress: 0 });

    try {
      // Simulate stage progression
      const stages: Array<'perception' | 'planning' | 'retrieval' | 'generation' | 'validation'> = [
        'perception',
        'planning',
        'retrieval',
        'generation',
        'validation',
      ];

      for (let i = 0; i < stages.length; i++) {
        setAiState(prev => ({
          ...prev,
          currentStage: stages[i],
          progress: (i / stages.length) * 100,
        }));
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
      }

      // Call API
      const response = await fetch('/api/blog/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          post_id: postId,
          current_content: currentContent,
          current_title: currentTitle,
        }),
      });

      const data: AgentResponse = await response.json();

      if (!response.ok) {
        if (data.requiresSetup) {
          // Show setup prompt
          alert(data.message);
          return;
        }
        throw new Error(data.message || 'Failed to process request');
      }

      setAiState({
        isProcessing: false,
        response: data,
      });
    } catch (error) {
      console.error('AI Assist error:', error);
      setAiState({ isProcessing: false });
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  }

  /**
   * Apply modifications to the editor
   */
  async function handleApplyModification() {
    if (!aiState.response?.modification_preview) return;

    setAiState(prev => ({ ...prev, isApplying: true }));

    try {
      // Apply modifications to content
      const newContent = aiState.response.modification_preview.preview_blocks;
      onContentUpdate(newContent);

      // Clear the preview
      setAiState({ isProcessing: false });
    } catch (error) {
      console.error('Failed to apply modifications:', error);
      alert('Failed to apply modifications');
    } finally {
      setAiState(prev => ({ ...prev, isApplying: false }));
    }
  }

  /**
   * Reject modifications
   */
  function handleRejectModification() {
    setAiState({ isProcessing: false });
  }

  /**
   * Apply a suggestion
   */
  function handleApplySuggestion(action: string) {
    handleAIAssist(action);
  }

  return (
    <div className="w-96 space-y-4">
      {/* Chat Input */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-semibold mb-3">AI Blog Assistant</h3>
        <form
          onSubmit={e => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const message = formData.get('message') as string;
            if (message.trim()) {
              handleAIAssist(message);
              e.currentTarget.reset();
            }
          }}
        >
          <textarea
            name="message"
            placeholder="Tell me what you'd like to do... (e.g., 'Expand the introduction section')"
            className="w-full border rounded p-2 text-sm resize-none"
            rows={3}
            disabled={aiState.isProcessing}
          />
          <button
            type="submit"
            disabled={aiState.isProcessing}
            className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
          >
            {aiState.isProcessing ? 'Processing...' : 'Send'}
          </button>
        </form>
      </div>

      {/* Progress Indicator */}
      {aiState.isProcessing && aiState.currentStage && (
        <div className="border rounded-lg p-4 bg-white">
          <ProgressIndicator
            currentStage={aiState.currentStage}
            progress={aiState.progress}
          />
        </div>
      )}

      {/* Thinking Indicator */}
      {aiState.response?._debug?.planning && !aiState.response.modification_preview && (
        <ThinkingIndicator
          planning={aiState.response._debug.planning}
          currentStage={aiState.currentStage}
        />
      )}

      {/* Modification Preview */}
      {aiState.response?.modification_preview && (
        <ModificationPreviewCard
          preview={aiState.response.modification_preview}
          onApply={handleApplyModification}
          onReject={handleRejectModification}
          isApplying={aiState.isApplying}
        />
      )}

      {/* Suggestions */}
      {aiState.response?.suggestions && aiState.response.suggestions.length > 0 && (
        <SuggestionList
          suggestions={aiState.response.suggestions}
          onApply={handleApplySuggestion}
        />
      )}

      {/* Quick Actions */}
      {!aiState.isProcessing && !aiState.response && (
        <div className="border rounded-lg p-4 bg-white">
          <h4 className="font-medium text-sm mb-2">Quick Actions</h4>
          <div className="space-y-2">
            {[
              { label: 'Expand current section', action: 'expand the current section with more details' },
              { label: 'Improve overall quality', action: 'improve the overall quality of the article' },
              { label: 'Add latest information', action: 'add the latest information to this article' },
              { label: 'Check for errors', action: 'check for factual errors and inconsistencies' },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => handleAIAssist(item.action)}
                className="w-full text-left text-sm px-3 py-2 border rounded hover:bg-gray-50 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
