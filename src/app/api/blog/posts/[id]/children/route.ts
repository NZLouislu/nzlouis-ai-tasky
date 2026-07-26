import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { db } from '@/lib/db/connection';
import { blogPosts } from '@/lib/db/schema/tasky';


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const parent_id = (await params).id;
    const { title, user_id, icon, cover, content } = await req.json();
    let id: string;
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      id = crypto.randomUUID();
    } else {
      id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    const [post] = await db
      .insert(blogPosts)
      .values({
        id,
        userId: user_id,
        title,
        parentId: parent_id,
        icon: icon || null,
        cover: cover || null,
        content: content || [],
      })
      .returning();

    return NextResponse.json({ success: true, id, post });
  } catch (error) {
    console.error("Error creating child post:", error);
    return NextResponse.json({ error: "Failed to create child post" }, { status: 500 });
  }
}
