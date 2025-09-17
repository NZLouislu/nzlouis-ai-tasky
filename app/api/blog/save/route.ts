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

interface BlogPost {
  id: string;
  title: string;
  content: JSON | null;
  icon: string | null;
  cover: JSON | null;
  parent_id?: string | null;
}

interface BlogPostNode {
  id: string;
  title: string;
  content: JSON | null;
  icon: string | null;
  cover: JSON | null;
  children?: BlogPostNode[];
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    if (!(await verifyAuth(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { posts, userId } = await request.json();

    if (!posts || typeof posts !== "object") {
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

    // Extract userId from request body, use default value if not present
    const userIdToUse = userId || "00000000-0000-0000-0000-000000000000";

    // flatten posts tree to flat array with parent_id
    function flattenPosts(
      nodes: BlogPostNode[],
      parent_id: string | null = null
    ): BlogPost[] {
      let result: BlogPost[] = [];
      for (const post of nodes) {
        const { children, ...rest } = post;
        result.push({ ...rest, parent_id } as BlogPost);
        if (children && Array.isArray(children)) {
          result = result.concat(flattenPosts(children, post.id));
        }
      }
      return result;
    }
    const flatPosts = flattenPosts(posts);

    const savePromises = flatPosts.map(async (post: BlogPost) => {
      if (!supabase) {
        throw new Error("Database not configured");
      }
      const { error } = await supabase.from("blog_posts").upsert({
        id: post.id,
        user_id: userIdToUse,
        title: post.title,
        content: post.content,
        icon: post.icon,
        cover: post.cover,
        parent_id: post.parent_id ?? null,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.error(`Failed to save post ${post.id}:`, error);
        throw error;
      }
    });

    await Promise.all(savePromises);
    return NextResponse.json({ success: true, saved: flatPosts.length });
  } catch (error) {
    console.error("Beacon save error:", error);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
