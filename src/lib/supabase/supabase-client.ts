import { createClient } from "@supabase/supabase-js";
import {
  getTaskySupabaseConfig,
  getTaskySupabaseServiceConfig,
} from "@/lib/environment";

const supabaseConfig = getTaskySupabaseConfig();
const supabaseServiceConfig = getTaskySupabaseServiceConfig();

export const supabase = (() => {
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    return null;
  }

  try {
    return createClient(supabaseConfig.url, supabaseConfig.anonKey);
  } catch {
    return null;
  }
})();

export const supabaseService = (() => {
  if (!supabaseServiceConfig.url || !supabaseServiceConfig.serviceRoleKey) {
    return null;
  }

  try {
    return createClient(
      supabaseServiceConfig.url,
      supabaseServiceConfig.serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );
  } catch {
    return null;
  }
})();

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspaces: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_pages: {
        Row: {
          id: string;
          workspace_id: string;
          parent_id: string | null;
          title: string;
          content: JSON | null;
          icon: string | null;
          cover: JSON | null;
          position: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          parent_id?: string | null;
          title?: string;
          content?: JSON | null;
          icon?: string | null;
          cover?: JSON | null;
          position?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          parent_id?: string | null;
          title?: string;
          content?: JSON | null;
          icon?: string | null;
          cover?: JSON | null;
          position?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          user_id: string;
          parent_id: string | null;
          title: string;
          content: JSON | null;
          icon: string | null;
          cover: JSON | null;
          published: boolean;
          position: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          parent_id?: string | null;
          title?: string;
          content?: JSON | null;
          icon?: string | null;
          cover?: JSON | null;
          published?: boolean;
          position?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          parent_id?: string | null;
          title?: string;
          content?: JSON | null;
          icon?: string | null;
          cover?: JSON | null;
          published?: boolean;
          position?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_boards: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_columns: {
        Row: {
          id: string;
          board_id: string;
          name: string;
          position: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          name: string;
          position?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          name?: string;
          position?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          board_id: string;
          column_id: string | null;
          parent_id: string | null;
          title: string;
          description: string | null;
          position: number | null;
          due_date: string | null;
          completed: boolean;
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          column_id?: string | null;
          parent_id?: string | null;
          title: string;
          description?: string | null;
          position?: number | null;
          due_date?: string | null;
          completed?: boolean;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          column_id?: string | null;
          parent_id?: string | null;
          title?: string;
          description?: string | null;
          position?: number | null;
          due_date?: string | null;
          completed?: boolean;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_tags: {
        Row: {
          id: string;
          name: string;
          color: string | null;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string | null;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string | null;
          user_id?: string;
          created_at?: string;
        };
      };
      task_tag_assignments: {
        Row: {
          task_id: string;
          tag_id: string;
        };
        Insert: {
          task_id: string;
          tag_id: string;
        };
        Update: {
          task_id?: string;
          tag_id?: string;
        };
      };
      storage_files: {
        Row: {
          id: string;
          user_id: string;
          bucket_name: string;
          file_path: string;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          entity_type: string | null;
          entity_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bucket_name: string;
          file_path: string;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bucket_name?: string;
          file_path?: string;
          file_name?: string;
          file_size?: number | null;
          mime_type?: number | null;
          entity_type?: string | null;
          entity_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
