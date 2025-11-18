import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-client";

// Get all pages for a workspace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { workspaceId } = await params;

    const { data, error } = await supabase
      .from("workspace_pages")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("position", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching workspace pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace pages" },
      { status: 500 }
    );
  }
}

// Create a new page in a workspace
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { workspaceId } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from("workspace_pages")
      .insert({
        workspace_id: workspaceId,
        parent_id: body.parent_id || null,
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
    console.error("Error creating workspace page:", error);
    return NextResponse.json(
      { error: "Failed to create workspace page" },
      { status: 500 }
    );
  }
}