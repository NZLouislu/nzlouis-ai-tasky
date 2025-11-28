/**
 * ThinkingIndicator - Visualizes AI's thought process
 * Shows the current stage, planning details, and suggestions
 */

'use client';

import { Brain, CheckCircle, Search } from 'lucide-react';
import { PlanningResult } from '@/lib/blog/agentic-types';

interface ThinkingIndicatorProps {
  planning: PlanningResult;
  currentStage?: 'perception' | 'planning' | 'retrieval' | 'generation' | 'validation' | 'suggestion';
  progress?: number;
}

export function ThinkingIndicator({ planning, currentStage = 'planning', progress = 0 }: ThinkingIndicatorProps) {
  const stages = [
    { id: 'perception', label: 'Understanding', icon: '🧠' },
    { id: 'planning', label: 'Planning', icon: '📋' },
    { id: 'retrieval', label: 'Searching', icon: '🔍' },
    { id: 'generation', label: 'Writing', icon: '✍️' },
    { id: 'validation', label: 'Checking', icon: '✅' },
  ];

  const currentStageIndex = stages.findIndex(s => s.id === currentStage);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Brain className="text-blue-600 mt-1 animate-pulse" size={20} />
        <div className="flex-1">
          <div className="font-medium text-blue-900 mb-2">AI Thinking Process</div>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-3">
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className={`flex-1 h-1 rounded transition-all ${
                  idx < currentStageIndex
                    ? 'bg-green-600'
                    : idx === currentStageIndex
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Current Stage */}
          <div className="text-sm text-blue-700 mb-2">
            {stages[currentStageIndex]?.icon} {stages[currentStageIndex]?.label}...
          </div>

          {/* Thought Process */}
          <p className="text-sm text-blue-800 mb-3">
            {planning.thought_process}
          </p>

          {/* Target Location */}
          {planning.target_location.section_title && (
            <div className="text-sm text-blue-700 mb-2">
              📍 Target: <span className="font-medium">{planning.target_location.section_title}</span>
              {planning.target_location.section_index !== null && (
                <span className="text-blue-600"> (Section {planning.target_location.section_index + 1})</span>
              )}
            </div>
          )}

          {/* Action Plan */}
          <div className="text-sm text-blue-700 mb-2">
            🎯 Action: <span className="font-medium capitalize">{planning.action_plan.type}</span>
            {' '}(~{planning.action_plan.estimated_words} words, 
            +{planning.action_plan.estimated_reading_time_increase.toFixed(1)} min reading time)
          </div>

          {/* Search Queries */}
          {planning.needs_search && planning.search_queries.length > 0 && (
            <div className="mt-2 text-sm">
              <div className="flex items-center gap-1 text-blue-700 mb-1">
                <Search size={14} />
                <span className="font-medium">Will search for:</span>
              </div>
              <ul className="text-blue-600 space-y-1 ml-5">
                {planning.search_queries.map((query, i) => (
                  <li key={i} className="list-disc">{query}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {planning.suggestions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="text-sm font-medium text-blue-900 mb-2">💡 Suggestions:</div>
              <ul className="text-sm space-y-1">
                {planning.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
