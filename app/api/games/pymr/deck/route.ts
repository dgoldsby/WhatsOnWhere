import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE = 'https://api.themoviedb.org/3';

function tmdbHeaders() {
  const bearer = process.env.TMDB_ACCESS_TOKEN || process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;
  const v3 = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (bearer) return { Authorization: `Bearer ${bearer}` } as const;
  if (v3) return {} as const;
  throw new Error('TMDB credentials missing');
}

async function tmdb(url: string) {
  const v3 = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const hasQuery = url.includes('?');
  const sep = hasQuery ? '&' : '?';
  const final = v3 ? `${TMDB_BASE}${url}${sep}api_key=${encodeURIComponent(v3)}` : `${TMDB_BASE}${url}`;
  const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  const auth = tmdbHeaders() as any;
  if (auth && auth.Authorization) baseHeaders['Authorization'] = auth.Authorization;
  const res = await fetch(final, { headers: baseHeaders, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}

const CATEGORIES: Record<string, { with_genres: string; extra?: Record<string, string | number> }> = {
  'comedy': { with_genres: '35', extra: { 'vote_count.gte': 200 } },
  'sci-fi': { with_genres: '878', extra: { 'vote_count.gte': 200 } },
  'rom-com': { with_genres: '35,10749', extra: { 'vote_count.gte': 150 } },
  'action': { with_genres: '28', extra: { 'vote_count.gte': 200 } },
  'family': { with_genres: '10751', extra: { 'vote_count.gte': 100 } },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cat = (searchParams.get('category') || '').toLowerCase();
    const region = (searchParams.get('region') || process.env.DEFAULT_REGION || 'US').toUpperCase();
    const def = CATEGORIES[cat];
    if (!def) {
      return NextResponse.json({ error: 'Unknown category' }, { status: 400 });
    }

    // Pull multiple pages to get a decent shuffled deck
    const params = new URLSearchParams();
    params.set('with_genres', def.with_genres);
    params.set('sort_by', 'popularity.desc');
    params.set('include_adult', 'false');
    params.set('language', 'en-US');
    if (def.extra) {
      Object.entries(def.extra).forEach(([k, v]) => params.set(k, String(v)));
    }

    // Prefer region bias
    params.set('region', region);

    const pagesToFetch = [1, 2, 3];
    const all: any[] = [];
    for (const p of pagesToFetch) {
      const data = await tmdb(`/discover/movie?${params.toString()}&page=${p}`);
      if (Array.isArray(data?.results)) all.push(...data.results);
    }

    // Filter to sensible rating values and non-empty titles
    const cleaned = all
      .filter((m) => m && (typeof m.vote_average === 'number') && (m.title || m.name))
      .map((m) => ({
        id: m.id,
        title: m.title || m.name,
        poster_path: m.poster_path || null,
        vote_average: Math.round((m.vote_average || 0) * 10) / 10, // 1dp
      }));

    // Shuffle and take top N
    for (let i = cleaned.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cleaned[i], cleaned[j]] = [cleaned[j], cleaned[i]];
    }
    const deck = cleaned.slice(0, 30);

    return NextResponse.json({ deck });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load deck' }, { status: 500 });
  }
}
