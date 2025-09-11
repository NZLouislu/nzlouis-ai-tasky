import { NextRequest, NextResponse } from "next/server";
import { blogDb } from "@/lib/supabase/blog-client";

export async function GET(request: NextRequest) {
  try {
    if (!blogDb) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await blogDb
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!blogDb) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { post_id, name, email, comment, is_anonymous } = body;

    if (!post_id || !comment) {
      return NextResponse.json(
        { error: "post_id and comment are required" },
        { status: 400 }
      );
    }

    const { data, error } = await blogDb
      .from("comments")
      .insert({
        post_id,
        name,
        email,
        comment,
        is_anonymous: is_anonymous || false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
