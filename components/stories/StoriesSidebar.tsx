"use client";
import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Search, Plus, X } from "lucide-react";
import { useStoriesStore } from "@/lib/stores/stories-store";

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
    setActiveDocument
  } = useStoriesStore();

  const [searchFocused, setSearchFocused] = useState(false);

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

  if (isMobile && !isOpen) {
    return null;
  }

  return (
    <>
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
                            className="w-full flex items-center justify-between p-3 pl-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              {expandedProjects.has(project.id) ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="text-sm text-gray-700 truncate">
                                {project.projectName}
                              </span>
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

                  {platform.connectionStatus === 'connected' && (
                    <div className="pl-8 pb-2">
                      <button className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>New Project</span>
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