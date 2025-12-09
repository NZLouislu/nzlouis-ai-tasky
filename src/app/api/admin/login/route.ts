import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import {
  checkRateLimit,
  recordLoginAttempt,
  getBackoffDelay,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Read environment variables inside the function for testability
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // Kept for backward compatibility
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
    
    const { username, password } = await request.json();

    // Get client identifier for rate limiting
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const identifier = `${clientIP}:${username || "unknown"}`;

    console.log(`[Admin Login] Attempt from IP: ${clientIP}, Username: ${username}`);

    // 1. Check rate limit
    const rateLimit = checkRateLimit(identifier);

    if (!rateLimit.allowed) {
      const blockedMinutes = rateLimit.blockedUntil
        ? Math.ceil((rateLimit.blockedUntil - Date.now()) / 60000)
        : 0;

      console.warn(`[Admin Login] Rate limit exceeded for ${clientIP}`);

      return NextResponse.json(
        {
          error: `Too many failed attempts. Please try again in ${blockedMinutes} minutes.`,
          remainingAttempts: 0,
          blockedUntil: rateLimit.blockedUntil,
        },
        { status: 429 }
      );
    }

    // 2. Validate input
    if (!username || !password) {
      console.log("[Admin Login] Missing credentials in request");
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // 3. Check environment variables
    if (!ADMIN_USERNAME) {
      console.error("[Admin Login] ADMIN_USERNAME not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD) {
      console.error("[Admin Login] Neither ADMIN_PASSWORD_HASH nor ADMIN_PASSWORD is set");
      return NextResponse.json(
        { error: "Server configuration error - admin credentials not set" },
        { status: 500 }
      );
    }

    // 4. Verify username
    if (username !== ADMIN_USERNAME) {
      // Add delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 1000));

      recordLoginAttempt(identifier, false);

      console.log(`[Admin Login] Invalid username: ${username} from ${clientIP}`);

      return NextResponse.json(
        {
          error: "Invalid credentials",
          remainingAttempts: rateLimit.remainingAttempts - 1,
        },
        { status: 401 }
      );
    }

    // 5. Verify password (bcrypt or fallback to plain text)
    let isPasswordValid = false;

    if (ADMIN_PASSWORD_HASH) {
      // Use bcrypt verification (secure)
      isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      console.log("[Admin Login] Using bcrypt password verification");
    } else if (ADMIN_PASSWORD) {
      // Fallback to plain text comparison (insecure, for backward compatibility)
      isPasswordValid = password === ADMIN_PASSWORD;
      console.warn(
        "[Admin Login] ⚠️  Using plain text password comparison. Please migrate to ADMIN_PASSWORD_HASH!"
      );
    }

    if (!isPasswordValid) {
      recordLoginAttempt(identifier, false);

      // Progressive delay based on attempt count
      const currentAttempts = 5 - rateLimit.remainingAttempts + 1;
      const delay = getBackoffDelay(currentAttempts);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(
        `[Admin Login] Invalid password for ${username} from ${clientIP}, attempt ${currentAttempts}/5`
      );

      return NextResponse.json(
        {
          error: "Invalid credentials",
          remainingAttempts: rateLimit.remainingAttempts - 1,
        },
        { status: 401 }
      );
    }

    // 6. Login successful - clear rate limit
    recordLoginAttempt(identifier, true);

    // Generate token with expiration time
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const token = Buffer.from(`${username}:${expiresAt}`).toString("base64");

    console.log(
      `[Admin Login] ✅ Successful login for ${username} from ${clientIP}, expires at ${new Date(expiresAt).toISOString()}`
    );

    const response = NextResponse.json({
      message: "Login successful",
      expiresAt: new Date(expiresAt).toISOString(),
    });

    // Set secure cookie
    response.cookies.set("admin-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Admin Login] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}