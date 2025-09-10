import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;

export async function GET(request: NextRequest) {
  try {
    // Try multiple ways to get the token for better compatibility
    let token = request.cookies.get("adminToken")?.value;

    // Fallback: check Authorization header
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = Buffer.from(token, "base64").toString().split(":");
    const username = decoded[0];

    if (username !== ADMIN_USERNAME) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
