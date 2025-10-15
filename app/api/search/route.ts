import { NextRequest, NextResponse } from 'next/server';
import { searchMulti, searchPeople } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query')?.trim();
  const only = (searchParams.get('only') || '').toLowerCase();
  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }
  try {
    if (only === 'person') {
      const people = await searchPeople(query);
      return NextResponse.json({ results: people });
    }
    const results = await searchMulti(query);
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Search failed' }, { status: 500 });
  }
}
