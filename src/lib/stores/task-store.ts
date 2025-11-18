import { create } from 'zustand';
import { supabase } from '@/lib/supabase/supabase-client';
import type { Database } from '@/lib/supabase/supabase-client';

type TaskBoard = Database['public']['Tables']['task_boards']['Row'];
type TaskColumn = Database['public']['Tables']['task_columns']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type TaskTag = Database['public']['Tables']['task_tags']['Row'];

interface TaskState {
  boards: TaskBoard[];
  columns: TaskColumn[];
  tasks: Task[];
  tags: TaskTag[];
  isLoading: boolean;
  error: string | null;

  setBoards: (boards: TaskBoard[]) => void;
  setColumns: (columns: TaskColumn[]) => void;
  setTasks: (tasks: Task[]) => void;
  setTags: (tags: TaskTag[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Boards
  fetchBoards: (userId: string) => Promise<void>;
  createBoard: (board: Omit<TaskBoard, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateBoard: (id: string, updates: Partial<TaskBoard>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;

  // Columns
  fetchColumns: (boardId: string) => Promise<void>;
  createColumn: (column: Omit<TaskColumn, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateColumn: (id: string, updates: Partial<TaskColumn>) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;

  // Tasks
  fetchTasks: (boardId: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Tags
  fetchTags: (userId: string) => Promise<void>;
  createTag: (tag: Omit<TaskTag, 'id' | 'created_at'>) => Promise<void>;
  updateTag: (id: string, updates: Partial<TaskTag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set) => ({
  boards: [],
  columns: [],
  tasks: [],
  tags: [],
  isLoading: false,
  error: null,

  setBoards: (boards) => set({ boards }),
  setColumns: (columns) => set({ columns }),
  setTasks: (tasks) => set({ tasks }),
  setTags: (tags) => set({ tags }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchBoards: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('task_boards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ boards: data || [] });
    } catch (error) {
      console.error('Error fetching boards:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch boards' });
    } finally {
      set({ isLoading: false });
    }
  },

  createBoard: async (board) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('task_boards')
        .insert(board)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({ boards: [...state.boards, data] }));
      }
    } catch (error) {
      console.error('Error creating board:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create board' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateBoard: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('task_boards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          boards: state.boards.map(board =>
            board.id === id ? { ...board, ...data } : board
          )
        }));
      }
    } catch (error) {
      console.error('Error updating board:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update board' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteBoard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('task_boards')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        boards: state.boards.filter(board => board.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting board:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete board' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchColumns: async (boardId) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('task_columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) throw error;

      set({ columns: data || [] });
    } catch (error) {
      console.error('Error fetching columns:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch columns' });
    } finally {
      set({ isLoading: false });
    }
  },

  createColumn: async (column) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('task_columns')
        .insert(column)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({ columns: [...state.columns, data] }));
      }
    } catch (error) {
      console.error('Error creating column:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create column' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateColumn: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('task_columns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          columns: state.columns.map(column =>
            column.id === id ? { ...column, ...data } : column
          )
        }));
      }
    } catch (error) {
      console.error('Error updating column:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update column' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteColumn: async (id) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('task_columns')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        columns: state.columns.filter(column => column.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting column:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete column' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTasks: async (boardId) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('board_id', boardId)
        .order('position', { ascending: true });

      if (error) throw error;

      set({ tasks: data || [] });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch tasks' });
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (task) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({ tasks: [...state.tasks, data] }));
      }
    } catch (error) {
      console.error('Error creating task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create task' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTask: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          tasks: state.tasks.map(task =>
            task.id === id ? { ...task, ...data } : task
          )
        }));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update task' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTask: async (id) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTags: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('task_tags')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      set({ tags: data || [] });
    } catch (error) {
      console.error('Error fetching tags:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch tags' });
    } finally {
      set({ isLoading: false });
    }
  },

  createTag: async (tag) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('task_tags')
        .insert(tag)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({ tags: [...state.tags, data] }));
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to create tag' });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTag: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from('task_tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          tags: state.tags.map(tag =>
            tag.id === id ? { ...tag, ...data } : tag
          )
        }));
      }
    } catch (error) {
      console.error('Error updating tag:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to update tag' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTag: async (id) => {
    set({ isLoading: true, error: null });
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await supabase
        .from('task_tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        tags: state.tags.filter(tag => tag.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting tag:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete tag' });
    } finally {
      set({ isLoading: false });
    }
  }
}));