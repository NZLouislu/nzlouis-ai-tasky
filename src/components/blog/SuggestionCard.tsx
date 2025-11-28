/**
 * SuggestionCard - Displays AI-generated smart suggestions
 * Shows suggestion type, priority, and allows one-click application
 */

'use client';

import { Layout, FileText, Palette, TrendingUp } from 'lucide-react';
import { Suggestion } from '@/lib/blog/agentic-types';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onApply: (action: string) => void;
}

export function SuggestionCard({ suggestion, onApply }: SuggestionCardProps) {
  const icons = {
    structure: <Layout size={16} />,
    content: <FileText size={16} />,
    style: <Palette size={16} />,
    seo: <TrendingUp size={16} />,
  };

  const colors = {
    high: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      text: 'text-red-900',
      badge: 'bg-red-100 text-red-700',
    },
    medium: {
      border: 'border-yellow-200',
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
      badge: 'bg-yellow-100 text-yellow-700',
    },
    low: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-700',
    },
  };

  const color = colors[suggestion.priority];

  return (
    <div className={`border rounded-lg p-3 ${color.border} ${color.bg} hover:shadow-sm transition-shadow`}>
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 ${color.text}`}>
          {icons[suggestion.type]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`font-medium text-sm ${color.text}`}>
              {suggestion.title}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded ${color.badge} font-medium uppercase`}>
              {suggestion.priority}
            </span>
          </div>
          <p className="text-xs text-gray-700 mb-2">
            {suggestion.description}
          </p>
          <button
            onClick={() => onApply(suggestion.action)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
          >
            Apply this suggestion →
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * SuggestionList - Displays multiple suggestions
 */
interface SuggestionListProps {
  suggestions: Suggestion[];
  onApply: (action: string) => void;
}

export function SuggestionList({ suggestions, onApply }: SuggestionListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <span>💡</span>
        <span>Smart Suggestions</span>
      </h3>
      {suggestions.map((suggestion, i) => (
        <SuggestionCard key={i} suggestion={suggestion} onApply={onApply} />
      ))}
    </div>
  );
}
