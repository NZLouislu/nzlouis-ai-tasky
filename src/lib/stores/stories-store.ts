import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Platform {
  id: string;
  name: 'jira' | 'trello';
  displayName: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  googleAccountEmail?: string;
  lastSyncAt?: string;
  projects: Project[];
}

export interface Project {
  id: string;
  platformProjectId: string;
  projectName: string;
  platform: 'jira' | 'trello';
  connectionStatus: 'connected' | 'disconnected' | 'error';
  googleAccountEmail: string;
  documents: Document[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  projectId: string;
  documentType: 'report' | 'stories';
  fileName: string;
  title: string;
  content: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStatus {
  isLoading: boolean;
  progress: number;
  message: string;
  error?: string;
}

interface StoriesState {
  userId: string;
  platforms: Platform[];
  activeDocumentId: string | null;
  syncStatus: SyncStatus;
  searchQuery: string;
  expandedProjects: Set<string>;
}

interface StoriesActions {
  setUserId: (userId: string) => void;
  setPlatforms: (platforms: Platform[]) => void;
  updatePlatformStatus: (platformId: string, status: 'connected' | 'disconnected' | 'error', email?: string) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  addDocument: (document: Document) => void;
  updateDocument: (documentId: string, updates: Partial<Document>) => void;
  removeDocument: (documentId: string) => void;
  createNewDocument: (platformId: string, projectId: string, documentType: 'report' | 'stories') => Document;
  setActiveDocument: (documentId: string | null) => void;
  setSyncStatus: (status: Partial<SyncStatus>) => void;
  setSearchQuery: (query: string) => void;
  toggleProjectExpansion: (projectId: string) => void;
  reset: () => void;
}

type StoriesStore = StoriesState & StoriesActions;

const initialState: StoriesState = {
  userId: "00000000-0000-0000-0000-000000000000",
  platforms: [
    {
      id: 'jira',
      name: 'jira',
      displayName: 'Jira',
      connectionStatus: 'disconnected',
      projects: []
    },
    {
      id: 'trello',
      name: 'trello',
      displayName: 'Trello',
      connectionStatus: 'disconnected',
      projects: []
    }
  ],
  activeDocumentId: null,
  syncStatus: {
    isLoading: false,
    progress: 0,
    message: ''
  },
  searchQuery: '',
  expandedProjects: new Set()
};

export const useStoriesStore = create<StoriesStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUserId: (userId: string) => {
        set({ userId });
      },

      setPlatforms: (platforms: Platform[]) => {
        set({ platforms });
      },

      updatePlatformStatus: (platformId: string, status: 'connected' | 'disconnected' | 'error', email?: string) => {
        set((state) => ({
          platforms: state.platforms.map(platform =>
            platform.id === platformId
              ? { 
                  ...platform, 
                  connectionStatus: status,
                  googleAccountEmail: email || platform.googleAccountEmail,
                  lastSyncAt: status === 'connected' ? new Date().toISOString() : platform.lastSyncAt
                }
              : platform
          )
        }));
      },

      addProject: (project: Project) => {
        set((state) => ({
          platforms: state.platforms.map(platform =>
            platform.name === project.platform
              ? { ...platform, projects: [...platform.projects, project] }
              : platform
          )
        }));
      },

      updateProject: (projectId: string, updates: Partial<Project>) => {
        set((state) => ({
          platforms: state.platforms.map(platform => ({
            ...platform,
            projects: platform.projects.map(project =>
              project.id === projectId ? { ...project, ...updates } : project
            )
          }))
        }));
      },

      removeProject: (projectId: string) => {
        set((state) => ({
          platforms: state.platforms.map(platform => ({
            ...platform,
            projects: platform.projects.filter(project => project.id !== projectId)
          }))
        }));
      },

      addDocument: (document: Document) => {
        set((state) => ({
          platforms: state.platforms.map(platform => ({
            ...platform,
            projects: platform.projects.map(project =>
              project.id === document.projectId
                ? { ...project, documents: [...project.documents, document] }
                : project
            )
          }))
        }));
      },

      updateDocument: (documentId: string, updates: Partial<Document>) => {
        set((state) => ({
          platforms: state.platforms.map(platform => ({
            ...platform,
            projects: platform.projects.map(project => ({
              ...project,
              documents: project.documents.map(document =>
                document.id === documentId ? { ...document, ...updates } : document
              )
            }))
          }))
        }));
      },

      removeDocument: (documentId: string) => {
        set((state) => ({
          platforms: state.platforms.map(platform => ({
            ...platform,
            projects: platform.projects.map(project => ({
              ...project,
              documents: project.documents.filter(document => document.id !== documentId)
            }))
          }))
        }));
      },

      createNewDocument: (platformId: string, projectId: string, documentType: 'report' | 'stories') => {
        const newDocument: Document = {
          id: crypto.randomUUID(),
          projectId,
          documentType,
          fileName: `New ${documentType === 'report' ? 'Report' : 'Stories'} ${new Date().toLocaleDateString()}`,
          title: `Untitled ${documentType === 'report' ? 'Report' : 'Stories'}`,
          content: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          platforms: state.platforms.map(platform => 
            platform.id === platformId
              ? {
                  ...platform,
                  projects: platform.projects.map(project =>
                    project.id === projectId
                      ? { ...project, documents: [...project.documents, newDocument] }
                      : project
                  )
                }
              : platform
          ),
          activeDocumentId: newDocument.id,
        }));

        // Expand the project if not already expanded
        const { expandedProjects } = get();
        if (!expandedProjects.has(projectId)) {
          set((state) => {
            const newExpanded = new Set(state.expandedProjects);
            newExpanded.add(projectId);
            return { expandedProjects: newExpanded };
          });
        }

        return newDocument;
      },

      setActiveDocument: (documentId: string | null) => {
        set({ activeDocumentId: documentId });
      },

      setSyncStatus: (status: Partial<SyncStatus>) => {
        set((state) => ({
          syncStatus: { ...state.syncStatus, ...status }
        }));
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      toggleProjectExpansion: (projectId: string) => {
        set((state) => {
          const newExpanded = new Set(state.expandedProjects);
          if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
          } else {
            newExpanded.add(projectId);
          }
          return { expandedProjects: newExpanded };
        });
      },

      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'stories-store',
      partialize: (state) => ({
        userId: state.userId,
        platforms: state.platforms,
        expandedProjects: Array.from(state.expandedProjects)
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.expandedProjects)) {
          state.expandedProjects = new Set(state.expandedProjects);
        }
      }
    }
  )
);