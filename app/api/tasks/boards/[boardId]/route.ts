import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/supabase-client";

// Get a specific task board
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
      .from("task_boards")
      .select("*")
      .eq("id", boardId)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching task board:", error);
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }
}

// Update a task board
export async function PUT(
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
      .from("task_boards")
      .update({
        name: body.name,
        icon: body.icon,
      })
      .eq("id", boardId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating task board:", error);
    return NextResponse.json(
      { error: "Failed to update task board" },
      { status: 500 }
    );
  }
}

// Delete a task board
export async function DELETE(
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

    const { error } = await supabaseService
      .from("task_boards")
      .delete()
      .eq("id", boardId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task board:", error);
    return NextResponse.json(
      { error: "Failed to delete task board" },
      { status: 500 }
    );
  }
}