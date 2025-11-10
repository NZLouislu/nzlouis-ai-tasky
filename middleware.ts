import { auth } from "@/lib/auth-config";

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith('/ai-tasky')) {
    return Response.redirect(new URL('/auth/signin', req.url));
  }
});

export const config = {
  matcher: [
    "/ai-tasky/:path*",
    "/api/chat/:path*",
    "/api/ai-settings/:path*",
    "/api/ai-keys/:path*",
    "/api/chat-sessions/:path*",
  ],
};
