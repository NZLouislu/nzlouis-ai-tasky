import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_ROLE_KEY = process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: "Missing Supabase configuration",
        details: {
          urlPresent: !!SUPABASE_URL,
          serviceRoleKeyPresent: !!SERVICE_ROLE_KEY,
        },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: {
          urlPresent: !!SUPABASE_URL,
          serviceRoleKeyPresent: !!SERVICE_ROLE_KEY,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      data: data,
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
    });
  }
}
