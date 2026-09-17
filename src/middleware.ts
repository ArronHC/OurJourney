import { NextResponse } from 'next/server';

export function middleware() {
  const response = NextResponse.next();

  // Prevent reverse proxies or intermediary caches from serving stale app/router responses
  // across deployments. Static assets under /_next/static remain excluded via matcher.
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)'],
};
