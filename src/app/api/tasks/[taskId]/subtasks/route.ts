import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { tasks } from "@/lib/db/schema/tasky";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const body = await request.json();

    const [parentTask] = await db.select({ boardId: tasks.boardId, columnId: tasks.columnId })
      .from(tasks)
      .where(eq(tasks.id, taskId));

    const [data] = await db.insert(tasks)
      .values({
        boardId: parentTask.boardId,
        columnId: parentTask.columnId,
        parentId: taskId,
        title: body.title,
        description: body.description || null,
        position: body.position || null,
        dueDate: body.due_date || null,
        completed: body.completed || false,
        priority: body.priority || 0,
      })
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating subtask:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
}