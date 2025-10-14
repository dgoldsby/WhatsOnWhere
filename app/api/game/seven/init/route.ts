import { NextResponse } from 'next/server';
import { getCredits, getPerson, getRandomPopularTitle } from '@/lib/tmdb';
import type { MediaType } from '@/types/media';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seedStr = searchParams.get('seed');
    const seed = seedStr ? Number(seedStr) : undefined;

    // Randomly choose type for start title
    const type: MediaType = Math.random() < 0.5 ? 'movie' : 'tv';
    let start = await getRandomPopularTitle(type, seed);

    // Always use Kevin Bacon (TMDB person id 4724) as target
    const KEVIN_BACON_ID = 4724;
    const kevin = await getPerson(KEVIN_BACON_ID);
    if (!kevin) throw new Error('Failed to load Kevin Bacon details');

    // Ensure start title does not already include Kevin Bacon; if it does, re-pick a few times
    for (let attempts = 0; attempts < 5; attempts++) {
      const startCredits = await getCredits(type, start.id).catch(() => undefined);
      const inCast = (startCredits?.cast || []).some((c: any) => c.id === KEVIN_BACON_ID);
      if (!inCast) break;
      start = await getRandomPopularTitle(type, (seed ?? Date.now()) + attempts + 1);
    }

    const payload = {
      seed: seed ?? Math.floor(Math.random() * 1e9),
      start: { kind: 'title' as const, ...start },
      target: { kind: 'person' as const, id: kevin.id, name: kevin.name, profile_path: kevin.profile_path },
      moves: 7,
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to init game' }, { status: 500 });
  }
}
