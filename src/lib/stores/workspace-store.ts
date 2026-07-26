import { create } from 'zustand';

interface Workspace {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
interface WorkspacePage {
  id: string;
  workspace_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  pages: WorkspacePage[];
  currentWorkspaceId: string | null;
  isLoading: boolean;
  error: string | null;

  setWorkspaces: (workspaces: Workspace[]) => void;
  setPages: (pages: WorkspacePage[]) => void;
  setCurrentWorkspace: (workspaceId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Workspaces
  fetchWorkspaces: (userId: string) => Promise<void>;
  createWorkspace: (workspace: Omit<Workspace, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;

  // Pages
  fetchPages: (workspaceId: string) => Promise<void>;
  createPage: (page: Omit<WorkspacePage, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePage: (id: string, updates: Partial<WorkspacePage>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>()((set, get) => ({
  workspaces: [],
  pages: [],
  currentWorkspaceId: null,
  isLoading: false,
  error: null,

  setWorkspaces: (workspaces) => set({ workspaces }),
  setPages: (pages) => set({ pages }),
  setCurrentWorkspace: (workspaceId) => set({ currentWorkspaceId: workspaceId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchWorkspaces: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/workspaces?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch workspaces');
      const data = await response.json();
      set({ workspaces: data || [] });
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch workspaces' });
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkspace: async (workspace) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspace),
      });
      if (!response.ok) throw new Error('Failed to create workspace');
      const data = await response.json();
      set((state) => ({ workspaces: [...state.workspaces, data] }));
    } catch (error) {
      console.error('Error creating workspace:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create workspace' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateWorkspace: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update workspace');
      const data = await response.json();
      set((state) => ({
        workspaces: state.workspaces.map(workspace =>
          workspace.id === id ? { ...workspace, ...data } : workspace
        )
      }));
    } catch (error) {
      console.error('Error updating workspace:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update workspace' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteWorkspace: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete workspace');
      set((state) => ({
        workspaces: state.workspaces.filter(workspace => workspace.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting workspace:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete workspace' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPages: async (workspaceId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/pages`);
      if (!response.ok) throw new Error('Failed to fetch pages');
      const data = await response.json();
      set({ pages: data || [] });
    } catch (error) {
      console.error('Error fetching pages:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch pages' });
    } finally {
      set({ isLoading: false });
    }
  },

  createPage: async (page) => {
    set({ isLoading: true, error: null });
    const workspaceId = get().currentWorkspaceId;
    if (!workspaceId) {
      set({ error: 'No workspace selected', isLoading: false });
      return;
    }
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(page),
      });
      if (!response.ok) throw new Error('Failed to create page');
      const data = await response.json();
      set((state) => ({ pages: [...state.pages, data] }));
    } catch (error) {
      console.error('Error creating page:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create page' });
    } finally {
      set({ isLoading: false });
    }
  },

  updatePage: async (id, updates) => {
    set({ isLoading: true, error: null });
    const workspaceId = get().currentWorkspaceId;
    if (!workspaceId) {
      set({ error: 'No workspace selected', isLoading: false });
      return;
    }
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update page');
      const data = await response.json();
      set((state) => ({
        pages: state.pages.map(page =>
          page.id === id ? { ...page, ...data } : page
        )
      }));
    } catch (error) {
      console.error('Error updating page:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update page' });
    } finally {
      set({ isLoading: false });
    }
  },

  deletePage: async (id) => {
    set({ isLoading: true, error: null });
    const workspaceId = get().currentWorkspaceId;
    if (!workspaceId) {
      set({ error: 'No workspace selected', isLoading: false });
      return;
    }
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/pages/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete page');
      set((state) => ({
        pages: state.pages.filter(page => page.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting page:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete page' });
    } finally {
      set({ isLoading: false });
    }
  }
}));
