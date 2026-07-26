import { createClient } from "@supabase/supabase-js";
import { getBlogSupabaseConfig } from "@/lib/environment";

const supabaseConfig = getBlogSupabaseConfig();

export const blogDb = (() => {
  if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
    return null;
  }

  try {
    return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch {
    return null;
  }
})();

export const testBlogDbConnection = async () => {
  if (!blogDb) {
    return false;
  }

  try {
    const { error } = await blogDb
      .from("feature_toggles")
      .select("*")
      .limit(1);
    if (error) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export type Database = {
  public: {
    Tables: {
      feature_toggles: {
        Row: {
          id: string;
          total_views: boolean;
          total_likes: boolean;
          total_comments: boolean;
          ai_summaries: boolean;
          ai_questions: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          total_views?: boolean;
          total_likes?: boolean;
          total_comments?: boolean;
          ai_summaries?: boolean;
          ai_questions?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          total_views?: boolean;
          total_likes?: boolean;
          total_comments?: boolean;
          ai_summaries?: boolean;
          ai_questions?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          name: string | null;
          email: string | null;
          comment: string;
          is_anonymous: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          name?: string | null;
          email?: string | null;
          comment: string;
          is_anonymous?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          name?: string | null;
          email?: string | null;
          comment?: string;
          is_anonymous?: boolean;
          created_at?: string;
        };
      };
      post_stats: {
        Row: {
          id: string;
          post_id: string;
          title: string;
          views: number;
          likes: number;
          ai_questions: number;
          ai_summaries: number;
        };
        Insert: {
          id?: string;
          post_id: string;
          title?: string;
          views?: number;
          likes?: number;
          ai_questions?: number;
          ai_summaries?: number;
        };
        Update: {
          id?: string;
          post_id?: string;
          title?: string;
          views?: number;
          likes?: number;
          ai_questions?: number;
          ai_summaries?: number;
        };
      };
      daily_stats: {
        Row: {
          id: string;
          post_id: string;
          date: string;
          views: number;
          likes: number;
          ai_questions: number;
          ai_summaries: number;
        };
        Insert: {
          id?: string;
          post_id: string;
          date: string;
          views?: number;
          likes?: number;
          ai_questions?: number;
          ai_summaries?: number;
        };
        Update: {
          id?: string;
          post_id?: string;
          date?: string;
          views?: number;
          likes?: number;
          ai_questions?: number;
          ai_summaries?: number;
        };
      };
    };
  };
};
