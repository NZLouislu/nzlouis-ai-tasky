import { NextResponse } from "next/server";
import { db } from '@/lib/db/connection';
import { blogPosts } from '@/lib/db/schema/tasky';

export async function GET() {
  try {
    const data = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .limit(1);

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      details: {
        urlPresent: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKeyPresent: !!process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY,
      },
    });
  }
}
