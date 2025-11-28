/**
 * ModificationPreviewCard - Shows preview of AI-generated modifications
 * Displays explanation, quality score, stats, and action buttons
 */

'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { DiffViewer } from './DiffViewer';

interface ModificationPreview {
  modifications: any[];
  explanation: string;
  quality_score: number;
  preview_blocks: any[];
  diff: {
    changes: any[];
    stats: {
      blocks_added: number;
      blocks_modified: number;
      blocks_deleted: number;
      words_added: number;
      words_deleted: number;
    };
  };
  metadata?: {
    searchAvailable?: boolean;
    searchNote?: string;
    [key: string]: any;
  };
}

interface ModificationPreviewCardProps {
  preview: ModificationPreview;
  onApply: () => void;
  onEdit?: () => void;
  onReject: () => void;
  isApplying?: boolean;
}

export function ModificationPreviewCard({
  preview,
  onApply,
  onEdit,
  onReject,
  isApplying = false,
}: ModificationPreviewCardProps) {
  const [showDiff, setShowDiff] = useState(false);

  const qualityScore = (preview.quality_score * 10).toFixed(1);
  const qualityColor =
    preview.quality_score >= 0.8
      ? 'text-green-600 bg-green-100'
      : preview.quality_score >= 0.6
        ? 'text-yellow-600 bg-yellow-100'
        : 'text-red-600 bg-red-100';

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">✨ Modification Preview</h4>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-1 rounded ${qualityColor}`}>
              Quality: {qualityScore}/10
            </span>
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showDiff ? 'Hide' : 'Show'} Changes
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-700">{preview.explanation}</p>

        {/* Statistics */}
        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            📝 <span className="font-medium">+{preview.diff.stats.words_added}</span> words
          </span>
          <span className="flex items-center gap-1">
            ⏱️ <span className="font-medium">+{Math.ceil(preview.diff.stats.words_added / 200)}</span> min
          </span>
          {preview.diff.stats.blocks_added > 0 && (
            <span className="flex items-center gap-1">
              ➕ <span className="font-medium">{preview.diff.stats.blocks_added}</span> blocks
            </span>
          )}
        </div>

        {/* Search Note */}
        {preview.metadata?.searchAvailable === false && preview.metadata?.searchNote && (
          <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{preview.metadata.searchNote}</span>
          </div>
        )}
      </div>

      {/* Diff Display */}
      {showDiff && (
        <div className="p-4 bg-gray-50 border-b max-h-96 overflow-y-auto">
          <DiffViewer diff={preview.diff} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 flex gap-2 bg-white">
        <button
          onClick={onApply}
          disabled={isApplying}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isApplying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Apply Changes
            </>
          )}
        </button>
        
        {onEdit && (
          <button
            onClick={onEdit}
            disabled={isApplying}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            ✏️ Adjust
          </button>
        )}
        
        <button
          onClick={onReject}
          disabled={isApplying}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );
}
