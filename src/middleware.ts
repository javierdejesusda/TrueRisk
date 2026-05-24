import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const protectedPaths = [
  '/dashboard',
  '/alerts',
  '/map',
  '/profile',
  '/emergency',
  '/prediction',
  '/history',
  '/preparedness',
  '/community',
  '/safety',
  '/backoffice',
  '/drought',
  '/evacuation',
  '/chat',
  '/phrases',
];

const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

const LOCALE_RE = /^\/(es|en)(?=\/|$)/;

function stripLocale(pathname: string): { locale: string; path: string } {
  const match = pathname.match(LOCALE_RE);
  if (!match) return { locale: routing.defaultLocale, path: pathname };
  return { locale: match[1], path: pathname.slice(match[0].length) || '/' };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, path } = stripLocale(pathname);

  const isProtected = protectedPaths.some((p) => path === p || path.startsWith(`${p}/`));

  if (isProtected) {
    const sessionToken =
      request.cookies.get('authjs.session-token') ||
      request.cookies.get('__Secure-authjs.session-token');
    if (!sessionToken) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }
  }

  const response = intlMiddleware(request);

  const isAuthPage = authPaths.some((p) => path === p || path.startsWith(`${p}/`));
  if (isProtected || isAuthPage) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|icons|opengraph-image|twitter-image|.*\\..*).*)',
  ],
};
