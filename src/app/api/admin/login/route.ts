import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    console.log('[Admin Login] Login attempt received');

    if (!username || !password) {
      console.log('[Admin Login] Missing credentials in request');
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check if environment variables are set
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
      console.error('[Admin Login] Environment variables not configured properly', {
        hasAdminUsername: !!ADMIN_USERNAME,
        hasAdminPassword: !!ADMIN_PASSWORD
      });
      return NextResponse.json(
        { error: "Server configuration error - admin credentials not set" },
        { status: 500 }
      );
    }

    console.log('[Admin Login] Checking credentials', {
      providedUsername: username,
      expectedUsername: ADMIN_USERNAME,
      hasPassword: !!password,
      hasExpectedPassword: !!ADMIN_PASSWORD
    });

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      console.log('[Admin Login] Invalid credentials provided', {
        usernameMatch: username === ADMIN_USERNAME,
        passwordMatch: password === ADMIN_PASSWORD
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");
    console.log('[Admin Login] Authentication successful, setting cookie');

    const response = NextResponse.json({
      token,
      message: "Login successful",
    });

    response.cookies.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    console.log('[Admin Login] Admin session cookie set');
    return response;
  } catch (error) {
    console.error('[Admin Login] Unexpected error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}