import { NextResponse } from "next/server";
import { db } from '@/lib/db/connection';
import { featureToggles } from '@/lib/db/schema/blog';

export async function GET() {
  try {
    const data = await db
      .select()
      .from(featureToggles)
      .limit(1);

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
