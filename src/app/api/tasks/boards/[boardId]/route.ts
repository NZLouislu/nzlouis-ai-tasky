import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { taskBoards } from "@/lib/db/schema/tasky";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    const [data] = await db.select()
      .from(taskBoards)
      .where(eq(taskBoards.id, boardId));

    if (!data) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching task board:", error);
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body = await request.json();

    const [data] = await db.update(taskBoards)
      .set({
        name: body.name,
        icon: body.icon,
      })
      .where(eq(taskBoards.id, boardId))
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating task board:", error);
    return NextResponse.json(
      { error: "Failed to update task board" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    await db.delete(taskBoards)
      .where(eq(taskBoards.id, boardId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task board:", error);
    return NextResponse.json(
      { error: "Failed to delete task board" },
      { status: 500 }
    );
  }
}