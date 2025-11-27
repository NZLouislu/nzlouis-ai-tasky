'use client';

import React, { useState } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { PartialBlock } from '@blocknote/core';
import { X } from 'lucide-react';

interface ModificationPreviewProps {
  originalBlocks: PartialBlock[];
  modifiedBlocks: PartialBlock[];
  explanation: string;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (editedBlocks: PartialBlock[]) => void;
  originalTitle?: string;
  modifiedTitle?: string;
}

export function ModificationPreview({
  originalBlocks,
  modifiedBlocks,
  explanation,
  onAccept,
  onReject,
  onEdit,
  originalTitle,
  modifiedTitle,
}: ModificationPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(
    blocksToMarkdown(modifiedBlocks)
  );

  const originalText = blocksToMarkdown(originalBlocks);
  const modifiedText = blocksToMarkdown(modifiedBlocks);

  const handleAccept = () => {
    if (isEditing) {
      const newBlocks = markdownToBlocks(editedContent);
      onEdit(newBlocks);
    } else {
      onAccept();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onReject();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAccept();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              AI Modification Preview
            </h2>
            <p className="mt-1 text-gray-600">{explanation}</p>
          </div>
          <button
            onClick={onReject}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close preview"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {isEditing ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Edit Modified Content</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Back to Preview
                </button>
              </div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Edit content..."
                autoFocus
              />
            </div>
          ) : (
            <div>
              {/* Title Comparison - Show only if title changed */}
              {originalTitle && modifiedTitle && originalTitle !== modifiedTitle && (
                <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-0">
                    {/* Before Title */}
                    <div className="border-r border-gray-200 bg-gray-50 p-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Before
                      </div>
                      <div className="text-lg font-semibold text-gray-900 bg-red-50 px-3 py-2 rounded border border-red-200">
                        {originalTitle}
                      </div>
                    </div>
                    
                    {/* After Title */}
                    <div className="bg-gray-50 p-4">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        After
                      </div>
                      <div className="text-lg font-semibold text-gray-900 bg-green-50 px-3 py-2 rounded border border-green-200">
                        {modifiedTitle}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Content Comparison */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <ReactDiffViewer
                  oldValue={originalText}
                  newValue={modifiedText}
                  splitView={true}
                  showDiffOnly={false}
                  leftTitle="Before"
                  rightTitle="After"
                  styles={{
                    variables: {
                      light: {
                        diffViewerBackground: '#ffffff',
                        addedBackground: '#e6ffed',
                        removedBackground: '#ffeef0',
                        wordAddedBackground: '#acf2bd',
                        wordRemovedBackground: '#fdb8c0',
                        addedGutterBackground: '#cdffd8',
                        removedGutterBackground: '#ffdce0',
                        gutterBackground: '#f7f7f7',
                        gutterBackgroundDark: '#f3f3f3',
                        highlightBackground: '#fffbdd',
                        highlightGutterBackground: '#fff5b1',
                      },
                    },
                    line: {
                      padding: '10px 2px',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
          >
            {isEditing ? '📖 Preview' : '✏️ Edit'}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onReject}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
            >
              ❌ Reject
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium shadow-sm"
            >
              ✅ {isEditing ? 'Apply Edit' : 'Accept'}
            </button>
          </div>
        </div>

        <div className="px-6 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
          Keyboard shortcuts: <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded">Esc</kbd> to reject, 
          <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded ml-1">Ctrl+Enter</kbd> to accept
        </div>
      </div>
    </div>
  );
}

function blocksToMarkdown(blocks: PartialBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'heading') {
        const level = (block.props?.level as number) || 1;
        const text = extractText(block);
        return `${'#'.repeat(level)} ${text}`;
      }
      if (block.type === 'paragraph') {
        return extractText(block);
      }
      if (block.type === 'bulletListItem') {
        return `- ${extractText(block)}`;
      }
      if (block.type === 'numberedListItem') {
        return `1. ${extractText(block)}`;
      }
      if (block.type === 'checkListItem') {
        const checked = block.props?.checked ? 'x' : ' ';
        return `- [${checked}] ${extractText(block)}`;
      }
      if (block.type === 'codeBlock') {
        const language = block.props?.language || '';
        return `\`\`\`${language}\n${extractText(block)}\n\`\`\``;
      }
      return extractText(block);
    })
    .join('\n\n');
}

function markdownToBlocks(markdown: string): PartialBlock[] {
  const lines = markdown.split('\n\n');
  return lines
    .filter(line => line.trim())
    .map((line) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        return {
          type: 'heading',
          content: [{ type: 'text', text: headingMatch[2] }],
          props: { level: headingMatch[1].length },
        } as PartialBlock;
      }

      const bulletMatch = line.match(/^-\s+(.+)$/);
      if (bulletMatch) {
        return {
          type: 'bulletListItem',
          content: [{ type: 'text', text: bulletMatch[1] }],
        } as PartialBlock;
      }

      const numberedMatch = line.match(/^\d+\.\s+(.+)$/);
      if (numberedMatch) {
        return {
          type: 'numberedListItem',
          content: [{ type: 'text', text: numberedMatch[1] }],
        } as PartialBlock;
      }

      const checklistMatch = line.match(/^-\s+\[([ x])\]\s+(.+)$/);
      if (checklistMatch) {
        return {
          type: 'checkListItem',
          content: [{ type: 'text', text: checklistMatch[2] }],
          props: { checked: checklistMatch[1] === 'x' },
        } as PartialBlock;
      }

      const codeBlockMatch = line.match(/^```(\w*)\n([\s\S]*?)\n```$/);
      if (codeBlockMatch) {
        return {
          type: 'codeBlock',
          content: [{ type: 'text', text: codeBlockMatch[2] }],
          props: { language: codeBlockMatch[1] || 'plaintext' },
        } as PartialBlock;
      }

      return {
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      } as PartialBlock;
    });
}

function extractText(block: PartialBlock): string {
  if (typeof block.content === 'string') return block.content;
  if (Array.isArray(block.content)) {
    return block.content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && 'text' in item) return item.text;
        return '';
      })
      .join('');
  }
  return '';
}
