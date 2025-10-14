import { OmdbSummary } from '@/types/media';

// Prefer OMDb API (free, requires key). If not present, fall back to RapidAPI IMDb endpoints (placeholder).
// Set one of the following in your environment:
// - OMDB_API_KEY
// - RAPIDAPI_IMDB_KEY (and RAPIDAPI_IMDB_HOST if needed)

export async function getImdbSummaryByImdbId(imdbId: string): Promise<OmdbSummary | undefined> {
  const omdbKey = process.env.OMDB_API_KEY || process.env.NEXT_PUBLIC_OMDB_API_KEY;
  if (omdbKey) {
    const url = new URL('https://www.omdbapi.com/');
    url.searchParams.set('apikey', omdbKey);
    url.searchParams.set('i', imdbId);
    url.searchParams.set('plot', 'short');

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return undefined;
    const data = await res.json();
    if (data?.Response === 'False') return undefined;
    return data as OmdbSummary;
  }

  // Optional RapidAPI fallback (requires account). Leaving as no-op until keys are provided.
  const rapidKey = process.env.RAPIDAPI_IMDB_KEY;
  const rapidHost = process.env.RAPIDAPI_IMDB_HOST || 'imdb8.p.rapidapi.com';
  if (rapidKey) {
    // Example endpoint could vary; many RapidAPI IMDb endpoints exist. This is a placeholder.
    try {
      const res = await fetch(`https://${rapidHost}/title/get-overview-details?tconst=${encodeURIComponent(imdbId)}&currentCountry=US`, {
        headers: {
          'X-RapidAPI-Key': rapidKey,
          'X-RapidAPI-Host': rapidHost,
        },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return undefined;
      const data = await res.json();
      // Map minimal fields to OmdbSummary-like shape
      return {
        imdbID: imdbId,
        Title: data?.title?.title,
        Year: data?.title?.year ? String(data.title.year) : undefined,
        Plot: data?.plotSummary?.text,
        Actors: Array.isArray(data?.credits?.cast)
          ? data.credits.cast.slice(0, 6).map((c: any) => c?.name).filter(Boolean).join(', ')
          : undefined,
        Poster: data?.title?.image?.url,
        imdbRating: data?.ratings?.rating ? String(data.ratings.rating) : undefined,
      } as OmdbSummary;
    } catch {
      return undefined;
    }
  }

  return undefined;
}
