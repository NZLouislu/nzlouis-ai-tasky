import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-client";

// Create a child post for a blog post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { id } = await params; // This is the parent post ID
    const body = await request.json();

    // First, get the parent post to get the user_id
    const { data: parentPost, error: parentError } = await supabase
      .from("blog_posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (parentError) throw parentError;

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        user_id: parentPost.user_id,
        parent_id: id,
        title: body.title || "Untitled",
        content: body.content || null,
        icon: body.icon || null,
        cover: body.cover || null,
        published: body.published || false,
        position: body.position || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating child post:", error);
    return NextResponse.json(
      { error: "Failed to create child post" },
      { status: 500 }
    );
  }
}