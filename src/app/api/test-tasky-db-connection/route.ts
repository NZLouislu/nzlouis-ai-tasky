import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/supabase-client";

export async function GET() {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: "Tasky database client is not initialized" },
        { status: 500 }
      );
    }

    // Test database connection
    const { data, error } = await supabaseService
      .from("blog_posts")
      .select("*")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { error: "Database connection failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tasky database connection successful",
      data: data || [],
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error: "Database connection test failed",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
