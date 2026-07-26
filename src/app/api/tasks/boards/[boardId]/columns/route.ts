import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { taskColumns } from "@/lib/db/schema/tasky";
import { eq, asc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    const data = await db.select()
      .from(taskColumns)
      .where(eq(taskColumns.boardId, boardId))
      .orderBy(asc(taskColumns.position));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching task columns:", error);
    return NextResponse.json(
      { error: "Failed to fetch task columns" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body = await request.json();

    const [data] = await db.insert(taskColumns)
      .values({
        boardId: boardId,
        name: body.name,
        position: body.position || null,
      })
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating task column:", error);
    return NextResponse.json(
      { error: "Failed to create task column" },
      { status: 500 }
    );
  }
}