import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-client";

// Create a child page for a workspace page
export async function POST(
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

    const { id } = await params; // This is the parent page ID
    const body = await request.json();

    const { data: parentPage, error: parentError } = await supabase
      .from("workspace_pages")
      .select("workspace_id")
      .eq("id", id)
      .single();

    if (parentError) throw parentError;

    const { data, error } = await supabase
      .from("workspace_pages")
      .insert({
        workspace_id: parentPage.workspace_id,
        parent_id: id,
        title: body.title || "Untitled",
        content: body.content || null,
        icon: body.icon || null,
        cover: body.cover || null,
        position: body.position || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating child page:", error);
    return NextResponse.json(
      { error: "Failed to create child page" },
      { status: 500 }
    );
  }
}
