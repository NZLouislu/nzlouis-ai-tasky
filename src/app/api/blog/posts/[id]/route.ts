import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { blogPosts } from "@/lib/db/schema/tasky";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(blogPosts)
      .set({
        title: body.title,
        content: body.content,
        icon: body.icon,
        cover: body.cover,
        published: body.published,
        position: body.position,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Post not found or not updated" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
