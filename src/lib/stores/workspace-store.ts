import { create } from 'zustand';
import { supabase } from '@/lib/supabase/supabase-client';
import type { Database } from '@/lib/supabase/supabase-client';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type WorkspacePage = Database['public']['Tables']['workspace_pages']['Row'];

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

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
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
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

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
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('workspaces')
        .insert(workspace)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({ workspaces: [...state.workspaces, data] }));
      }
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
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          workspaces: state.workspaces.map(workspace =>
            workspace.id === id ? { ...workspace, ...data } : workspace
          )
        }));
      }
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
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

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
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('workspace_pages')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: true });

      if (error) throw error;

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
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('workspace_pages')
        .insert(page)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({ pages: [...state.pages, data] }));
      }
    } catch (error) {
      console.error('Error creating page:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create page' });
    } finally {
      set({ isLoading: false });
    }
  },

  updatePage: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('workspace_pages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          pages: state.pages.map(page =>
            page.id === id ? { ...page, ...data } : page
          )
        }));
      }
    } catch (error) {
      console.error('Error updating page:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update page' });
    } finally {
      set({ isLoading: false });
    }
  },

  deletePage: async (id) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('workspace_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

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