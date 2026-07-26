import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { workspacePages } from "@/lib/db/schema/tasky";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [parentPage] = await db.select({ workspaceId: workspacePages.workspaceId })
      .from(workspacePages)
      .where(eq(workspacePages.id, id));

    const [data] = await db.insert(workspacePages)
      .values({
        workspaceId: parentPage.workspaceId,
        parentId: id,
        title: body.title || "Untitled",
        content: body.content || null,
        icon: body.icon || null,
        cover: body.cover || null,
        position: body.position || null,
      })
      .returning();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating child page:", error);
    return NextResponse.json(
      { error: "Failed to create child page" },
      { status: 500 }
    );
  }
}
