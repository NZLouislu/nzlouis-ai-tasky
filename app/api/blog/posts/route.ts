import { NextRequest, NextResponse } from "next/server";
import { blogDb } from "@/lib/supabase/blog-client";

export async function GET() {
  try {
    if (!blogDb) {
      return NextResponse.json(
        { error: "Blog service is not configured" },
        { status: 503 }
      );
    }

    const { data: posts, error } = await blogDb
      .from("post_stats")
      .select("*")
      .order("views", { ascending: false });

    if (error) throw error;

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!blogDb) {
      return NextResponse.json(
        { error: "Blog service is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { post_id, title } = body;

    if (!post_id || !title) {
      return NextResponse.json(
        { error: "post_id and title are required" },
        { status: 400 }
      );
    }

    const { data, error } = await blogDb
      .from("post_stats")
      .insert({
        post_id,
        title,
        views: 0,
        likes: 0,
        ai_questions: 0,
        ai_summaries: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
