import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/supabase-client";

// Get all columns for a task board
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { boardId } = await params;

    const { data, error } = await supabaseService
      .from("task_columns")
      .select("*")
      .eq("board_id", boardId)
      .order("position", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching task columns:", error);
    return NextResponse.json(
      { error: "Failed to fetch task columns" },
      { status: 500 }
    );
  }
}

// Create a new column in a task board
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { boardId } = await params;
    const body = await request.json();

    const { data, error } = await supabaseService
      .from("task_columns")
      .insert({
        board_id: boardId,
        name: body.name,
        position: body.position || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating task column:", error);
    return NextResponse.json(
      { error: "Failed to create task column" },
      { status: 500 }
    );
  }
}