"use client";
import React, { useState, useCallback, useEffect } from "react";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface StoriesEditorProps {
  documentId: string;
  initialContent?: PartialBlock[];
  onContentChange?: (content: PartialBlock[]) => void;
  onSave?: (content: PartialBlock[]) => Promise<void>;
  readOnly?: boolean;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export default function StoriesEditor({
  documentId,
  initialContent = [],
  onContentChange,
  onSave,
  readOnly = false,
  placeholder = "Start writing your story...",
  autoSave = true,
  autoSaveDelay = 1000,
}: StoriesEditorProps) {
  const [content, setContent] = useState<PartialBlock[]>(initialContent);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Create BlockNote editor instance
  const editor = useCreateBlockNote({
    initialContent: initialContent.length > 0 ? initialContent : [
      {
        type: "paragraph",
        content: "",
      },
    ],
  });

  

  // Handle content changes
  const handleContentChange = useCallback((newContent: PartialBlock[]) => {
    // Prevent infinite loops by checking if content actually changed
    if (JSON.stringify(newContent) === JSON.stringify(content)) {
      return;
    }
    
    setContent(newContent);
    onContentChange?.(newContent);

    // Auto-save logic
    if (autoSave && onSave && !readOnly) {
      setSaveStatus('saving');
      
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for auto-save
      const timeout = setTimeout(async () => {
        try {
          await onSave(newContent);
          setSaveStatus('saved');
        } catch (error) {
          console.error('Auto-save failed:', error);
          setSaveStatus('error');
        }
      }, autoSaveDelay);

      setSaveTimeout(timeout);
    }
  }, [autoSave, onSave, readOnly, autoSaveDelay, saveTimeout]);

  // Manual save function
  const handleManualSave = useCallback(async () => {
    if (!onSave || readOnly) return;

    setSaveStatus('saving');
    try {
      await onSave(content);
      setSaveStatus('saved');
    } catch (error) {
      console.error('Manual save failed:', error);
      setSaveStatus('error');
    }
  }, [onSave, content, readOnly]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S for manual save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleManualSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  // Update content when initialContent changes
  useEffect(() => {
    if (initialContent.length > 0) {
      const currentContentStr = JSON.stringify(content);
      const newContentStr = JSON.stringify(initialContent);
      
      if (currentContentStr !== newContentStr) {
        setContent(initialContent);
        try {
          editor.replaceBlocks(editor.document, initialContent);
        } catch (error) {
          console.warn('Failed to update editor content:', error);
        }
      }
    }
  }, [JSON.stringify(initialContent), editor]);

  return (
    <div className="stories-editor-container">
      {/* Save Status Indicator */}
      {autoSave && onSave && !readOnly && (
        <div className="flex items-center justify-between mb-4 px-4 py-2 bg-gray-50 rounded-md">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              saveStatus === 'saved' ? 'bg-green-500' : 
              saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' : 
              'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600">
              {saveStatus === 'saved' ? 'All changes saved' :
               saveStatus === 'saving' ? 'Saving...' :
               'Save failed'}
            </span>
          </div>
          
          <button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
          >
            Save now
          </button>
        </div>
      )}

      {/* BlockNote Editor */}
      <div className="stories-editor-wrapper border border-gray-200 rounded-lg overflow-hidden">
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          onChange={() => {
            const newContent = editor.document;
            handleContentChange(newContent);
          }}
          theme="light"
          data-theming-css-variables-demo
        />
      </div>

      {/* Editor Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div>
          Document ID: {documentId}
        </div>
        
        {!readOnly && (
          <div className="flex items-center space-x-4">
            <span>
              Press Ctrl+S to save manually
            </span>
            {autoSave && (
              <span>
                Auto-save: {autoSaveDelay / 1000}s delay
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}