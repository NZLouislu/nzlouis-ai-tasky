import { NextResponse } from "next/server";
import { db } from '@/lib/db/connection';
import { blogPosts } from '@/lib/db/schema/tasky';

export async function GET() {
  try {
    const data = await db
      .select({ userId: blogPosts.userId })
      .from(blogPosts)
      .limit(10);

    const uniqueUserIds = [...new Set(data?.map(post => post.userId) || [])];

    return NextResponse.json({
      userIds: uniqueUserIds,
      count: uniqueUserIds.length
    });

  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
