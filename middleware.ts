import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define routes that require protection
const protectedRoutes = ["/blog"];

// Define routes that don't require protection (e.g., login page)
const publicRoutes = ["/blog/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If it's a public route, allow access
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if the route requires protection
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Attempt to retrieve token from cookie
    let token = request.cookies.get("adminToken")?.value;

    // If no token in cookie, attempt to retrieve from Authorization header
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // If no token is found, redirect to login page
    if (!token) {
      const loginUrl = new URL("/blog/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 验证token的有效性
    try {
      const decoded = Buffer.from(token, "base64").toString().split(":");
      const username = decoded[0];
      const ADMIN_USERNAME = process.env.ADMIN_USERNAME;

      // Verify username matches
      if (username !== ADMIN_USERNAME) {
        const loginUrl = new URL("/blog/admin/login", request.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error("Token verification error:", error);
      const loginUrl = new URL("/blog/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configure matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the following:
     * 1. Paths starting with /_next/static or /_next/image (static resources)
     * 2. Paths ending with /favicon.ico
     * 3. Paths starting with /api
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
