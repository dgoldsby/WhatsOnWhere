// Streaming Availability API (RapidAPI)
// Docs: https://docs.movieofthenight.com/resource/shows
// Use the v3 endpoint: GET /shows/{id} where id can be an IMDb ID (e.g., tt0068646)

export interface SAOffer {
  service?: string;
  streamingType?: 'subscription' | 'buy' | 'rent' | 'free' | 'ads';
  link?: string;
  videoLink?: string;
  quality?: string;
  price?: number;
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

    // Normalize shapes:
    // - Old: data.streamingInfo (object keyed by country or flat array when ?country)
    // - New: data.streamingOptions (object keyed by lowercase country with offer objects containing { service: {id,name,...}, type, link })
    const result: SAResult = data as SAResult;

    // If streamingInfo already present, keep it
    if ((result as any).streamingInfo) {
      // But coerce any service objects to string if necessary
      const si: any = (result as any).streamingInfo;
      if (Array.isArray(si)) {
        (result as any).streamingInfo = si.map((o: any) => ({
          ...o,
          service: typeof o?.service === 'object' ? (o.service.name || o.service.id) : o?.service,
          streamingType: o?.streamingType || o?.type,
          link: o?.link,
        }));
      } else if (si && typeof si === 'object') {
        const normalized: Record<string, SAOffer[]> = {};
        for (const [cc, offers] of Object.entries(si)) {
          if (Array.isArray(offers)) {
            normalized[cc] = offers.map((o: any) => ({
              ...o,
              service: typeof o?.service === 'object' ? (o.service.name || o.service.id) : o?.service,
              streamingType: o?.streamingType || o?.type,
              link: o?.link,
            }));
          }
        }
        (result as any).streamingInfo = normalized;
      }
      return result;
    }

    // Fallback to streamingOptions
    const so: any = (data as any)?.streamingOptions;
    if (so && typeof so === 'object') {
      // If a specific country was requested, RapidAPI still returns only that key
      // We normalize to flat array in that case
      if (country) {
        const arr: any[] = so[country.toLowerCase()] || so[country] || [];
        (result as any).streamingInfo = Array.isArray(arr)
          ? arr.map((o: any) => ({
              service: typeof o?.service === 'object' ? (o.service.name || o.service.id) : o?.service,
              streamingType: o?.type,
              link: o?.link,
              videoLink: o?.videoLink,
              quality: o?.quality,
            }))
          : [];
      } else {
        const normalized: Record<string, SAOffer[]> = {};
        for (const [cc, offers] of Object.entries(so)) {
          if (Array.isArray(offers)) {
            normalized[String(cc).toUpperCase()] = offers.map((o: any) => ({
              service: typeof o?.service === 'object' ? (o.service.name || o.service.id) : o?.service,
              streamingType: o?.type,
              link: o?.link,
              videoLink: o?.videoLink,
              quality: o?.quality,
            }));
          }
        }
        (result as any).streamingInfo = normalized;
      }
      return result;
    }

    return result;
  } catch {
    clearTimeout(timeout);
    return undefined;
  }
}
