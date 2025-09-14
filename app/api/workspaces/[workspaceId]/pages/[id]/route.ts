import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-client";

// Get a specific workspace page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from("workspace_pages")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching workspace page:", error);
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
}

// Update a workspace page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from("workspace_pages")
      .update({
        title: body.title,
        content: body.content,
        icon: body.icon,
        cover: body.cover,
        position: body.position,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating workspace page:", error);
    return NextResponse.json(
      { error: "Failed to update workspace page" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { id } = await params;

    const { error } = await supabase
      .from("workspace_pages")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workspace page:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace page" },
      { status: 500 }
    );
  }
}
