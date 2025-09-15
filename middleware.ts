import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 定义需要保护的路由
const protectedRoutes = ["/blog"];

// 定义不需要保护的路由（如登录页面）
const publicRoutes = ["/blog/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 如果是公开路由，直接放行
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // 检查是否为受保护路由
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // 尝试从cookie获取token
    let token = request.cookies.get("adminToken")?.value;

    // 如果cookie中没有token，尝试从Authorization header获取
    if (!token) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    // 如果没有token，重定向到登录页面
    if (!token) {
      const loginUrl = new URL("/blog/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 验证token的有效性
    try {
      const decoded = Buffer.from(token, "base64").toString().split(":");
      const username = decoded[0];
      const ADMIN_USERNAME = process.env.ADMIN_USERNAME;

      // 检查用户名是否匹配
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

// 配置匹配器
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下情况：
     * 1. 以/_next/static或/_next/image开头的路径（静态资源）
     * 2. 以/favicon.ico结尾的路径
     * 3. 以/api开头的路径
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
