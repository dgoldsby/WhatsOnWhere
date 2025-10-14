import { NextRequest, NextResponse } from 'next/server';
import { getStreamingAvailabilityByImdbId } from '@/lib/streamingAvailability';
import { getExternalIds } from '@/lib/tmdb';

// Debug endpoint to validate Streaming Availability responses
// Usage examples:
//  /api/debug/streaming?imdbId=tt0133093&country=GB
//  /api/debug/streaming?type=tv&id=12345&country=US (will resolve imdbId via TMDB first)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imdbId = searchParams.get('imdbId') || undefined;
  const type = (searchParams.get('type') || undefined) as 'movie' | 'tv' | undefined;
  const idParam = searchParams.get('id');
  const id = idParam ? Number(idParam) : undefined;
  const country = (searchParams.get('country') || process.env.DEFAULT_REGION || 'US').toUpperCase();

  try {
    let resolvedImdb = imdbId;
    if (!resolvedImdb) {
      if (!type || !id || Number.isNaN(id)) {
        return NextResponse.json({ error: 'Provide imdbId, or type=movie|tv and id (TMDB id).' }, { status: 400 });
      }
      const external = await getExternalIds(type, id);
      if (!external?.imdb_id) {
        return NextResponse.json({ error: 'No imdb_id found for given TMDB type/id.' }, { status: 404 });
      }
      resolvedImdb = external.imdb_id;
    }

    const sa = await getStreamingAvailabilityByImdbId(resolvedImdb!, country, { timeoutMs: 10000 });
    let services: any[] = [];
    if (sa?.streamingInfo) {
      const info: any = sa.streamingInfo as any;
      if (Array.isArray(info)) {
        services = [
          {
            country,
            count: info.length,
            sample: info.slice(0, 5),
            services: Array.from(new Set(info.map((o: any) => o.service))).sort(),
          },
        ];
      } else if (typeof info === 'object') {
        services = Object.entries(info).map(([cc, offers]: any) => ({
          country: cc,
          count: Array.isArray(offers) ? offers.length : 0,
          sample: Array.isArray(offers) ? offers.slice(0, 5) : [],
          services: Array.isArray(offers) ? Array.from(new Set(offers.map((o: any) => o.service))).sort() : [],
        }));
      }
    }

    return NextResponse.json({
      ok: true,
      country,
      imdbId: resolvedImdb,
      hasData: !!sa,
      services,
      raw: sa,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to query streaming availability' }, { status: 500 });
  }
}
