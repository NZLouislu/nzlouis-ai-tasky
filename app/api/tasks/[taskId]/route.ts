import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/supabase-client";

// Get a specific task
export async function GET(
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

    const { taskId } = await params;

    const { data, error } = await supabaseService
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}

// Update a task
export async function PUT(
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

    const { taskId } = await params;
    const body = await request.json();

    const { data, error } = await supabaseService
      .from("tasks")
      .update({
        column_id: body.column_id,
        parent_id: body.parent_id,
        title: body.title,
        description: body.description,
        position: body.position,
        due_date: body.due_date,
        completed: body.completed,
        priority: body.priority,
      })
      .eq("id", taskId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// Delete a task
export async function DELETE(
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

    const { taskId } = await params;

    const { error } = await supabaseService
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}