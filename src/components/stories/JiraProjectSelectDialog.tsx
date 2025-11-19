"use client";
import React, { useState, useEffect } from "react";
import { X, Search, Plus, ExternalLink, CheckCircle2 } from "lucide-react";

interface JiraProject {
  id: string;
  key: string;
  name: string;
  description: string;
  projectTypeKey: string;
  lead: string;
  avatarUrls?: {
    "48x48"?: string;
  };
}

interface JiraProjectSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectKey: string, projectName: string) => Promise<void>;
  existingProjectKeys?: string[];
}

export default function JiraProjectSelectDialog({
  isOpen,
  onClose,
  onSelectProject,
  existingProjectKeys = [],
}: JiraProjectSelectDialogProps) {
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const sortedAndFilteredProjects = React.useMemo(() => {
    const filtered = searchQuery 
      ? projects.filter(
          (project) =>
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.key.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : projects;
    
    const normalizedExistingKeys = existingProjectKeys.map(k => k.toUpperCase());
    
    console.log('Existing project keys:', existingProjectKeys);
    console.log('Normalized existing keys:', normalizedExistingKeys);
    console.log('All projects:', filtered.map(p => ({ key: p.key, name: p.name })));
    
    const unselected = filtered.filter(
      (p) => !normalizedExistingKeys.includes(p.key.toUpperCase())
    );
    const selected = filtered.filter((p) =>
      normalizedExistingKeys.includes(p.key.toUpperCase())
    );
    
    console.log('Unselected projects:', unselected.map(p => p.key));
    console.log('Selected projects:', selected.map(p => p.key));
    
    return [...unselected, ...selected];
  }, [searchQuery, projects, existingProjectKeys]);

  const loadProjects = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/stories/jira/projects");
      const result = await response.json();

      if (result.success) {
        setProjects(result.projects || []);
      } else {
        setError(result.error || "Failed to load projects");
      }
    } catch (err) {
      setError("Failed to load Jira projects");
      console.error("Load projects error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = async (project: JiraProject) => {
    if (existingProjectKeys.some(k => k.toUpperCase() === project.key.toUpperCase())) {
      return;
    }

    setIsSelecting(true);
    setError("");
    try {
      await onSelectProject(project.key, project.name);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project");
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCreateNewProject = () => {
    setShowInstructions(true);
  };

  const openJiraInNewTab = () => {
    window.open("https://www.atlassian.com/software/jira", "_blank");
  };

  if (!isOpen) return null;

  if (showInstructions) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              How to Create a New Jira Project
            </h2>
            <button
              onClick={() => setShowInstructions(false)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Step-by-Step Guide
              </h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      Log in to Jira
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Go to your Jira instance and log in with your credentials.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      Navigate to Projects
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Click on <strong>"Projects"</strong> in the top navigation
                      bar, then select <strong>"Create project"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      Choose a Template
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Select a project template that fits your needs (e.g.,
                      Scrum, Kanban, Bug tracking).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      Configure Project Details
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Enter your project name, key (e.g., PROJ), and other
                      details. The project key will be used to connect to this
                      app.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                    5
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      Create the Project
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Click <strong>"Create"</strong> to finalize your project.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                    6
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">
                      Connect to This App
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      After creating the project, return to this dialog and
                      refresh the project list. Your new project should appear
                      and you can select it to connect.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">
                  💡 Quick Tip
                </h4>
                <p className="text-sm text-blue-700">
                  Make sure you have the necessary permissions to create
                  projects in your Jira instance. If you don't see the "Create
                  project" option, contact your Jira administrator.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex space-x-3">
            <button
              onClick={openJiraInNewTab}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Jira</span>
            </button>
            <button
              onClick={() => setShowInstructions(false)}
              className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Select Jira Project
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleCreateNewProject}
            className="w-full flex items-center justify-center space-x-2 p-2 border border-dashed border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project in Jira</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading projects...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={loadProjects}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : sortedAndFilteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery
                  ? "No projects found matching your search"
                  : "No projects available"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedAndFilteredProjects.map((project) => {
                const isAlreadyConnected = existingProjectKeys.some(
                  k => k.toUpperCase() === project.key.toUpperCase()
                );
                
                return (
                  <button
                    key={project.id}
                    onClick={() => handleSelectProject(project)}
                    disabled={isSelecting || isAlreadyConnected}
                    className={`w-full p-4 border rounded-lg text-left transition-colors ${
                      isAlreadyConnected
                        ? 'border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {project.avatarUrls?.["48x48"] && (
                        <img
                          src={project.avatarUrls["48x48"]}
                          alt={project.name}
                          className="w-10 h-10 rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-medium truncate ${isAlreadyConnected ? 'text-gray-500' : 'text-gray-800'}`}>
                            {project.name}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded ${isAlreadyConnected ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-600'}`}>
                            {project.key}
                          </span>
                          {isAlreadyConnected && (
                            <span className="flex items-center text-xs text-green-600">
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Connected
                            </span>
                          )}
                        </div>
                        {project.description && (
                          <p className={`text-sm mt-1 line-clamp-2 ${isAlreadyConnected ? 'text-gray-400' : 'text-gray-600'}`}>
                            {project.description}
                          </p>
                        )}
                        {project.lead && (
                          <p className={`text-xs mt-1 ${isAlreadyConnected ? 'text-gray-400' : 'text-gray-500'}`}>
                            Lead: {project.lead}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={openJiraInNewTab}
            className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Jira</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            disabled={isSelecting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
