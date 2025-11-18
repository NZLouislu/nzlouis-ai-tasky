import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  if (pathname === '/') {
    return NextResponse.next();
  }
  
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin-session');
    
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    return NextResponse.next();
  }
  
  // Check for admin session first (allows admin to access all pages)
  const adminToken = request.cookies.get('admin-session');
  if (adminToken) {
    return NextResponse.next();
  }
  
  // Otherwise check for NextAuth session
  const sessionToken = request.cookies.get('authjs.session-token') || 
                      request.cookies.get('__Secure-authjs.session-token');
  
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth|images).*)",
  ],
};
