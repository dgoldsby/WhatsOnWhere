import { Availability, CreditsResponse, DetailResponse, ExternalIdsResponse, MediaType, ProviderInfo, UnifiedSearchResult } from '@/types/media';

const TMDB_BASE = 'https://api.themoviedb.org/3';

function getAuth() {
  // Prefer explicit v4 access token if present
  const accessToken = process.env.TMDB_ACCESS_TOKEN || process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN;
  if (accessToken) {
    return { useBearer: true, token: accessToken } as const;
  }
  const keyOrToken = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!keyOrToken) throw new Error('TMDB API key is missing. Set TMDB_API_KEY (v3) or TMDB_ACCESS_TOKEN (v4) in environment.');
  // Heuristic: JWT-like tokens contain dots; treat as v4 bearer
  if (keyOrToken.includes('.')) {
    return { useBearer: true, token: keyOrToken } as const;
  }
  return { useBearer: false, apiKey: keyOrToken } as const;
}

async function tmdbFetch<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const auth = getAuth();
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  const headers: Record<string, string> = {};
  if (auth.useBearer) {
    headers['Authorization'] = `Bearer ${auth.token}`;
  } else {
    url.searchParams.set('api_key', auth.apiKey);
  }

  const res = await fetch(url.toString(), { headers, next: { revalidate: 60 } } as any);
  if (!res.ok) throw new Error(`TMDB request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function searchMulti(query: string): Promise<UnifiedSearchResult[]> {
  const data = await tmdbFetch<any>('/search/multi', { query, include_adult: 'false', page: 1 });
  const results = (data.results || []) as any[];

  const filtered = results.filter((r) => r.media_type === 'movie' || r.media_type === 'tv');

  const mapped: UnifiedSearchResult[] = filtered.map((r) => ({
    id: r.id,
    media_type: r.media_type,
    title: r.title || r.name,
    overview: r.overview || '',
    poster_path: r.poster_path || null,
    release_year: r.release_date ? Number(String(r.release_date).slice(0, 4)) : (r.first_air_date ? Number(String(r.first_air_date).slice(0, 4)) : undefined),
  }));

  // Attach providers in parallel but ignore errors per item to keep results responsive
  const withProviders = await Promise.all(
    mapped.map(async (item) => {
      try {
        const providers = await getWatchProviders(item.media_type, item.id);
        return { ...item, providers } as UnifiedSearchResult;
      } catch {
        return item;
      }
    })
  );

  return withProviders;
}

export async function searchPeople(query: string): Promise<Array<{ id: number; name: string; profile_path: string | null }>> {
  const data = await tmdbFetch<any>('/search/person', { query, include_adult: 'false', page: 1 });
  const results = Array.isArray(data?.results) ? data.results : [];
  return results.map((p: any) => ({ id: p.id, name: p.name, profile_path: p.profile_path || null }));
}

export async function getDetails(type: MediaType, id: number): Promise<DetailResponse> {
  const path = type === 'movie' ? `/movie/${id}` : `/tv/${id}`;
  const data = await tmdbFetch<any>(path);
  return {
    id: data.id,
    media_type: type,
    title: data.title || data.name,
    overview: data.overview || '',
    poster_path: data.poster_path || null,
    release_year: data.release_date ? Number(String(data.release_date).slice(0, 4)) : (data.first_air_date ? Number(String(data.first_air_date).slice(0, 4)) : undefined),
    genres: data.genres,
    runtime: data.runtime,
    episode_run_time: data.episode_run_time,
    first_air_date: data.first_air_date,
    release_date: data.release_date,
  } as DetailResponse;
}

export async function getCredits(type: MediaType, id: number): Promise<CreditsResponse> {
  const path = type === 'movie' ? `/movie/${id}/credits` : `/tv/${id}/credits`;
  return tmdbFetch<CreditsResponse>(path);
}

export async function getExternalIds(type: MediaType, id: number): Promise<ExternalIdsResponse> {
  const path = type === 'movie' ? `/movie/${id}/external_ids` : `/tv/${id}/external_ids`;
  return tmdbFetch<ExternalIdsResponse>(path);
}

export async function getWatchProviders(type: MediaType, id: number): Promise<Availability | undefined> {
  const path = type === 'movie' ? `/movie/${id}/watch/providers` : `/tv/${id}/watch/providers`;
  const data = await tmdbFetch<any>(path);
  // Use country preference; fallback to US if available
  const region = process.env.DEFAULT_REGION || 'US';
  const regionData = data.results?.[region] || data.results?.['US'] || undefined;
  if (!regionData) return undefined;
  const mapProviders = (arr?: any[]): ProviderInfo[] | undefined => arr?.map((p) => ({
    provider_id: p.provider_id,
    provider_name: p.provider_name,
    logo_path: p.logo_path || null,
  }));
  const availability: Availability = {
    flatrate: mapProviders(regionData.flatrate),
    buy: mapProviders(regionData.buy),
    rent: mapProviders(regionData.rent),
  };
  // If all empty, return undefined
  if (!availability.flatrate && !availability.buy && !availability.rent) return undefined;
  return availability;
}

// Person helpers for "Also starred in"
export async function getPerson(personId: number): Promise<{ id: number; name: string; profile_path: string | null } | undefined> {
  const data = await tmdbFetch<any>(`/person/${personId}`);
  return {
    id: data.id,
    name: data.name,
    profile_path: data.profile_path || null,
  };
}

export async function getPersonCombinedCredits(personId: number): Promise<Array<{ id: number; media_type: MediaType; title: string; poster_path: string | null; character?: string; release_year?: number }>> {
  const data = await tmdbFetch<any>(`/person/${personId}/combined_credits`);
  const cast = Array.isArray(data?.cast) ? data.cast : [];
  const mapped = cast
    .filter((c: any) => c.media_type === 'movie' || c.media_type === 'tv')
    .map((c: any) => ({
      id: c.id,
      media_type: c.media_type,
      title: c.title || c.name,
      poster_path: c.poster_path || null,
      character: c.character || undefined,
      release_year: c.release_date ? Number(String(c.release_date).slice(0, 4)) : (c.first_air_date ? Number(String(c.first_air_date).slice(0, 4)) : undefined),
    }));
  // Deduplicate by id keeping first occurrence
  const seen = new Set<number>();
  const dedup: any[] = [];
  for (const m of mapped) {
    if (!seen.has(m.id)) { seen.add(m.id); dedup.push(m); }
  }
  return dedup;
}

export async function getSimilar(type: MediaType, id: number): Promise<Array<{ id: number; media_type: MediaType; title: string; poster_path: string | null; release_year?: number }>> {
  const path = type === 'movie' ? `/movie/${id}/similar` : `/tv/${id}/similar`;
  const data = await tmdbFetch<any>(path);
  const results = Array.isArray(data?.results) ? data.results : [];
  return results
    .filter((r: any) => r)
    .map((r: any) => ({
      id: r.id,
      media_type: type,
      title: r.title || r.name,
      poster_path: r.poster_path || null,
      release_year: r.release_date ? Number(String(r.release_date).slice(0, 4)) : (r.first_air_date ? Number(String(r.first_air_date).slice(0, 4)) : undefined),
    }));
}

export async function getRecommendations(type: MediaType, id: number): Promise<Array<{ id: number; media_type: MediaType; title: string; poster_path: string | null; release_year?: number }>> {
  const path = type === 'movie' ? `/movie/${id}/recommendations` : `/tv/${id}/recommendations`;
  const data = await tmdbFetch<any>(path);
  const results = Array.isArray(data?.results) ? data.results : [];
  return results
    .filter((r: any) => r)
    .map((r: any) => ({
      id: r.id,
      media_type: type,
      title: r.title || r.name,
      poster_path: r.poster_path || null,
      release_year: r.release_date ? Number(String(r.release_date).slice(0, 4)) : (r.first_air_date ? Number(String(r.first_air_date).slice(0, 4)) : undefined),
    }));
}

export async function getRandomPopularTitle(type: MediaType, seed?: number): Promise<{ id: number; media_type: MediaType; title: string; poster_path: string | null; release_year?: number }> {
  const path = type === 'movie' ? '/movie/popular' : '/tv/popular';
  const page = seed ? (Math.abs(seed) % 5) + 1 : Math.floor(Math.random() * 5) + 1;
  const data = await tmdbFetch<any>(path, { page });
  const results = Array.isArray(data?.results) ? data.results : [];
  const idx = results.length > 0 ? (seed ? Math.abs((seed * 9301 + 49297) % results.length) : Math.floor(Math.random() * results.length)) : 0;
  const r = results[Math.max(0, Math.min(idx, Math.max(0, results.length - 1)))] || results[0];
  return {
    id: r.id,
    media_type: type,
    title: r.title || r.name,
    poster_path: r.poster_path || null,
    release_year: r.release_date ? Number(String(r.release_date).slice(0, 4)) : (r.first_air_date ? Number(String(r.first_air_date).slice(0, 4)) : undefined),
  };
}

// Random high-rated US movie picker for Seven Degrees starting title
export async function getRandomHighRatedUSMovie(seed?: number): Promise<{ id: number; media_type: MediaType; title: string; poster_path: string | null; release_year?: number }> {
  // Limit to first few pages for performance and determinism with seed
  const page = seed ? (Math.abs(seed) % 5) + 1 : Math.floor(Math.random() * 5) + 1;
  const params: Record<string, string | number> = {
    sort_by: 'popularity.desc',
    include_adult: 'false',
    include_video: 'false',
    page,
    region: 'US',
    with_origin_country: 'US',
  } as any;
  // Use Discover filter to ensure rating >= 7.0
  (params as any)['vote_average.gte'] = 7;
  const data = await tmdbFetch<any>('/discover/movie', params);
  const results: any[] = Array.isArray(data?.results) ? data.results : [];
  // Extra safety filter in case API returns edge items
  const filtered = results.filter((r) => (r?.vote_average ?? 0) >= 7);
  const pool = filtered.length > 0 ? filtered : results;
  const idx = pool.length > 0 ? (seed ? Math.abs((seed * 9301 + 49297) % pool.length) : Math.floor(Math.random() * pool.length)) : 0;
  const r = pool[Math.max(0, Math.min(idx, Math.max(0, pool.length - 1)))] || pool[0];
  return {
    id: r.id,
    media_type: 'movie',
    title: r.title || r.name,
    poster_path: r.poster_path || null,
    release_year: r.release_date ? Number(String(r.release_date).slice(0, 4)) : undefined,
  };
}

export async function getPopularPeople(page = 1): Promise<Array<{ id: number; name: string; profile_path: string | null }>> {
  const data = await tmdbFetch<any>('/person/popular', { page });
  const results = Array.isArray(data?.results) ? data.results : [];
  return results.map((p: any) => ({ id: p.id, name: p.name, profile_path: p.profile_path || null }));
}
