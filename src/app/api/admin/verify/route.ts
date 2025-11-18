import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get("admin-session")?.value;

    if (!token) {
      token = request.cookies.get("adminToken")?.value;
    }

    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      console.log('[Admin Verify] No token found in cookies or Authorization header');
      return NextResponse.json({ 
        authenticated: false, 
        error: "No authentication token provided" 
      }, { status: 401 });
    }

    // Check if ADMIN_USERNAME is configured
    if (!ADMIN_USERNAME) {
      console.error('[Admin Verify] ADMIN_USERNAME environment variable not set');
      return NextResponse.json({ 
        authenticated: false, 
        error: "Server configuration error" 
      }, { status: 500 });
    }

    const decoded = Buffer.from(token, "base64").toString().split(":");
    const username = decoded[0];

    if (!username) {
      console.log('[Admin Verify] Invalid token format');
      return NextResponse.json({ 
        authenticated: false, 
        error: "Invalid token format" 
      }, { status: 401 });
    }

    if (username !== ADMIN_USERNAME) {
      console.log(`[Admin Verify] Username mismatch. Expected: ${ADMIN_USERNAME}, Got: ${username}`);
      return NextResponse.json({ 
        authenticated: false, 
        error: "Invalid credentials" 
      }, { status: 401 });
    }

    console.log(`[Admin Verify] Authentication successful for user: ${username}`);
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("[Admin Verify] Verification error:", error);
    return NextResponse.json({ 
      authenticated: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}