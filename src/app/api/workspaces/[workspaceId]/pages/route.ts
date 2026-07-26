import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { workspacePages } from "@/lib/db/schema/tasky";
import { eq, asc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;

    const data = await db.select()
      .from(workspacePages)
      .where(eq(workspacePages.workspaceId, workspaceId))
      .orderBy(asc(workspacePages.position));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching workspace pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace pages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { workspaceId } = await params;
    const body = await request.json();

    const [data] = await db.insert(workspacePages)
      .values({
        workspaceId: workspaceId,
        parentId: body.parent_id || null,
        title: body.title || "Untitled",
        content: body.content || null,
        icon: body.icon || null,
        cover: body.cover || null,
        position: body.position || null,
      })
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating workspace page:", error);
    return NextResponse.json(
      { error: "Failed to create workspace page" },
      { status: 500 }
    );
  }
}