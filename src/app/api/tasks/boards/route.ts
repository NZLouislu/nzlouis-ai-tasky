import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/supabase-client";

export async function GET() {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const userId = "user-1";

    const { data, error } = await supabaseService
      .from("task_boards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching task boards:", error);
    return NextResponse.json(
      { error: "Failed to fetch task boards" },
      { status: 500 }
    );
  }
}

// Create a new task board
export async function POST(request: NextRequest) {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();

    // In a real implementation, you would get the user ID from the session
    // For now, we'll use a placeholder
    const userId = "user-1";

    const { data, error } = await supabaseService
      .from("task_boards")
      .insert({
        user_id: userId,
        name: body.name,
        icon: body.icon || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating task board:", error);
    return NextResponse.json(
      { error: "Failed to create task board" },
      { status: 500 }
    );
  }
}
