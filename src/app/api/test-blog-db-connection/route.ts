import { NextResponse } from "next/server";
import { blogDb } from "@/lib/supabase/blog-client";

export async function GET() {
  try {
    if (!blogDb) {
      return NextResponse.json(
        { error: "Blog database client is not initialized" },
        { status: 500 }
      );
    }

    // Test database connection
    const { data, error } = await blogDb
      .from("feature_toggles")
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
      message: "Blog database connection successful",
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
