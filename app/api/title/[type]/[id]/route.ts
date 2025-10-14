import { NextRequest, NextResponse } from 'next/server';
import { getCredits, getDetails, getExternalIds, getWatchProviders } from '@/lib/tmdb';
import { getImdbSummaryByImdbId } from '@/lib/imdb';
import { MediaType } from '@/types/media';
import { getStreamingAvailabilityByImdbId } from '@/lib/streamingAvailability';

export async function GET(
  req: NextRequest,
  { params }: { params: { type: MediaType; id: string } }
) {
  const { type, id } = params;
  const numericId = Number(id);
  if (!['movie', 'tv'].includes(type) || Number.isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid type or id' }, { status: 400 });
  }

  try {
    const [details, credits, providers, external] = await Promise.all([
      getDetails(type, numericId),
      getCredits(type, numericId),
      getWatchProviders(type, numericId),
      getExternalIds(type, numericId),
    ]);

    let imdbSummary = undefined;
    let streamingAvailability = undefined;
    if (external?.imdb_id) {
      imdbSummary = await getImdbSummaryByImdbId(external.imdb_id);
      const region = process.env.DEFAULT_REGION || 'US';
      streamingAvailability = await getStreamingAvailabilityByImdbId(external.imdb_id, region);
    }

    return NextResponse.json({ details, credits, providers, external, imdbSummary, streamingAvailability });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load title details' }, { status: 500 });
  }
}
