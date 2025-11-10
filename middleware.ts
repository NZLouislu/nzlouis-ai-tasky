import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For AI Tasky routes, check authentication via session cookie
  if (request.nextUrl.pathname.startsWith('/ai-tasky')) {
    const sessionToken = request.cookies.get('authjs.session-token') || 
                        request.cookies.get('__Secure-authjs.session-token');
    
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/ai-tasky/:path*",
  ],
};
