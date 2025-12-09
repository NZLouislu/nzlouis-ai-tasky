import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Read environment variable inside the function for testability
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
    
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
      return NextResponse.json(
        {
          authenticated: false,
          error: "No authentication token provided",
        },
        { status: 401 }
      );
    }

    // Check if ADMIN_USERNAME is configured
    if (!ADMIN_USERNAME) {
      console.error("[Admin Verify] ADMIN_USERNAME environment variable not set");
      return NextResponse.json(
        {
          authenticated: false,
          error: "Server configuration error",
        },
        { status: 500 }
      );
    }

    // Decode and parse token
    const decoded = Buffer.from(token, "base64").toString().split(":");
    const username = decoded[0];
    const expiresAtStr = decoded[1];

    // Validate token format
    if (!username) {
      console.log("[Admin Verify] Invalid token format - missing username");
      return NextResponse.json(
        {
          authenticated: false,
          error: "Invalid token format",
        },
        { status: 401 }
      );
    }

    // Verify username
    if (username !== ADMIN_USERNAME) {
      console.log(`[Admin Verify] Username mismatch. Expected: ${ADMIN_USERNAME}, Got: ${username}`);
      return NextResponse.json(
        {
          authenticated: false,
          error: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // Verify token expiration (if timestamp exists)
    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr);

      if (isNaN(expiresAt)) {
        console.log("[Admin Verify] Invalid token format - invalid expiration timestamp");
        return NextResponse.json(
          {
            authenticated: false,
            error: "Invalid token format",
          },
          { status: 401 }
        );
      }

      const now = Date.now();

      // Check if token has expired
      if (now > expiresAt) {
        const expiredDate = new Date(expiresAt).toISOString();
        console.log(`[Admin Verify] Token expired at: ${expiredDate}`);
        return NextResponse.json(
          {
            authenticated: false,
            error: "Session expired, please login again",
            expiredAt: expiredDate,
          },
          { status: 401 }
        );
      }

      // Calculate remaining time
      const timeLeft = expiresAt - now;
      const hoursLeft = timeLeft / (60 * 60 * 1000);

      // Warn if token is expiring soon
      if (hoursLeft < 2) {
        console.log(`[Admin Verify] ⚠️  Token expiring soon: ${hoursLeft.toFixed(1)} hours left`);
      }

      console.log(
        `[Admin Verify] ✅ Valid session for ${username}, expires in ${hoursLeft.toFixed(1)} hours`
      );

      return NextResponse.json({
        authenticated: true,
        expiresAt: new Date(expiresAt).toISOString(),
        hoursRemaining: Math.floor(hoursLeft),
      });
    } else {
      // Old token format without expiration (for backward compatibility)
      console.warn(
        `[Admin Verify] ⚠️  Token without expiration timestamp detected. Please re-login to get a secure token.`
      );

      return NextResponse.json({
        authenticated: true,
        warning: "Token does not have expiration. Please re-login for enhanced security.",
      });
    }
  } catch (error) {
    console.error("[Admin Verify] Verification error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
