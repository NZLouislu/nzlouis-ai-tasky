import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-client";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;

// Authentication helper function
async function verifyAuth(request: NextRequest): Promise<boolean> {
  try {
    let token = request.cookies.get("adminToken")?.value;

    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return false;
    }

    const decoded = Buffer.from(token, "base64").toString().split(":");
    const username = decoded[0];

    return username === ADMIN_USERNAME;
  } catch (error) {
    console.error("Auth verification error:", error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    // Get userId from request, use default value if not present
    const url = new URL(request.url);
    const userId =
      url.searchParams.get("userId") || "00000000-0000-0000-0000-000000000000";

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// Create a new blog post
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Get userId from request body, use default value if not present
    const userId = body.userId || "00000000-0000-0000-0000-000000000000";

    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        user_id: userId,
        parent_id: body.parent_id || null,
        title: body.title || "Untitled",
        content: body.content || null,
        icon: body.icon || null,
        cover: body.cover || null,
        published: body.published || false,
        position: body.position || null,
      })
      .select();

    if (error) throw error;

    // Check if any rows were inserted
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Failed to create blog post" },
        { status: 500 }
      );
    }

    // Return the first (and should be only) created post
    const createdPost = data[0];

    return NextResponse.json(createdPost);
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
