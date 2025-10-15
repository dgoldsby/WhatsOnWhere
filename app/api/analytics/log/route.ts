import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const game = String(body?.game || 'unknown');
    const score = Number(body?.score || 0);
    const nowUtc = new Date().toISOString();

    // Try to get a stable client identifier: ip or forwarded-for
    const ip = (req.ip || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '').toString();

    const entry = { timeUtc: nowUtc, game, ip, score };

    // For MVP: log to server console (replace with DB later)
    console.log('[game-play]', JSON.stringify(entry));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}
