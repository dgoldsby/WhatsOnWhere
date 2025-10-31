import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const region = String(body?.region || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(region)) {
      return NextResponse.json({ ok: false, error: 'Invalid region' }, { status: 400 });
    }
    const c = cookies();
    c.set('wow_region', region, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    return NextResponse.json({ ok: true, region });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
