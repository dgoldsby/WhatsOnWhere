import { NextRequest, NextResponse } from 'next/server';

// Fully raw proxy to Streaming Availability (RapidAPI) for isolation
// Examples:
//  /api/debug/streaming/raw?imdbId=tt4477976
//  /api/debug/streaming/raw?imdbId=tt4477976&country=GB
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imdbId = searchParams.get('imdbId');
  const country = (searchParams.get('country') || '').toUpperCase();
  const seriesGranularity = searchParams.get('series_granularity') || 'show';
  const outputLanguage = searchParams.get('output_language') || 'en';

  const key = process.env.RAPIDAPI_STREAMINGAVAIL_KEY;
  const host = process.env.RAPIDAPI_STREAMINGAVAIL_HOST || 'streaming-availability.p.rapidapi.com';

  if (!imdbId) {
    return NextResponse.json({ error: 'imdbId is required' }, { status: 400 });
  }
  if (!key) {
    return NextResponse.json({ error: 'RAPIDAPI_STREAMINGAVAIL_KEY not set' }, { status: 500 });
  }

  const url = new URL(`https://${host}/shows/${encodeURIComponent(imdbId)}`);
  if (country) url.searchParams.set('country', country);
  if (seriesGranularity) url.searchParams.set('series_granularity', seriesGranularity);
  if (outputLanguage) url.searchParams.set('output_language', outputLanguage);

  const startedAt = Date.now();
  let status = 0;
  let ok = false;
  let body: any = null;
  let infoType: 'array' | 'object' | 'null' = 'null';

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': host,
      },
      cache: 'no-store',
    } as any);
    status = res.status;
    ok = res.ok;
    const text = await res.text();
    try {
      body = JSON.parse(text);
      const si = (body as any)?.streamingInfo;
      if (Array.isArray(si)) infoType = 'array';
      else if (si && typeof si === 'object') infoType = 'object';
      else infoType = 'null';
    } catch {
      body = text;
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'fetch failed', durationMs: Date.now() - startedAt }, { status: 502 });
  }

  return NextResponse.json({
    ok,
    status,
    durationMs: Date.now() - startedAt,
    request: {
      url: url.toString(),
      country: country || undefined,
      seriesGranularity,
      outputLanguage,
    },
    infoType,
    body,
  });
}
