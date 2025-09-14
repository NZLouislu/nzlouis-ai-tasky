import { createClient } from "@supabase/supabase-js";
import { getBlogSupabaseConfig } from "@/lib/environment";

// Read Supabase config from environment variables
const supabaseConfig = getBlogSupabaseConfig();

// Create client only when environment variables are properly configured
export const blogDb = (() => {
  // Check if environment variables exist and are not empty
  if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
    console.warn(
      "Blog Supabase configuration missing. Blog features will be limited."
    );
    console.warn(
      "Please set correct BLOG_SUPABASE_URL and BLOG_SUPABASE_SERVICE_ROLE_KEY in .env file"
    );
    return null;
  }

  try {
    return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return null;
  }
})();

// Add a function to test the connection
export const testBlogDbConnection = async () => {
  if (!blogDb) {
    console.error("Blog database client is not initialized");
    return false;
  }

  try {
    const { data, error } = await blogDb
      .from("feature_toggles")
      .select("*")
      .limit(1);
    if (error) {
      console.error("Blog database connection test failed:", error);
      return false;
    }
    console.log("Blog database connection test successful", data);
    return true;
  } catch (error) {
    console.error("Blog database connection test failed:", error);
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
