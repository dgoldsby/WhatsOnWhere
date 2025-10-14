// Streaming Availability API (RapidAPI)
// Docs: https://docs.movieofthenight.com/resource/shows
// Use the v3 endpoint: GET /shows/{id} where id can be an IMDb ID (e.g., tt0068646)

export interface SAOffer {
  service: string; // e.g., netflix, prime, etc.
  streamingType: string; // subscription | buy | rent | free | ads
  link: string; // deep link to platform
  quality?: string; // e.g., hd, 4k (if present)
  audios?: Array<{ language?: string; region?: string }>;
  subtitles?: Array<{ language?: string; region?: string }>;
}

export interface SAResult {
  id?: string; // internal id
  imdbId?: string;
  tmdbId?: string | number;
  title?: string;
  overview?: string;
  type?: 'movie' | 'series';
  year?: number;
  posterPath?: string;
  // When no country param is supplied: keyed by country code
  // When country param is supplied: some providers return a flat array
  streamingInfo?: Record<string, SAOffer[]> | SAOffer[];
}

export async function getStreamingAvailabilityByImdbId(
  imdbId: string,
  country = 'US',
  options?: { seriesGranularity?: 'show' | 'season' | 'episode'; outputLanguage?: string; timeoutMs?: number }
): Promise<SAResult | undefined> {
  const key = process.env.RAPIDAPI_STREAMINGAVAIL_KEY;
  const host = process.env.RAPIDAPI_STREAMINGAVAIL_HOST || 'streaming-availability.p.rapidapi.com';
  if (!key) return undefined;

  const url = new URL(`https://${host}/shows/${encodeURIComponent(imdbId)}`);
  // Optional parameters per docs
  if (country) url.searchParams.set('country', country.toUpperCase());
  url.searchParams.set('series_granularity', options?.seriesGranularity || 'show');
  url.searchParams.set('output_language', options?.outputLanguage || 'en');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? 10000);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': host,
      },
      // Listings change but not minutely; cache briefly
      next: { revalidate: 300 },
      signal: controller.signal,
    } as any);
    clearTimeout(timeout);
    if (!res.ok) return undefined;
    const data = await res.json();
    return data as SAResult;
  } catch {
    clearTimeout(timeout);
    return undefined;
  }
}
