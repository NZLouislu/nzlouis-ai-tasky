import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { tasks } from "@/lib/db/schema/tasky";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    const [data] = await db.select()
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!data) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();

    const [data] = await db.update(tasks)
      .set({
        columnId: body.column_id,
        parentId: body.parent_id,
        title: body.title,
        description: body.description,
        position: body.position,
        dueDate: body.due_date,
        completed: body.completed,
        priority: body.priority,
      })
      .where(eq(tasks.id, taskId))
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    await db.delete(tasks)
      .where(eq(tasks.id, taskId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}