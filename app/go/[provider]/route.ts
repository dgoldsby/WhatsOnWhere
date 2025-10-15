import { NextResponse } from 'next/server';
import { resolveAffiliateUrlBySlug } from '@/lib/affiliates';
import type { MediaType } from '@/types/media';

export async function GET(request: Request, { params }: { params: { provider: string } }) {
  try {
    const { provider } = params;
    const url = new URL(request.url);
    const idParam = url.searchParams.get('id');
    const imdb = url.searchParams.get('imdb') || undefined;
    const region = (url.searchParams.get('region') || process.env.DEFAULT_REGION || 'US').toUpperCase();
    const type = (url.searchParams.get('type') as MediaType) || 'movie';

    const tmdbId = idParam ? Number(idParam) : NaN;
    const isPrime = provider === 'prime';
    if (!provider || (Number.isNaN(tmdbId) && !isPrime)) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }

    const final = resolveAffiliateUrlBySlug(provider, {
      providerName: provider,
      mediaType: type,
      tmdbId: Number.isNaN(tmdbId) ? 0 : tmdbId,
      imdbId: imdb,
      region,
    });

    if (!final) {
      return NextResponse.json({ error: 'No affiliate mapping for provider/region' }, { status: 404 });
    }

    // Minimal logging for now; replace with proper analytics later
    console.log('[affiliate-go]', { provider, type, tmdbId, imdb, region, url: final });

    return NextResponse.redirect(final, { status: 302 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to resolve affiliate' }, { status: 500 });
  }
}
