import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { taskBoards } from "@/lib/db/schema/tasky";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const userId = "user-1";

    const data = await db.select()
      .from(taskBoards)
      .where(eq(taskBoards.userId, userId))
      .orderBy(asc(taskBoards.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching task boards:", error);
    return NextResponse.json(
      { error: "Failed to fetch task boards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = "user-1";

    const [data] = await db.insert(taskBoards)
      .values({
        userId: userId,
        name: body.name,
        icon: body.icon || null,
      })
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating task board:", error);
    return NextResponse.json(
      { error: "Failed to create task board" },
      { status: 500 }
    );
  }
}
