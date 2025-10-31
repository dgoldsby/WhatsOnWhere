import { NextResponse } from 'next/server';
import { getCredits, getPerson, getDetails, getRandomHighRatedUSMovie } from '@/lib/tmdb';
import type { MediaType } from '@/types/media';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const seedStr = searchParams.get('seed');
    const seed = seedStr ? Number(seedStr) : undefined;
    const targetKind = (searchParams.get('targetKind') || '').toLowerCase(); // 'person' | 'title'
    const targetIdStr = searchParams.get('targetId');
    const targetId = targetIdStr ? Number(targetIdStr) : undefined;
    const targetMediaType = (searchParams.get('targetMediaType') as MediaType) || undefined;
    const startIdStr = searchParams.get('startId');
    const startId = startIdStr ? Number(startIdStr) : undefined;

    // Ensure start is a high-rated US movie to make the game more winnable
    const type: MediaType = 'movie';
    let start = startId && !Number.isNaN(startId)
      ? await (async () => {
          const d = await getDetails('movie', startId);
          return { id: d.id, media_type: 'movie' as const, title: d.title, poster_path: d.poster_path, release_year: d.release_year };
        })()
      : await getRandomHighRatedUSMovie(seed);

    // Determine target
    let target:
      | { kind: 'person'; id: number; name: string; profile_path: string | null }
      | { kind: 'title'; id: number; media_type: MediaType; title: string; poster_path: string | null };

    if (targetKind === 'person' && typeof targetId === 'number' && !Number.isNaN(targetId)) {
      const person = await getPerson(targetId);
      if (!person) throw new Error('Failed to load target person');
      target = { kind: 'person', id: person.id, name: person.name, profile_path: person.profile_path };
    } else if (
      targetKind === 'title' && typeof targetId === 'number' && !Number.isNaN(targetId) && targetMediaType
    ) {
      const t = await getDetails(targetMediaType, targetId);
      if (!t) throw new Error('Failed to load target title');
      target = {
        kind: 'title',
        id: t.id,
        media_type: targetMediaType,
        title: t.title,
        poster_path: t.poster_path || null,
      } as any;
    } else {
      // Default to Kevin Bacon (TMDB person id 4724)
      const KEVIN_BACON_ID = 4724;
      const kevin = await getPerson(KEVIN_BACON_ID);
      if (!kevin) throw new Error('Failed to load Kevin Bacon details');
      target = { kind: 'person', id: kevin.id, name: kevin.name, profile_path: kevin.profile_path };
    }

    // Avoid trivial starts
    for (let attempts = 0; attempts < 5; attempts++) {
      if (target.kind === 'person') {
        const startCredits = await getCredits(type, start.id).catch(() => undefined);
        const inCast = (startCredits?.cast || []).some((c: any) => c.id === target.id);
        if (!inCast) break;
      } else if (target.kind === 'title') {
        if (start.id !== target.id) break;
      }
      if (startId) {
        // If explicitly provided start conflicts, don't loop endlessly — just break
        break;
      }
      start = await getRandomHighRatedUSMovie((seed ?? Date.now()) + attempts + 1);
    }

    const payload = {
      seed: seed ?? Math.floor(Math.random() * 1e9),
      start: { kind: 'title' as const, ...start },
      target,
      moves: 7,
    };
    return NextResponse.json(payload, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to init game' }, { status: 500 });
  }
}

