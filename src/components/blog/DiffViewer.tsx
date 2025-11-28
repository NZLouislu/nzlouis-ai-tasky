/**
 * DiffViewer - Visualizes content differences
 * Shows additions, modifications, and deletions with color coding
 */

'use client';

interface Change {
  type: 'add' | 'modify' | 'delete';
  block_index: number;
  old_content?: string;
  new_content?: string;
}

interface DiffResult {
  changes: Change[];
  stats: {
    blocks_added: number;
    blocks_modified: number;
    blocks_deleted: number;
    words_added: number;
    words_deleted: number;
  };
}

interface DiffViewerProps {
  diff: DiffResult;
}

export function DiffViewer({ diff }: DiffViewerProps) {
  if (diff.changes.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No changes to display
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {diff.changes.map((change, idx) => {
        if (change.type === 'add') {
          return (
            <div
              key={idx}
              className="bg-green-50 border-l-4 border-green-500 p-3 rounded"
            >
              <div className="text-xs text-green-700 font-medium mb-1 flex items-center gap-1">
                <span className="text-green-600">✚</span> Added Content
              </div>
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {change.new_content}
              </div>
            </div>
          );
        }

        if (change.type === 'modify') {
          return (
            <div
              key={idx}
              className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded"
            >
              <div className="text-xs text-yellow-700 font-medium mb-2 flex items-center gap-1">
                <span className="text-yellow-600">✎</span> Modified Content
              </div>
              
              {/* Old Content */}
              {change.old_content && (
                <div className="mb-2">
                  <div className="text-xs text-gray-500 mb-1">Before:</div>
                  <div className="text-sm text-gray-600 bg-red-50 p-2 rounded line-through">
                    {change.old_content}
                  </div>
                </div>
              )}
              
              {/* New Content */}
              {change.new_content && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">After:</div>
                  <div className="text-sm text-gray-800 bg-green-50 p-2 rounded">
                    {change.new_content}
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (change.type === 'delete') {
          return (
            <div
              key={idx}
              className="bg-red-50 border-l-4 border-red-500 p-3 rounded"
            >
              <div className="text-xs text-red-700 font-medium mb-1 flex items-center gap-1">
                <span className="text-red-600">✖</span> Deleted Content
              </div>
              <div className="text-sm text-gray-600 line-through whitespace-pre-wrap">
                {change.old_content}
              </div>
            </div>
          );
        }

        return null;
      })}

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600 flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {diff.stats.blocks_added} added
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            {diff.stats.blocks_modified} modified
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            {diff.stats.blocks_deleted} deleted
          </span>
        </div>
      </div>
    </div>
  );
}
