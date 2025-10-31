import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const res = NextResponse.next();

  // Allow explicit override via query param (?region=US)
  const qsRegion = url.searchParams.get('region');
  if (qsRegion && /^[A-Za-z]{2}$/.test(qsRegion)) {
    res.cookies.set('wow_region', qsRegion.toUpperCase(), { path: '/', maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  // If cookie already exists, keep it
  const existing = req.cookies.get('wow_region')?.value;
  if (existing && /^[A-Za-z]{2}$/.test(existing)) {
    return res;
  }

  // Start with fallback or dev override
  let code = 'GB';
  const devOverride = process.env.NEXT_PUBLIC_DEV_REGION || process.env.DEV_REGION;
  if (devOverride && /^[A-Za-z]{2}$/.test(devOverride)) {
    code = devOverride.toUpperCase();
  }

  // Try edge-provided country headers (works on Vercel, Cloudflare, etc.)
  const candidates = [
    req.headers.get('x-vercel-ip-country'),
    req.headers.get('cf-ipcountry'),
    req.headers.get('x-country-code'),
    req.headers.get('x-geo-country'),
  ];
  const found = candidates.find((v) => v && /^[A-Za-z]{2}$/.test(v));
  if (found) {
    code = found.toUpperCase();
  }

  res.cookies.set('wow_region', code, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
}

// Exclude Next.js assets and common static files. Allow everything else (pages and API routes) to run through middleware.
export const config = {
  matcher: [
    '/((?!_next/|favicon.ico|.*\\.(?:css|js|map|png|jpg|jpeg|svg|gif|webp|ico)$).*)',
  ],
};
