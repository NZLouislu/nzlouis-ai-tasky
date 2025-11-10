import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBlogSupabaseConfig } from "@/lib/environment";

// Create Blog Supabase client
const blogConfig = getBlogSupabaseConfig();
const blogSupabase = blogConfig.url && blogConfig.serviceRoleKey
  ? createClient(blogConfig.url, blogConfig.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
  : null;

export async function GET() {
  try {
    if (!blogSupabase) {
      return NextResponse.json(
        { error: "Blog database not configured" },
        { status: 500 }
      );
    }

    const { data: users, error } = await blogSupabase
      .from("posts")
      .select("user_id")
      .limit(10);

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const uniqueUserIds = [...new Set(users?.map(post => post.user_id) || [])];

    return NextResponse.json({
      userIds: uniqueUserIds,
      count: uniqueUserIds.length
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}