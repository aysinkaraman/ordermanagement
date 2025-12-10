import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // If trying to access falcon without token, redirect to login
  if (request.nextUrl.pathname.startsWith('/falcon')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // If trying to access login with valid token, redirect to falcon
  if (request.nextUrl.pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/falcon', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/falcon/:path*', '/login'],
};
