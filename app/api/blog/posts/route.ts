import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-client";

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const userId = "user-1";

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// Create a new blog post
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();

    const userId = "user-1";

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        user_id: userId,
        parent_id: body.parent_id || null,
        title: body.title || "Untitled",
        content: body.content || null,
        icon: body.icon || null,
        cover: body.cover || null,
        published: body.published || false,
        position: body.position || null,
      })
      .select();

    if (error) throw error;

    // Check if any rows were inserted
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Failed to create blog post" },
        { status: 500 }
      );
    }

    // Return the first (and should be only) created post
    const createdPost = data[0];

    return NextResponse.json(createdPost);
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
