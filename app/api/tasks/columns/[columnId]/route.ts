import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/supabase-client";

// Get a specific task column
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
      .from("task_columns")
      .select("*")
      .eq("id", columnId)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching task column:", error);
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }
}

// Update a task column
export async function PUT(
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

    const { data, error } = await supabaseService
      .from("task_columns")
      .update({
        name: body.name,
        position: body.position,
      })
      .eq("id", columnId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating task column:", error);
    return NextResponse.json(
      { error: "Failed to update task column" },
      { status: 500 }
    );
  }
}

// Delete a task column
export async function DELETE(
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

    const { error } = await supabaseService
      .from("task_columns")
      .delete()
      .eq("id", columnId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task column:", error);
    return NextResponse.json(
      { error: "Failed to delete task column" },
      { status: 500 }
    );
  }
}