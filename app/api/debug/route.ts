import { NextResponse } from "next/server";
import { getEnvironmentConfig } from "@/lib/environment";

export async function GET() {
  const config = getEnvironmentConfig();

  return NextResponse.json({
    config: {
      taskySupabaseUrl: config.taskySupabaseUrl ? "Present" : "Missing",
      taskySupabaseAnonKey: config.taskySupabaseAnonKey ? "Present" : "Missing",
      taskySupabaseServiceRoleKey: config.taskySupabaseServiceRoleKey
        ? "Present"
        : "Missing",
    },
    processEnv: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? "Present"
        : "Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? "Present"
        : "Missing",
      TASKY_SUPABASE_SERVICE_ROLE_KEY: process.env
        .TASKY_SUPABASE_SERVICE_ROLE_KEY
        ? "Present"
        : "Missing",
    },
  });
}
