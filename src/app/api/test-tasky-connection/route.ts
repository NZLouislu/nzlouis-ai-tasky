import { NextResponse } from "next/server";
import { db } from '@/lib/db/connection';
import { blogPosts } from '@/lib/db/schema/tasky';

export async function GET() {
  try {
    const data = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        userId: blogPosts.userId,
        createdAt: blogPosts.createdAt,
      })
      .from(blogPosts)
      .limit(5);

    return NextResponse.json({
      success: true,
      message: "Connection successful",
      postsCount: data?.length || 0,
      posts: data,
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
        anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Connection test failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
