import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { workspaces } from "@/lib/db/schema/tasky";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const userId = "user-1";

    const data = await db.select()
      .from(workspaces)
      .where(eq(workspaces.userId, userId))
      .orderBy(asc(workspaces.createdAt));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const userId = "user-1";

    const [data] = await db.insert(workspaces)
      .values({
        userId: userId,
        name: body.name,
        icon: body.icon || null,
      })
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}
