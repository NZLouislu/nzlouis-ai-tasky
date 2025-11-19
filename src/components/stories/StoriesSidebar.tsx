"use client";
import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Search, Plus, X, HelpCircle } from "lucide-react";
import { useStoriesStore } from "@/lib/stores/stories-store";
import { useSession } from "next-auth/react";
import JiraConnectDialog, { JiraCredentials } from "./JiraConnectDialog";
import JiraProjectSelectDialog from "./JiraProjectSelectDialog";
import TrelloConnectDialog, { TrelloCredentials } from "./TrelloConnectDialog";
import TrelloBoardSelectDialog from "./TrelloBoardSelectDialog";

interface StoriesSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
}

export default function StoriesSidebar({ 
  isOpen, 
  isCollapsed, 
  onToggle, 
  isMobile 
}: StoriesSidebarProps) {
  const {
    platforms,
    searchQuery,
    setSearchQuery,
    expandedProjects,
    toggleProjectExpansion,
    activeDocumentId,
    setActiveDocument,
    createNewDocument,
    addProject,
    updatePlatformStatus
  } = useStoriesStore();

  const { data: session } = useSession();
  const [searchFocused, setSearchFocused] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [showJiraConnectDialog, setShowJiraConnectDialog] = useState(false);
  const [showJiraProjectDialog, setShowJiraProjectDialog] = useState(false);
  const [showTrelloConnectDialog, setShowTrelloConnectDialog] = useState(false);
  const [showTrelloBoardDialog, setShowTrelloBoardDialog] = useState(false);
  const [showTrelloHelpDialog, setShowTrelloHelpDialog] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      (e.target as HTMLInputElement).blur();
    }
  };

  const filteredPlatforms = platforms.map(platform => ({
    ...platform,
    projects: platform.projects.filter(project =>
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.documents.some(doc => 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }));

  const getConnectionStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'disconnected':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case 'error':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const handlePlatformClick = (platform: any) => {
    if (platform.connectionStatus === 'disconnected') {
      console.log(`Connecting to ${platform.displayName}...`);
    }
  };

  const handleDocumentClick = (documentId: string) => {
    setActiveDocument(documentId);
  };

  const handleNewProject = (platformId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) {
      console.error('Platform not found:', platformId);
      return;
    }
    
    if (platform.connectionStatus !== 'connected') {
      alert(`Please connect to ${platform.displayName} first.`);
      return;
    }
    
    if (platformId === 'jira') {
      setShowJiraProjectDialog(true);
    } else if (platformId === 'trello') {
      const trelloPlatform = platforms.find(p => p.id === 'trello');
      const hasBoards = trelloPlatform && trelloPlatform.projects.length > 0;
      
      if (hasBoards) {
        setShowTrelloBoardDialog(true);
      } else {
        setShowTrelloHelpDialog(true);
      }
    }
  };

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

  const handleConnectPlatform = async (platformName: 'jira' | 'trello', e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!session?.user?.email) {
      alert('Please log in first');
      return;
    }

    if (platformName === 'jira') {
      setShowJiraConnectDialog(true);
    } else if (platformName === 'trello') {
      setShowTrelloConnectDialog(true);
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
        updatePlatformStatus('jira', 'connected', session?.user?.email || undefined);
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
      const response = await fetch('/api/stories/trello/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          trelloBoardId: 'TEMP',
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        updatePlatformStatus('trello', 'connected', session?.user?.email || undefined);
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
      const response = await fetch('/api/stories/trello/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId,
          boardName,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        await reloadProjects();
      } else {
        throw new Error(result.error || 'Failed to add board');
      }
    } catch (error) {
      console.error('Failed to add Trello board:', error);
      throw error;
    }
  };

  const existingJiraProjectKeys = React.useMemo(() => {
    const jiraPlatform = platforms.find((p) => p.name === 'jira');
    const keys = jiraPlatform?.projects.map((proj) => proj.platformProjectId) || [];
    return keys;
  }, [platforms]);

  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <>
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
        onSelectBoard={handleTrelloBoardSelect}
      />

      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}
      
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${isMobile ? 'z-50' : 'z-10'}
        h-full bg-white border-r border-gray-200 flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed && !isMobile ? 'w-16' : 'w-80'}
        ${isMobile && !isOpen ? 'translate-x-full' : 'translate-x-0'}
      `}>
        
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold -gray-800">Stories</h2>
          )}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            {isMobile ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronRight className={`w-5 h-5 text-gray-600 transition-transform ${
                isCollapsed ? 'rotate-0' : 'rotate-180'
              }`} />
            )}
          </button>
        </div>

        {!isCollapsed && (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className={`relative ${searchFocused ? 'ring-2 ring-blue-500' : ''} rounded-md`}>
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects and documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredPlatforms.map((platform) => (
                <div key={platform.id} className="border-b border-gray-100">
                  <button
                    onClick={() => handlePlatformClick(platform)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {getConnectionStatusIcon(platform.connectionStatus)}
                      <span className="font-medium text-gray-800">
                        {platform.displayName}
                      </span>
                    </div>
                    {platform.googleAccountEmail && (
                      <span className="text-xs text-gray-500 truncate max-w-32">
                        {platform.googleAccountEmail}
                      </span>
                    )}
                  </button>

                  {platform.projects.length > 0 && (
                    <div className="pl-4">
                      {platform.projects.map((project) => (
                        <div key={project.id} className="border-l border-gray-200">
                          <button
                            onClick={() => toggleProjectExpansion(project.id)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer transition-colors">
                              <div className="flex items-center space-x-2">
                                {expandedProjects.has(project.id) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                                <span className="font-medium truncate">{project.projectName}</span>
                              </div>
                            </button>

                            {expandedProjects.has(project.id) && (
                              <div className="pl-8">
                                {project.documents.map((document) => (
                                  <button
                                    key={document.id}
                                    onClick={() => handleDocumentClick(document.id)}
                                    className={`w-full text-left p-2 text-sm hover:bg-gray-50 transition-colors rounded-md mx-2 my-1 ${
                                      activeDocumentId === document.id 
                                        ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500' 
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    <div className="truncate">{document.title}</div>
                                    <div className="text-xs text-gray-400 truncate">
                                      {document.fileName}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                      ))}
                    </div>
                  )}

                  {platform.connectionStatus === 'disconnected' && (
                    <div className="pl-8 pb-2 pt-2">
                      <button 
                        onClick={(e) => handleConnectPlatform(platform.name, e)}
                        disabled={connectingPlatform === platform.name}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 disabled:text-blue-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{connectingPlatform === platform.name ? 'Connecting...' : `Connect ${platform.displayName}`}</span>
                      </button>
                    </div>
                  )}
                  
                  {platform.connectionStatus === 'connected' && (
                    <div className="pl-8 pb-2">
                      <button 
                        onClick={(e) => handleNewProject(platform.id, e)}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{platform.name === 'trello' ? 'Add Board' : 'New Project'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {searchQuery && filteredPlatforms.every(p => p.projects.length === 0) && (
                <div className="p-4 text-center text-gray-500">
                  <p>No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </>
        )}

        {isCollapsed && (
          <div className="flex-1 flex flex-col items-center py-4 space-y-4">
            {platforms.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformClick(platform)}
                className="relative p-2 hover:bg-gray-100 rounded-md transition-colors"
                title={`${platform.displayName} - ${platform.connectionStatus}`}
              >
                {getConnectionStatusIcon(platform.connectionStatus)}
                <span className="sr-only">{platform.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function TrelloHelpDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const handleGoToTrello = () => {
    window.open('https://trello.com/', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Add Your First Trello Board</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            It looks like you haven't added any Trello boards yet. To get started:
          </p>
          
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Go to Trello and create a new board</li>
            <li>Add some cards or lists to your board</li>
            <li>Return here to select your board</li>
          </ol>
          
          <div className="flex items-center p-4 bg-blue-50 rounded-md mt-4">
            <HelpCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              You need at least one board with content in Trello before you can select it here.
            </p>
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGoToTrello}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              Go to Trello
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
