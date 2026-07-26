import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { workspacePages } from "@/lib/db/schema/tasky";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [data] = await db.select()
      .from(workspacePages)
      .where(eq(workspacePages.id, id));

    if (!data) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching workspace page:", error);
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [data] = await db.update(workspacePages)
      .set({
        title: body.title,
        content: body.content,
        icon: body.icon,
        cover: body.cover,
        position: body.position,
      })
      .where(eq(workspacePages.id, id))
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating workspace page:", error);
    return NextResponse.json(
      { error: "Failed to update workspace page" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(workspacePages)
      .where(eq(workspacePages.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workspace page:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace page" },
      { status: 500 }
    );
  }
}
