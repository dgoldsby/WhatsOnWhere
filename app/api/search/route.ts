import { NextRequest, NextResponse } from 'next/server';
import { searchMulti } from '@/lib/tmdb';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query')?.trim();
  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }
  try {
    const results = await searchMulti(query);
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Search failed' }, { status: 500 });
  }
}
