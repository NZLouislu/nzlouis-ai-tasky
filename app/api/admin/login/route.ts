import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = Buffer.from(`${username}:${Date.now()}`).toString("base64");

    const response = NextResponse.json({
      token,
      message: "Login successful",
    });

    response.cookies.set("adminToken", token, {
      httpOnly: true,
      secure: false, // Allow non-HTTPS for development
      sameSite: "lax", // More permissive for embedded browsers
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/", // Ensure cookie is available site-wide
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
