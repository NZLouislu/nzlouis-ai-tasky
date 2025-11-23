import { createClient } from "@supabase/supabase-js";
import {
  getTaskySupabaseConfig,
  getTaskySupabaseServiceConfig,
} from "@/lib/environment";

// Read Supabase config from environment variables
const supabaseConfig = getTaskySupabaseConfig();
const supabaseServiceConfig = getTaskySupabaseServiceConfig();

// Create client only when environment variables are properly configured
export const supabase = (() => {
  // Check if environment variables exist and are not empty
  if (!supabaseConfig.url || !supabaseConfig.anonKey) {
    console.warn(
      "Tasky Supabase configuration missing. Tasky features will be limited."
    );
    console.warn(
      "Please set correct TASKY_SUPABASE_URL and TASKY_SUPABASE_ANON_KEY in .env file"
    );
    console.warn("Current config values:", {
      url: supabaseConfig.url ? "Present" : "Missing",
      anonKey: supabaseConfig.anonKey ? "Present" : "Missing",
    });
    return null;
  }

  try {
    // Supabase client initialized successfully
    return createClient(supabaseConfig.url, supabaseConfig.anonKey);
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
})();

// Create service client for server-side operations
export const supabaseService = (() => {
  // Check if environment variables exist and are not empty
  if (!supabaseServiceConfig.url || !supabaseServiceConfig.serviceRoleKey) {
    console.warn(
      "Tasky Supabase service configuration missing. Some server-side features will be limited."
    );
    console.warn(
      "Please set correct TASKY_SUPABASE_URL and TASKY_SUPABASE_SERVICE_ROLE_KEY in .env file"
    );
    console.warn("Current service config values:", {
      url: supabaseServiceConfig.url ? "Present" : "Missing",
      serviceRoleKey: supabaseServiceConfig.serviceRoleKey
        ? "Present"
        : "Missing",
    });
    return null;
  }

  try {
    // Supabase service client initialized successfully
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
  } catch (error) {
    console.error("Failed to initialize Supabase service client:", error);
    return null;
  }
})();

// Database types for the new tables
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
          mime_type?: string | null;
          entity_type?: string | null;
          entity_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
