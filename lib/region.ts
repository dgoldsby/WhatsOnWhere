import { headers, cookies } from 'next/headers';

// Try to detect a reasonable default region (ISO 3166-1 alpha-2)
// Priority order: user cookie -> known edge headers -> fallback
export function detectRegionFromRequest(): string {
  try {
    const c = cookies();
    const existing = c.get('wow_region')?.value;
    if (existing && /^[A-Z]{2}$/.test(existing)) return existing;
  } catch {}

  let code = 'GB'; // sensible fallback; adjust if you prefer 'US'

  try {
    const h = headers();
    const candidates = [
      h.get('x-vercel-ip-country'),
      h.get('x-country-code'),
      h.get('cf-ipcountry'),
      h.get('x-geo-country'),
    ];
    const found = candidates.find((v) => v && /^[A-Za-z]{2}$/.test(v));
    if (found) code = found.toUpperCase();
  } catch {}

  return code;
}

export function persistRegionCookie(region: string) {
  try {
    const c = cookies();
    c.set('wow_region', region.toUpperCase(), { path: '/', maxAge: 60 * 60 * 24 * 365 });
  } catch {}
}
