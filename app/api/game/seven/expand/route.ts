import { NextResponse } from 'next/server';
import { getCredits, getDetails, getPerson, getPersonCombinedCredits } from '@/lib/tmdb';
import type { MediaType } from '@/types/media';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kind = searchParams.get('kind'); // 'title' | 'person'
    const id = Number(searchParams.get('id'));
    const type = (searchParams.get('type') as MediaType) || 'movie'; // only used when kind=title
    const limit = Math.max(1, Math.min(30, Number(searchParams.get('limit') || 20)));

    if (!kind || Number.isNaN(id)) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });

    if (kind === 'title') {
      const credits = await getCredits(type, id).catch(() => undefined);
      const cast = (credits?.cast || []).slice(0, limit).map((c: any) => ({
        kind: 'person' as const,
        id: c.id,
        name: c.name,
        profile_path: c.profile_path || null,
        character: c.character || undefined,
      }));
      return NextResponse.json({ nodes: cast }, { status: 200 });
    }

    if (kind === 'person') {
      const titles = await getPersonCombinedCredits(id).catch(() => []);
      const nodes = titles.slice(0, limit).map((t: any) => ({
        kind: 'title' as const,
        id: t.id,
        media_type: t.media_type as MediaType,
        title: t.title,
        poster_path: t.poster_path || null,
        release_year: t.release_year,
      }));
      return NextResponse.json({ nodes }, { status: 200 });
    }

    return NextResponse.json({ error: 'Unknown kind' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to expand' }, { status: 500 });
  }
}
