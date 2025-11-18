import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/supabase-client";

// Get all tasks for a column
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { columnId } = await params;

    const { data, error } = await supabaseService
      .from("tasks")
      .select("*")
      .eq("column_id", columnId)
      .order("position", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// Create a new task in a column
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ columnId: string }> }
) {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { columnId } = await params;
    const body = await request.json();

    // First, get the column to get the board_id
    const { data: column, error: columnError } = await supabaseService
      .from("task_columns")
      .select("board_id")
      .eq("id", columnId)
      .single();

    if (columnError) throw columnError;

    const { data, error } = await supabaseService
      .from("tasks")
      .insert({
        board_id: column.board_id,
        column_id: columnId,
        parent_id: body.parent_id || null,
        title: body.title,
        description: body.description || null,
        position: body.position || null,
        due_date: body.due_date || null,
        completed: body.completed || false,
        priority: body.priority || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}