import { NextResponse } from "next/server";
import { getGoogleConfig } from "@/lib/environment";

export async function GET() {
  const googleConfig = getGoogleConfig();

  return NextResponse.json({
    google: googleConfig.apiKey || null,
  });
}
