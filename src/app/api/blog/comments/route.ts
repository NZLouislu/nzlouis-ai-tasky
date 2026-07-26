import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { comments } from "@/lib/db/schema/blog";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const data = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt));

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
    const body = await request.json();
    const { post_id, name, email, comment, is_anonymous } = body;

    if (!post_id || !comment) {
      return NextResponse.json(
        { error: "post_id and comment are required" },
        { status: 400 }
      );
    }

    const [data] = await db
      .insert(comments)
      .values({
        postId: post_id,
        name,
        email,
        comment,
        isAnonymous: is_anonymous || false,
      })
      .returning();

    if (!data) {
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    const createdComment = data;

    return NextResponse.json(createdComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
