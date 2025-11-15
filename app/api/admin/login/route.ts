import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    console.log('[Admin Login] Attempt:', { username, hasPassword: !!password });
    console.log('[Admin Login] Expected:', { 
      username: ADMIN_USERNAME, 
      hasPassword: !!ADMIN_PASSWORD 
    });

    if (!username || !password) {
      console.log('[Admin Login] Missing credentials');
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      console.log('[Admin Login] Invalid credentials', {
        usernameMatch: username === ADMIN_USERNAME,
        passwordMatch: password === ADMIN_PASSWORD
      });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");
    console.log('[Admin Login] Success, setting cookie');

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

    console.log('[Admin Login] Cookie set, returning response');
    return response;
  } catch (error) {
    console.error("[Admin Login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
