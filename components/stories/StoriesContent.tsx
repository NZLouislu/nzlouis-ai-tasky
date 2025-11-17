"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useStoriesStore } from "@/lib/stores/stories-store";
import StoriesEditor from "./StoriesEditor";
import { PartialBlock } from "@blocknote/core";

export default function StoriesContent() {
  const { activeDocumentId, platforms, updateDocument } = useStoriesStore();
  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generatingStories, setGeneratingStories] = useState(false);
  const [improvingDocument, setImprovingDocument] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  const getActiveDocument = () => {
    for (const platform of platforms) {
      for (const project of platform.projects) {
        const document = project.documents.find(doc => doc.id === activeDocumentId);
        if (document) {
          return { document, project, platform };
        }
      }
    }
    return null;
  };

  const activeData = getActiveDocument();

  // Fetch document details when activeDocumentId changes
  useEffect(() => {
    if (activeDocumentId) {
      // Check if this is a new local document (not yet saved to server)
      const activeData = getActiveDocument();
      if (activeData) {
        const { document } = activeData;
        // If document has no lastSyncedAt, it's a new local document
        if (!document.lastSyncedAt) {
          // Use local document data directly
        setDocumentData({
          id: document.id,
          title: document.title,
          content: document.content || '',
          document_type: document.documentType,
          file_name: document.fileName,
          created_at: document.createdAt,
          updated_at: document.updatedAt,
        });
          setLoading(false);
        } else {
          // Fetch from server for synced documents
          fetchDocumentDetails(activeDocumentId);
        }
      }
    } else {
      setDocumentData(null);
    }
  }, [activeDocumentId]);

  const fetchDocumentDetails = async (documentId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/stories/documents/${documentId}`);
      const result = await response.json();
      
      if (result.success) {
        setDocumentData(result.document);
      } else {
        console.error('Failed to fetch document:', result.error);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle document content changes
  const handleContentChange = useCallback((content: PartialBlock[]) => {
    if (activeDocumentId) {
      // Convert BlockNote content to markdown string
      const markdownContent = convertBlockNoteToMarkdown(content);
      updateDocument(activeDocumentId, { content: markdownContent });
    }
  }, [activeDocumentId, updateDocument]);

  // Convert BlockNote content to markdown
  const convertBlockNoteToMarkdown = (blocks: PartialBlock[]): string => {
    if (!blocks || !Array.isArray(blocks)) return '';
    
    return blocks.map(block => {
      if (typeof block.content === 'string') {
        return block.content;
      }
      if (Array.isArray(block.content)) {
        return block.content.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object' && item && 'text' in item) return item.text;
          return '';
        }).join('');
      }
      return '';
    }).filter(text => text.trim()).join('\n\n');
  };

  // Convert markdown to BlockNote content
  const convertMarkdownToBlockNote = (markdown: string | any): PartialBlock[] => {
    // Handle case where markdown is not a string
    if (!markdown) return [{
      type: "paragraph",
      content: "",
    }];
    
    // If markdown is already an array (BlockNote format), return it
    if (Array.isArray(markdown)) {
      return markdown.length > 0 ? markdown : [{
        type: "paragraph",
        content: "",
      }];
    }
    
    // Convert to string if it's not already
    const markdownString = typeof markdown === 'string' ? markdown : String(markdown);
    
    const lines = markdownString.split('\n');
    const blocks: PartialBlock[] = [];
    
    for (const line of lines) {
      if (line.trim()) {
        blocks.push({
          type: "paragraph",
          content: line.trim(),
        });
      }
    }
    
    return blocks.length > 0 ? blocks : [{
      type: "paragraph",
      content: "",
    }];
  };

  // Handle document save
  const handleDocumentSave = useCallback(async (content: PartialBlock[]) => {
    if (!activeDocumentId) return;

    const activeData = getActiveDocument();
    if (!activeData) return;

    const { document, project, platform } = activeData;
    const isNewDocument = !document.lastSyncedAt;
    const markdownContent = convertBlockNoteToMarkdown(content);

    try {
      if (isNewDocument) {
        // Create new document on server
        const response = await fetch('/api/stories/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project_id: project.id,
            platform: platform.name,
            document_type: document.documentType,
            title: document.title,
            file_name: document.fileName,
            content: markdownContent,
          }),
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create document');
        }

        // Update local state with server ID and sync info
        updateDocument(activeDocumentId, { 
          content: markdownContent,
          lastSyncedAt: new Date().toISOString(),
          updatedAt: result.document.updated_at,
        });
      } else {
        // Update existing document
        const response = await fetch(`/api/stories/documents/${activeDocumentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: markdownContent,
            metadata: {
              last_auto_save: new Date().toISOString(),
            },
          }),
        });

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to save document');
        }

        // Update local state
        updateDocument(activeDocumentId, { 
          content: markdownContent,
          updatedAt: result.document.updated_at,
        });
      }
    } catch (error) {
      console.error('Failed to save document:', error);
      throw error;
    }
  }, [activeDocumentId, updateDocument, platforms, convertBlockNoteToMarkdown]);

  // Handle AI story generation
  const handleGenerateStories = useCallback(async () => {
    if (!documentData || documentData.document_type !== 'report') return;

    setGeneratingStories(true);
    try {
      const response = await fetch('/api/stories/ai/generate-stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportDocumentId: activeDocumentId,
          platform: platform?.name,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Show success message and optionally navigate to the new stories document
        alert(`Stories generated successfully! Document: ${result.storiesDocument.title}`);
        
        // Refresh the sidebar to show the new document
        // You might want to add a refresh function to the store
      } else {
        throw new Error(result.error || 'Failed to generate stories');
      }
    } catch (error) {
      console.error('Failed to generate stories:', error);
      alert('Failed to generate stories. Please try again.');
    } finally {
      setGeneratingStories(false);
    }
  }, [documentData, activeDocumentId, activeData?.platform]);

  // Handle AI document improvement
  const handleImproveDocument = useCallback(async () => {
    if (!documentData) return;

    const instruction = prompt(`How would you like to improve this ${documentData.document_type}?`);
    if (!instruction) return;

    setImprovingDocument(true);
    try {
      const currentContent = documentData.content?.map((block: any) => {
        if (block.content && Array.isArray(block.content)) {
          return block.content.map((item: any) => item.text || '').join('');
        }
        return '';
      }).join('\n') || '';

      const response = await fetch('/api/stories/ai/improve-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: activeDocumentId,
          instruction,
          currentContent,
          documentType: documentData.document_type,
          platform: platform?.name,
        }),
      });

      const result = await response.json();
      
      if (result.success && result.blockNoteContent) {
        // Update the document with improved content
        await handleDocumentSave(result.blockNoteContent);
        setDocumentData((prev: any) => ({
          ...prev,
          content: result.blockNoteContent
        }));
        
        alert('Document improved successfully!');
      } else {
        throw new Error(result.error || 'Failed to improve document');
      }
    } catch (error) {
      console.error('Failed to improve document:', error);
      alert('Failed to improve document. Please try again.');
    } finally {
      setImprovingDocument(false);
    }
  }, [documentData, activeDocumentId, activeData?.platform, handleDocumentSave]);

  // Handle AI-generated content from chatbot
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitleValue(newTitle);
  }, []);

  const handleTitleBlur = useCallback(() => {
    setEditingTitle(false);
    if (titleValue && activeDocumentId && titleValue !== documentData?.title) {
      updateDocument(activeDocumentId, { title: titleValue });
      setDocumentData((prev: any) => ({
        ...prev,
        title: titleValue
      }));
    }
  }, [titleValue, activeDocumentId, documentData, updateDocument]);

  // Force re-render when document title or content changes
  useEffect(() => {
    const activeData = getActiveDocument();
    if (activeData && documentData) {
      const { document } = activeData;
      if (document.title !== documentData.title || document.content !== documentData.content) {
        setDocumentData((prev: any) => {
          // Only update if values actually changed
          if (prev?.title !== document.title || prev?.content !== document.content) {
            return {
              ...prev,
              title: document.title,
              content: document.content || ''
            };
          }
          return prev;
        });
      }
    }
  }, [getActiveDocument, documentData?.title, documentData?.content]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setEditingTitle(false);
      setTitleValue(documentData?.title || '');
    }
  }, [handleTitleBlur, documentData]);

  useEffect(() => {
    if (documentData?.title) {
      setTitleValue(documentData.title);
    }
  }, [documentData?.title]);


  if (!activeDocumentId || !activeData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-2xl mx-auto p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Welcome to Stories
          </h2>
          <p className="text-gray-600 mb-8">
            Select a project from the sidebar or connect your platform to get started.
          </p>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-2">Getting Started</h3>
            <ol className="text-sm text-gray-600 space-y-2 text-left">
              <li>1. Connect Jira or Trello from the sidebar</li>
              <li>2. Select a project or create a new one</li>
              <li>3. Start creating reports and stories</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  const { document, project, platform } = activeData || {};

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <span>{platform?.displayName}</span>
          <span>•</span>
          <span>{project?.projectName}</span>
        </div>
        {editingTitle ? (
          <input
            type="text"
            value={titleValue}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="text-2xl font-semibold text-gray-800 w-full border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          />
        ) : (
          <h1 
            className="text-2xl font-semibold text-gray-800 cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -ml-2"
            onClick={() => setEditingTitle(true)}
          >
            {documentData?.title || document?.title}
          </h1>
        )}
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto">
          {documentData ? (
            <>
              {/* Document Actions Bar */}
              <div className="mb-4 flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {documentData.document_type === 'report' ? '📄 Report' : '📝 Stories'}
                  </span>
                  <span className="text-sm text-gray-400">•</span>
                  <span className="text-sm text-gray-600">
                    {platform.displayName}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {documentData.document_type === 'report' && (
                    <button
                      onClick={handleGenerateStories}
                      disabled={generatingStories}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      {generatingStories ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Generate Stories</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={handleImproveDocument}
                    disabled={improvingDocument}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {improvingDocument ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Improving...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Improve {documentData.document_type}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <StoriesEditor
                documentId={activeDocumentId}
                initialContent={convertMarkdownToBlockNote(documentData.content || '')}
                onContentChange={handleContentChange}
                onSave={handleDocumentSave}
                placeholder={`Start writing your ${documentData.document_type}...`}
                autoSave={true}
                autoSaveDelay={1000}
              />
            </>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Document Editor
              </h3>
              <p className="text-gray-600 mb-4">
                Document: {document?.fileName}
              </p>
              <p className="text-gray-600 mb-4">
                Type: {document.documentType === 'report' ? 'Report' : 'Stories'}
              </p>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(document.updatedAt).toLocaleString()}
              </p>
              
              <div className="mt-6 p-4 bg-white rounded border border-gray-200 min-h-96">
                <p className="text-gray-500 italic">
                  Loading document content...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
