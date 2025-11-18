import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/supabase-client";

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Supabase client not initialized",
          config: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Present" : "Missing",
            anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing"
          }
        },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, user_id, created_at")
      .limit(5);

    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          details: error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Connection successful",
      postsCount: data?.length || 0,
      posts: data,
      config: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + "...",
        anonKeyPresent: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Connection test failed",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}