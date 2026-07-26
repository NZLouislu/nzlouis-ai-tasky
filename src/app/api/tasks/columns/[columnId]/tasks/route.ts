import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { tasks, taskColumns } from "@/lib/db/schema/tasky";
import { eq, asc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const { columnId } = await params;

    const data = await db.select()
      .from(tasks)
      .where(eq(tasks.columnId, columnId))
      .orderBy(asc(tasks.position));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const { columnId } = await params;
    const body = await request.json();

    const [column] = await db.select({ boardId: taskColumns.boardId })
      .from(taskColumns)
      .where(eq(taskColumns.id, columnId));

    const [data] = await db.insert(tasks)
      .values({
        boardId: column.boardId,
        columnId: columnId,
        parentId: body.parent_id || null,
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
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}