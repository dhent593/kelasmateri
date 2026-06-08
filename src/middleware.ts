import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'kelasmateri_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve the session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  
  let session = null;
  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (e) {
      // Ignore parsing errors and treat as no session
    }
  }

  // 1. Protect Admin routes (/admin/*)
  if (pathname.startsWith('/admin')) {
    if (!session || session.role !== 'admin') {
      // Redirect to login
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }

  // 2. Protect User and Exam routes (/user/*, /exam/*)
  if (pathname.startsWith('/user') || pathname.startsWith('/exam')) {
    if (!session) {
      // Redirect to login
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }

  // 3. Prevent logged-in users from accessing /login and /register
  if (pathname === '/login' || pathname === '/register') {
    if (session) {
      const destination = session.role === 'admin' ? '/admin' : '/user';
      const url = new URL(destination, request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Matching paths
export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
    '/exam/:path*',
    '/login',
    '/register'
  ]
};
