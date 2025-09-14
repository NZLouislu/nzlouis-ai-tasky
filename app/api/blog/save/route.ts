import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-client";

interface BlogPost {
  id: string;
  title: string;
  content: JSON | null;
  icon: string | null;
  cover: JSON | null;
}

export async function POST(request: NextRequest) {
  try {
    const { posts } = await request.json();

    if (!posts || !Array.isArray(posts)) {
      return NextResponse.json(
        { error: "Invalid posts data" },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    const userId = "00000000-0000-0000-0000-000000000000";

    const savePromises = posts.map(async (post: BlogPost) => {
      if (!supabase) {
        throw new Error("Database not configured");
      }

      const { error } = await supabase.from("blog_posts").upsert({
        id: post.id,
        user_id: userId,
        title: post.title,
        content: post.content,
        icon: post.icon,
        cover: post.cover,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`Failed to save post ${post.id}:`, error);
        throw error;
      }
    });

    await Promise.all(savePromises);

    return NextResponse.json({ success: true, saved: posts.length });
  } catch (error) {
    console.error("Beacon save error:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
