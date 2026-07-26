import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { taskColumns } from "@/lib/db/schema/tasky";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const { columnId } = await params;

    const [data] = await db.select()
      .from(taskColumns)
      .where(eq(taskColumns.id, columnId));

    if (!data) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching task column:", error);
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const { columnId } = await params;
    const body = await request.json();

    const [data] = await db.update(taskColumns)
      .set({
        name: body.name,
        position: body.position,
      })
      .where(eq(taskColumns.id, columnId))
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating task column:", error);
    return NextResponse.json(
      { error: "Failed to update task column" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    const { columnId } = await params;

    await db.delete(taskColumns)
      .where(eq(taskColumns.id, columnId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task column:", error);
    return NextResponse.json(
      { error: "Failed to delete task column" },
      { status: 500 }
    );
  }
}