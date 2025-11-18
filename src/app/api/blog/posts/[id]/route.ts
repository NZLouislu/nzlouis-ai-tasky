import { NextRequest, NextResponse } from "next/server";
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

// Get a specific blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!blogSupabase) {
      return NextResponse.json(
        { error: "Blog database not configured" },
        { status: 503 }
      );
    }

    const { id } = await params;

    const { data, error } = await blogSupabase
      .from("posts")
      .select("*")
      .eq("id", id);

    if (error) throw error;

    // Check if post exists
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Return the first (and should be only) post
    const post = data[0];

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}

// Update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!blogSupabase) {
      return NextResponse.json(
        { error: "Blog database not configured" },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const { data, error } = await blogSupabase
      .from("posts")
      .update({
        title: body.title,
        content: body.content,
        icon: body.icon,
        cover: body.cover,
        published: body.published,
        position: body.position,
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    // Check if any rows were updated
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Post not found or not updated" },
        { status: 404 }
      );
    }

    // Return the first (and should be only) updated post
    const updatedPost = data[0];
    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

// Delete a blog post
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!blogSupabase) {
      return NextResponse.json(
        { error: "Blog database not configured" },
        { status: 503 }
      );
    }

    const id = (await params).id;
    const { error } = await blogSupabase.from("posts").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
