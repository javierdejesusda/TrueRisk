import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/alerts', '/map', '/profile', '/emergency', '/prediction', '/history', '/preparedness', '/community', '/safety'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (isProtected) {
    const sessionToken = request.cookies.get('authjs.session-token') || request.cookies.get('__Secure-authjs.session-token');
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons|login|register|report|backoffice|$).*)'],
};
