import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/supabase-client";

// Create a subtask for a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    if (!supabaseService) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { taskId } = await params; // This is the parent task ID
    const body = await request.json();

    // First, get the parent task to get the board_id
    const { data: parentTask, error: parentError } = await supabaseService
      .from("tasks")
      .select("board_id, column_id")
      .eq("id", taskId)
      .single();

    if (parentError) throw parentError;

    const { data, error } = await supabaseService
      .from("tasks")
      .insert({
        board_id: parentTask.board_id,
        column_id: parentTask.column_id,
        parent_id: taskId,
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
    console.error("Error creating subtask:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
}