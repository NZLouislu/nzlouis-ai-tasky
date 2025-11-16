"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useStoriesStore } from "@/lib/stores/stories-store";
import { signIn, useSession } from "next-auth/react";
import StoriesEditor from "./StoriesEditor";
import StoriesChatbot from "./StoriesChatbot";
import { PartialBlock } from "@blocknote/core";

export default function StoriesContent() {
  const { activeDocumentId, platforms, updatePlatformStatus, updateDocument } = useStoriesStore();
  const { data: session, status } = useSession();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generatingStories, setGeneratingStories] = useState(false);
  const [improvingDocument, setImprovingDocument] = useState(false);

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
      fetchDocumentDetails(activeDocumentId);
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
      updateDocument(activeDocumentId, { content });
    }
  }, [activeDocumentId, updateDocument]);

  // Handle document save
  const handleDocumentSave = useCallback(async (content: PartialBlock[]) => {
    if (!activeDocumentId) return;

    try {
      const response = await fetch(`/api/stories/documents/${activeDocumentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
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
        content,
        updatedAt: result.document.updated_at,
      });

    } catch (error) {
      console.error('Failed to save document:', error);
      throw error;
    }
  }, [activeDocumentId, updateDocument]);

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
  const handleAIContentGenerated = useCallback((content: any) => {
    if (content && activeDocumentId) {
      // Append or integrate the AI-generated content
      console.log('AI content generated:', content);
      // You can implement logic to insert this content into the editor
    }
  }, [activeDocumentId]);

  const handleConnectGoogle = async () => {
    try {
      await signIn('google', {
        callbackUrl: '/stories',
        redirect: true 
      });
    } catch (error) {
      console.error('Failed to connect Google:', error);
    }
  };

  const handleConnectPlatform = async (platformName: 'jira' | 'trello') => {
    if (!session?.user?.email) {
      // First connect Google account
      await handleConnectGoogle();
      return;
    }

    setConnectingPlatform(platformName);
    
    try {
      if (platformName === 'jira') {
        // Connect to Jira using server-side credentials
        const response = await fetch('/api/stories/jira/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jiraUrl: 'https://nzlouiscom.atlassian.net',
            jiraEmail: 'nzlouis.com@gmail.com',
            jiraApiToken: 'ATATT3xFfGF0JJuWG-5Ix48CcQDuiqQ9r2VpqPKmaVYzUHPcxJFIMUx0_p_kCjH4JLUNsRgbi5IjdMS2cmBVXNAHm6jzHi58_KFJh0SWgTAuDcjwNFwqbGxqltFS4tdq6P88dyA14q6-suzhU8jX7J84vyYqR6A5FPzElXLdcsP99O5JCbjVL10=04488D64',
            jiraProjectKey: 'PAJF',
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          updatePlatformStatus(platformName, 'connected', session.user.email);
        } else {
          throw new Error(result.error || 'Failed to connect to Jira');
        }
      } else if (platformName === 'trello') {
        // Connect to Trello using server-side credentials
        const response = await fetch('/api/stories/trello/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trelloKey: '0d82362fa61811ac6840d22e41f14fc8',
            trelloToken: 'ATTA4fbd4b8251baa3de7212d6cdc044426530ae533069a707247e9f5de0efd79575BECD8877',
            trelloBoardId: '3LjHBq1w',
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          updatePlatformStatus(platformName, 'connected', session.user.email);
        } else {
          throw new Error(result.error || 'Failed to connect to Trello');
        }
      }
      
      setConnectingPlatform(null);
      
    } catch (error) {
      console.error(`Failed to connect ${platformName}:`, error);
      updatePlatformStatus(platformName, 'error', session.user.email);
      setConnectingPlatform(null);
    }
  };

  if (!activeDocumentId || !activeData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-2xl mx-auto p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Welcome to Stories
          </h2>
          <p className="text-gray-600 mb-8">
            Connect your Jira or Trello accounts to start managing your project stories and reports.
          </p>
          
          {/* Google Account Status */}
          <div className="mb-8">
            {session?.user ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-800 font-medium">
                    Connected as {session.user.email}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="font-medium text-gray-800 mb-3">Step 1: Connect Google Account</h3>
                <button
                  onClick={handleConnectGoogle}
                  disabled={status === 'loading'}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  {status === 'loading' ? 'Connecting...' : 'Connect with Google'}
                </button>
              </div>
            )}
          </div>

          {/* Platform Connections */}
          {session?.user && (
            <div className="space-y-4 mb-8">
              <h3 className="font-medium text-gray-800 mb-4">Step 2: Connect Platform</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Jira Connection */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-800">Jira</h4>
                    <div className={`w-3 h-3 rounded-full ${
                      platforms.find(p => p.name === 'jira')?.connectionStatus === 'connected' 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`}></div>
                  </div>
                  <button
                    onClick={() => handleConnectPlatform('jira')}
                    disabled={connectingPlatform === 'jira'}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    {connectingPlatform === 'jira' ? 'Connecting...' : 'Connect Jira'}
                  </button>
                </div>

                {/* Trello Connection */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-800">Trello</h4>
                    <div className={`w-3 h-3 rounded-full ${
                      platforms.find(p => p.name === 'trello')?.connectionStatus === 'connected' 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                    }`}></div>
                  </div>
                  <button
                    onClick={() => handleConnectPlatform('trello')}
                    disabled={connectingPlatform === 'trello'}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    {connectingPlatform === 'trello' ? 'Connecting...' : 'Connect Trello'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Getting Started Guide */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-2">Getting Started</h3>
            <ol className="text-sm text-gray-600 space-y-2 text-left">
              <li>1. Connect your Google account</li>
              <li>2. Link your Jira or Trello workspace</li>
              <li>3. Select a project or board</li>
              <li>4. Start creating reports and stories</li>
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
        <h1 className="text-2xl font-semibold text-gray-800">
          {documentData?.title || document?.title}
        </h1>
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
                initialContent={documentData.content || []}
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

      {/* AI Chatbot */}
      {documentData && (
        <StoriesChatbot
          documentId={activeDocumentId}
          documentType={documentData.document_type}
          platform={platform.name}
          projectName={project.projectName}
          onContentGenerated={handleAIContentGenerated}
        />
      )}
    </div>
  );
}