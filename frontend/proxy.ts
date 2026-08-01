import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const role = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;

  // 1. Authenticated user visiting Root Landing page ("/") -> redirect to their role dashboard
  if (pathname === '/') {
    if (token && role) {
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/main', request.url));
    }
  }

  // 2. Unauthenticated user attempting to access protected routes ("/admin" or "/main") -> redirect to "/"
  if (pathname.startsWith('/admin') || pathname.startsWith('/main')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Role-based protection: non-admin users trying to access /admin -> redirect to /main
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/main', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/main/:path*'],
};
