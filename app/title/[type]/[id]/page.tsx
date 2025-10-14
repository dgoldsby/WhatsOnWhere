import Image from 'next/image';
import { getDetails, getCredits, getExternalIds, getWatchProviders } from '@/lib/tmdb';
import { getImdbSummaryByImdbId } from '@/lib/imdb';
import { getStreamingAvailabilityByImdbId } from '@/lib/streamingAvailability';
import WatchNowButton from '@/components/WatchNowButton';

function pickRegionStreamingInfo(streamingAvailability: any, region?: string): { key?: string; offers?: any[] } {
  if (!streamingAvailability?.streamingInfo) return {};
  const info = streamingAvailability.streamingInfo as any;
  const envRegion = (region || process.env.DEFAULT_REGION || 'US').toUpperCase();
  // If country param is used, API may return a flat array
  if (Array.isArray(info)) {
    return { key: envRegion, offers: info };
  }
  const keys = Object.keys(info);
  if (info[envRegion]) return { key: envRegion, offers: info[envRegion] };
  if (info[envRegion.toLowerCase()]) return { key: envRegion.toLowerCase(), offers: info[envRegion.toLowerCase()] };
  if (keys.length > 0) return { key: keys[0], offers: info[keys[0]] };
  return {};
}

function normalizeServiceName(s: string) {
  const n = (s || '').toLowerCase().replace(/[^a-z0-9+]/g, '');
  if (n === 'amazonprimevideo' || n === 'primevideo' || n === 'prime') return 'prime';
  if (n === 'disney+' || n === 'disneyplus' || n === 'disney') return 'disney';
  if (n === 'paramount+' || n === 'paramountplus') return 'paramount';
  if (n === 'appletv+' || n === 'appletvplus') return 'appletv';
  if (n === 'hbomax' || n === 'max') return 'max';
  return n;
}

export default async function TitlePage({ params, searchParams }: { params: { type: string; id: string }, searchParams: { country?: string } }) {
  const { type, id } = params;
  const selectedCountry = (searchParams?.country || process.env.DEFAULT_REGION || 'US').toUpperCase();
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    throw new Error('Invalid id');
  }

  // Fetch data server-side directly from libs to avoid relative fetch issues
  const [details, credits, providers, external] = await Promise.all([
    getDetails(type as any, numericId),
    getCredits(type as any, numericId),
    getWatchProviders(type as any, numericId),
    getExternalIds(type as any, numericId),
  ]);

  let imdbSummary: any = undefined;
  let streamingAvailability: any = undefined;
  if (external?.imdb_id) {
    imdbSummary = await getImdbSummaryByImdbId(external.imdb_id);
    streamingAvailability = await getStreamingAvailabilityByImdbId(external.imdb_id, selectedCountry);
  }

  const cast = Array.isArray(credits?.cast) ? credits.cast.slice(0, 8) : [];
  const regionInfo = pickRegionStreamingInfo(streamingAvailability, selectedCountry);
  const offerLinkByService: Record<string, string> = {};
  if (Array.isArray(regionInfo.offers)) {
    for (const o of regionInfo.offers) {
      const key = normalizeServiceName(o?.service || '');
      if (key && !offerLinkByService[key] && o?.link) offerLinkByService[key] = o.link;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-brand-black hover:underline">← Back to search</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="relative w-full aspect-[2/3] bg-gray-200 rounded-lg overflow-hidden">
            {details?.poster_path ? (
              // Using plain img to avoid remote config complexity here
              <img
                src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                alt={details?.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
          </div>
        </div>

        <div className="md:col-span-2">
          <h1 className="text-3xl font-extrabold text-brand-black mb-2">{details?.title}</h1>
          <p className="text-gray-700 mb-4">
            {(details?.media_type === 'movie' && details?.release_year) ? details.release_year : ''}
            {(details?.media_type === 'tv' && details?.first_air_date) ? new Date(details.first_air_date).getFullYear() : ''}
          </p>
          <p className="text-gray-700 mb-6">{details?.overview}</p>

          <form method="get" className="mb-6">
            <label htmlFor="country" className="mr-2 text-sm text-gray-700">Region:</label>
            <select id="country" name="country" defaultValue={selectedCountry} className="border rounded px-2 py-1 text-sm">
              {['GB','US','CA','AU','DE','FR','ES','IT'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button type="submit" className="ml-2 px-3 py-1 rounded bg-brand-black text-white text-sm">Update</button>
          </form>

          {imdbSummary?.imdbRating && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm text-gray-600">IMDb rating:</span>
              <span className="inline-flex items-center px-2 py-1 rounded bg-brand-yellow text-black text-sm font-medium">
                {imdbSummary.imdbRating}
              </span>
            </div>
          )}

          {cast.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-brand-black mb-2">Top cast</h2>
              <div className="flex flex-wrap gap-3">
                {cast.map((c: any) => (
                  <span key={c.id} className="text-sm bg-gray-100 px-2 py-1 rounded">{c.name}{c.character ? ` as ${c.character}` : ''}</span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {regionInfo?.offers && Array.isArray(regionInfo.offers) && regionInfo.offers.length > 0 && (
              <div>
                <WatchNowButton offers={regionInfo.offers as any} />
              </div>
            )}
            {regionInfo?.offers && (
              <div>
                <h2 className="text-lg font-semibold text-brand-black mb-2">Where to watch{regionInfo.key ? ` (${regionInfo.key.toUpperCase()})` : ''}</h2>
                <div className="flex flex-wrap gap-2">
                  {regionInfo.offers.map((o: any, idx: number) => (
                    <a
                      key={`${o.service}-${idx}`}
                      href={o.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 rounded bg-brand-red text-white text-sm hover:brightness-95"
                    >
                      {o.service} {o.streamingType ? `• ${o.streamingType}` : ''}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {providers && (providers.flatrate || providers.buy || providers.rent) && (
              <div>
                <h2 className="text-lg font-semibold text-brand-black mb-2">Availability (TMDB)</h2>
                <div className="flex flex-wrap gap-2">
                  {(providers.flatrate || [])
                    .slice(0, 12)
                    .map((p: any) => {
                      const key = normalizeServiceName(p.provider_name);
                      const href = offerLinkByService[key];
                      return href ? (
                        <a
                          key={`flat-${p.provider_id}`}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-brand-yellow text-black text-xs px-2 py-1 rounded hover:brightness-95"
                        >
                          {p.provider_name}
                        </a>
                      ) : (
                        <span key={`flat-${p.provider_id}`} className="bg-brand-yellow text-black text-xs px-2 py-1 rounded">
                          {p.provider_name}
                        </span>
                      );
                    })}
                  {(!providers.flatrate || providers.flatrate.length === 0) && (providers.buy || providers.rent) && (
                    <span className="text-xs text-gray-600">Available to buy/rent</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
