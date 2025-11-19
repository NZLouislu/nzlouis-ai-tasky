"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import StoriesSidebar from "./StoriesSidebar";
import StoriesContent from "./StoriesContent";
import StoriesChatbotPanel from "./StoriesChatbotPanel";
import StoriesWelcome from "./StoriesWelcome";
import JiraConnectDialog, { JiraCredentials } from "./JiraConnectDialog";
import JiraProjectSelectDialog from "./JiraProjectSelectDialog";
import TrelloConnectDialog, { TrelloCredentials, TrelloBoard } from "./TrelloConnectDialog";
import TrelloBoardSelectDialog from "./TrelloBoardSelectDialog";
import { useStoriesStore } from "@/lib/stores/stories-store";

interface PageModification {
  type: string;
  target?: string;
  content?: string;
  title?: string;
  position?: number;
  paragraphIndex?: number;
}

export default function StoriesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [chatbotWidth, setChatbotWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const [showJiraConnectDialog, setShowJiraConnectDialog] = useState(false);
  const [showJiraProjectDialog, setShowJiraProjectDialog] = useState(false);
  const [showTrelloConnectDialog, setShowTrelloConnectDialog] = useState(false);
  const [showTrelloBoardDialog, setShowTrelloBoardDialog] = useState(false);
  const [trelloBoards, setTrelloBoards] = useState<TrelloBoard[]>([]);

  const { setUserId, userId, activeDocumentId, platforms, updateDocument } = useStoriesStore();
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(600);

  const reloadProjects = async () => {
    try {
      const response = await fetch('/api/stories/projects');
      const result = await response.json();

      if (result.success && result.projects) {
        const platformsMap = new Map<string, any>();
        
        platformsMap.set('jira', {
          id: 'jira',
          name: 'jira' as const,
          displayName: 'Jira',
          connectionStatus: 'disconnected' as const,
          projects: []
        });
        
        platformsMap.set('trello', {
          id: 'trello',
          name: 'trello' as const,
          displayName: 'Trello',
          connectionStatus: 'disconnected' as const,
          projects: []
        });

        for (const project of result.projects) {
          const platformData = platformsMap.get(project.platform);
          if (platformData) {
            platformData.connectionStatus = project.connection_status;
            platformData.googleAccountEmail = project.google_account_email;
            
            platformData.projects.push({
              id: project.id,
              platformProjectId: project.platform_project_id,
              projectName: project.project_name,
              platform: project.platform,
              connectionStatus: project.connection_status,
              googleAccountEmail: project.google_account_email,
              documents: (project.stories_documents || []).map((doc: any) => ({
                id: doc.id,
                projectId: doc.project_id,
                documentType: doc.document_type,
                fileName: doc.file_name,
                title: doc.title,
                content: doc.content,
                lastSyncedAt: doc.last_synced_at,
                createdAt: doc.created_at,
                updatedAt: doc.updated_at,
              })),
              createdAt: project.created_at,
              updatedAt: project.updated_at,
            });
          }
        }

        const { setPlatforms } = useStoriesStore.getState();
        setPlatforms(Array.from(platformsMap.values()));
      }
    } catch (error) {
      console.error('Failed to reload projects:', error);
    }
  };

  const handleJiraConnect = async (credentials: JiraCredentials) => {
    try {
      const response = await fetch('/api/stories/jira/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          jiraProjectKey: 'TEMP',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowJiraProjectDialog(true);
      } else {
        throw new Error(result.error || 'Failed to connect to Jira');
      }
    } catch (error) {
      console.error('Failed to connect to Jira:', error);
      throw error;
    }
  };

  const handleJiraProjectSelect = async (projectKey: string, projectName: string) => {
    try {
      const response = await fetch('/api/stories/jira/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectKey,
          projectName,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await reloadProjects();
      } else {
        throw new Error(result.error || 'Failed to add project');
      }
    } catch (error) {
      console.error('Failed to add Jira project:', error);
      throw error;
    }
  };

  const handleTrelloConnect = async (credentials: TrelloCredentials) => {
    try {
      const response = await fetch('/api/stories/trello/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trelloKey: credentials.trelloKey,
          trelloToken: credentials.trelloToken,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setTrelloBoards(result.boards || []);
        setShowTrelloBoardDialog(true);
      } else {
        throw new Error(result.error || 'Failed to connect to Trello');
      }
    } catch (error) {
      console.error('Failed to connect to Trello:', error);
      throw error;
    }
  };

  const handleTrelloBoardSelect = async (boardId: string, boardName: string) => {
    try {
      const selectedBoard = trelloBoards.find(board => board.id === boardId);
      if (!selectedBoard) {
        throw new Error('Selected board not found');
      }

      const response = await fetch('/api/stories/trello/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trelloKey: process.env.NEXT_PUBLIC_TRELLO_KEY,
          trelloToken: process.env.NEXT_PUBLIC_TRELLO_TOKEN,
          trelloBoardId: boardId,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await reloadProjects();
        setShowTrelloBoardDialog(false);
      } else {
        throw new Error(result.error || 'Failed to connect to board');
      }
    } catch (error) {
      console.error('Failed to connect to Trello board:', error);
      throw error;
    }
  };

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log("✅ Admin session detected, using admin-user-id");
          setUserId('admin-user-id');
          setIsAdmin(true);
          setIsCheckingAdmin(false);
          return;
        }
      } catch (error) {
        console.log("No admin session found");
      }
      setIsCheckingAdmin(false);
    };

    checkAdminSession();
  }, [setUserId]);

  useEffect(() => {
    if (isCheckingAdmin) return;

    console.log("Session status:", sessionStatus);
    console.log("Session data:", session);
    console.log("Current userId:", userId);

    if (session?.user?.id && userId !== session.user.id && userId !== 'admin-user-id') {
      console.log("✅ Setting userId from NextAuth session:", session.user.id);
      setUserId(session.user.id);
    } else if (userId === "00000000-0000-0000-0000-000000000000") {
      console.warn("⚠️ No valid user ID available. User may need to log in.");
      console.warn("Session status:", sessionStatus);
    } else {
      console.log("✅ Using existing userId:", userId);
    }
  }, [session, userId, setUserId, sessionStatus, isCheckingAdmin]);

  useEffect(() => {
    const loadProjects = async () => {
      if (!userId || userId === "00000000-0000-0000-0000-000000000000") return;

      try {
        const response = await fetch('/api/stories/projects');
        const result = await response.json();

        if (result.success && result.projects) {
          const platformsMap = new Map<string, any>();
          
          platformsMap.set('jira', {
            id: 'jira',
            name: 'jira' as const,
            displayName: 'Jira',
            connectionStatus: 'disconnected' as const,
            projects: []
          });
          
          platformsMap.set('trello', {
            id: 'trello',
            name: 'trello' as const,
            displayName: 'Trello',
            connectionStatus: 'disconnected' as const,
            projects: []
          });

          for (const project of result.projects) {
            const platformData = platformsMap.get(project.platform);
            if (platformData) {
              platformData.connectionStatus = project.connection_status;
              platformData.googleAccountEmail = project.google_account_email;
              
              platformData.projects.push({
                id: project.id,
                platformProjectId: project.platform_project_id,
                projectName: project.project_name,
                platform: project.platform,
                connectionStatus: project.connection_status,
                googleAccountEmail: project.google_account_email,
                documents: (project.stories_documents || []).map((doc: any) => ({
                  id: doc.id,
                  projectId: doc.project_id,
                  documentType: doc.document_type,
                  fileName: doc.file_name,
                  title: doc.title,
                  content: doc.content,
                  lastSyncedAt: doc.last_synced_at,
                  createdAt: doc.created_at,
                  updatedAt: doc.updated_at,
                })),
                createdAt: project.created_at,
                updatedAt: project.updated_at,
              });
            }
          }

          const { setPlatforms } = useStoriesStore.getState();
          setPlatforms(Array.from(platformsMap.values()));
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };

    loadProjects();
  }, [userId]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = chatbotWidth;
  }, [chatbotWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    const deltaX = resizeStartX.current - e.clientX;
    const newWidth = Math.max(300, Math.min(800, resizeStartWidth.current + deltaX));
    setChatbotWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  }, [isMobile, sidebarOpen, sidebarCollapsed]);

  const getActiveDocument = useCallback(() => {
    for (const platform of platforms) {
      for (const project of platform.projects) {
        const document = project.documents.find(doc => doc.id === activeDocumentId);
        if (document) {
          return { document, project, platform };
        }
      }
    }
    return null;
  }, [platforms, activeDocumentId]);

  const handlePageModification = useCallback(
    async (mod: PageModification): Promise<string> => {
      const instruction = typeof mod === 'string' ? mod : mod.content || mod.title || '';
      try {
        const activeData = getActiveDocument();
        if (!activeData) {
          return "❌ Error: No active document found";
        }

        const { document } = activeData;
        console.log("Requesting AI modification for document:", activeDocumentId);
        console.log("Instruction:", instruction);

        if (!instruction || instruction.trim().length < 5) {
          return "⚠️ Please provide a more detailed instruction (at least 5 characters).";
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          console.log("Sending request to /api/stories/ai-modify");
          
          const currentContent = document.content || '';
          const currentTitle = document.title || 'Untitled';

          console.log("Request body:", {
            documentId: activeDocumentId,
            currentContent,
            currentTitle,
            instruction: instruction.trim(),
          });

          const response = await fetch('/api/stories/ai-modify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              documentId: activeDocumentId,
              currentContent,
              currentTitle,
              instruction: instruction.trim(),
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          console.log("Response status:", response.status);

          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error("Non-JSON response:", text);
            throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
          }

          const data = await response.json();
          console.log("AI response data:", data);

          if (!response.ok) {
            const errorMsg = data.error || 'Failed to get AI modifications';
            const details = data.details || '';
            return `❌ Error: ${errorMsg}${details ? '\n' + details : ''}\n\nTips:\n- Try a simpler request\n- Check your API quota\n- Wait a moment and try again`;
          }

          if (!data.modifications || data.modifications.length === 0) {
            const message = data.message || 'No modifications were generated.';
            return `⚠️ ${message}\n\nSuggestions:\n- Be more specific (e.g., "Add a paragraph about...")\n- Try shorter instructions\n- Simplify your request\n- Make sure the document has some content`;
          }

          console.log("Applying modifications:", data.modifications);
          let appliedCount = 0;

          for (const modification of data.modifications) {
            try {
              await applyModification(modification, data.explanation);
              appliedCount++;
            } catch (modError) {
              console.error("Failed to apply modification:", modError);
            }
          }

          if (appliedCount === 0) {
            return "⚠️ Modifications were generated but failed to apply. Please try again.";
          }

          return `✅ Successfully applied ${appliedCount} modification(s)!\n\n${data.explanation || ''}\n\n💡 AI-modified content has been added to your document.`;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            return "⏱️ Request timed out. The AI is taking too long to respond.\n\nTry:\n- Simplifying your request\n- Breaking it into smaller parts\n- Waiting a moment and trying again";
          }
          throw fetchError;
        }
      } catch (error) {
        console.error("Error applying AI modification:", error);
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        return `❌ Error: ${errorMsg}\n\nPlease try again with a simpler request.`;
      }
    },
    [activeDocumentId, platforms, getActiveDocument]
  );

  // Helper function to replace a specific paragraph/section in content
  const replaceParagraphInContent = useCallback((content: string, target: string, newContent: string): string => {
    if (!content || !target) return content;
    
    const lines = content.split('\n');
    let sectionStart = -1;
    let sectionEnd = -1;
    
    // Find the target section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase().includes(target.toLowerCase()) && 
          (line.startsWith('#') || line.startsWith('##') || line.startsWith('###'))) {
        sectionStart = i;
        break;
      }
    }
    
    if (sectionStart === -1) {
      // If section not found, append the new content
      return content ? `${content}\n\n${newContent}` : newContent;
    }
    
    // Find the end of the section (next header or end of content)
    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#') && !line.startsWith('####')) {
        sectionEnd = i;
        break;
      }
    }
    
    if (sectionEnd === -1) {
      sectionEnd = lines.length;
    }
    
    // Replace the section
    const beforeSection = lines.slice(0, sectionStart);
    const afterSection = lines.slice(sectionEnd);
    const newContentLines = newContent.split('\n');
    
    return [...beforeSection, ...newContentLines, ...afterSection].join('\n');
  }, []);

  const applyModification = useCallback(
    async (mod: PageModification, explanation?: string) => {
      const activeData = getActiveDocument();
      if (!activeData) return;

      const { document } = activeData;
      let newContent = Array.isArray(document.content) ? document.content.join('\n') : (document.content || '');

      switch (mod.type) {
        case 'update_title':
          if (mod.title && activeDocumentId) {
            updateDocument(activeDocumentId, { title: mod.title });
          }
          break;
        case 'replace':
          if (mod.content) {
            newContent = mod.content;
          }
          break;
        case 'append':
          if (mod.content) {
            newContent = newContent ? `${newContent}\n\n${mod.content}` : mod.content;
          }
          break;
        case 'add_section':
          if (mod.content) {
            newContent = newContent ? `${newContent}\n\n${mod.content}` : mod.content;
          }
          break;
        case 'replace_paragraph':
          if (mod.content && mod.target) {
            // Find and replace the target section/paragraph
            newContent = replaceParagraphInContent(newContent, mod.target, mod.content);
          }
          break;
        default:
          console.warn('Unknown modification type:', mod.type);
          break;
      }

      const originalContent = Array.isArray(document.content) ? document.content.join('\n') : document.content;
      if (newContent !== originalContent && activeDocumentId) {
        updateDocument(activeDocumentId, { content: newContent });
      }
    },
    [activeDocumentId, getActiveDocument, updateDocument, replaceParagraphInContent]
  );

  const existingJiraProjectKeys = React.useMemo(() => {
    const jiraPlatform = platforms.find((p) => p.name === 'jira');
    return jiraPlatform?.projects.map((proj) => proj.platformProjectId) || [];
  }, [platforms]);

  if (sessionStatus === "loading" || isCheckingAdmin) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <StoriesSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobile={isMobile}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {!activeDocumentId ? (
          <StoriesWelcome
            onConnectJira={() => setShowJiraConnectDialog(true)}
            onConnectTrello={() => setShowTrelloConnectDialog(true)}
          />
        ) : (
          <StoriesContent />
        )}
      </div>

      <StoriesChatbotPanel
        isVisible={isChatbotVisible}
        isMobile={isMobile}
        width={chatbotWidth}
        onClose={() => setIsChatbotVisible(false)}
        onToggleSidebar={() => {
          setSidebarOpen(true);
          setSidebarCollapsed(false);
        }}
        onMouseDown={handleMouseDown}
        onPageModification={handlePageModification}
        documentId={activeDocumentId || undefined}
        userId={userId}
      />

      <JiraConnectDialog
        isOpen={showJiraConnectDialog}
        onClose={() => setShowJiraConnectDialog(false)}
        onConnect={handleJiraConnect}
      />
      
      <JiraProjectSelectDialog
        isOpen={showJiraProjectDialog}
        onClose={() => setShowJiraProjectDialog(false)}
        onSelectProject={handleJiraProjectSelect}
        existingProjectKeys={existingJiraProjectKeys}
      />
      
      <TrelloConnectDialog
        isOpen={showTrelloConnectDialog}
        onClose={() => setShowTrelloConnectDialog(false)}
        onConnect={handleTrelloConnect}
      />
      
      <TrelloBoardSelectDialog
        isOpen={showTrelloBoardDialog}
        onClose={() => setShowTrelloBoardDialog(false)}
        onSelect={handleTrelloBoardSelect}
        boards={trelloBoards}
      />
    </div>
  );
}
