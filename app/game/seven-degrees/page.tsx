'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type MediaType = 'movie' | 'tv';

type TitleNode = { kind: 'title'; id: number; media_type: MediaType; title: string; poster_path: string | null; release_year?: number };
type PersonNode = { kind: 'person'; id: number; name: string; profile_path: string | null; character?: string };

type InitPayload = {
  seed: number;
  start: TitleNode;
  target: PersonNode | TitleNode;
  moves: number;
};

type ExpandResponse = { nodes: Array<TitleNode | PersonNode> };

function useQueryParam(name: string) {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    setValue(url.searchParams.get(name));
  }, []);
  return value;
}

export default function SevenDegreesPage() {
  const seedParam = useQueryParam('seed');
  const targetKindParam = useQueryParam('targetKind');
  const targetIdParam = useQueryParam('targetId');
  const targetMediaTypeParam = useQueryParam('targetMediaType');
  const startIdParam = useQueryParam('startId');
  const [loading, setLoading] = useState(true);
  const [initData, setInitData] = useState<InitPayload | null>(null);
  const [path, setPath] = useState<Array<TitleNode | PersonNode>>([]);
  const [frontier, setFrontier] = useState<Array<TitleNode | PersonNode>>([]);
  const [movesLeft, setMovesLeft] = useState(7);
  const [win, setWin] = useState(false);
  const [lose, setLose] = useState(false);
  const [actorQuery, setActorQuery] = useState('');
  const [actorResults, setActorResults] = useState<Array<{ id: number; name: string; profile_path: string | null }>>([]);
  const [searching, setSearching] = useState(false);
  const [stats, setStats] = useState<{ played: number; won: number; lost: number; quickest?: number }>({ played: 0, won: 0, lost: 0 });
  const [countedPlayed, setCountedPlayed] = useState(false);
  const [countedOutcome, setCountedOutcome] = useState(false);

  // Modals for changing start and destination
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [destModalOpen, setDestModalOpen] = useState(false);
  // Start search state (movies only)
  const [startQuery, setStartQuery] = useState('');
  const [startResults, setStartResults] = useState<Array<{ id: number; media_type: 'movie' | 'tv'; title: string; poster_path: string | null; release_year?: number }>>([]);
  const [startSearching, setStartSearching] = useState(false);

  const doActorSearch = async () => {
    const q = actorQuery.trim();
    if (!q) { setActorResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(q)}&only=person`);
      const data = await res.json();
      const people = Array.isArray(data?.results) ? data.results.slice(0, 12) : [];
      setActorResults(people.map((p: any) => ({ id: p.id, name: p.name, profile_path: p.profile_path || null })));
    } finally {
      setSearching(false);
    }
  };

  const doStartSearch = async () => {
    const q = startQuery.trim();
    if (!q) { setStartResults([]); return; }
    setStartSearching(true);
    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      const items = Array.isArray(data?.results) ? data.results : [];
      const movies = items.filter((r: any) => r.media_type === 'movie').slice(0, 18);
      setStartResults(movies.map((m: any) => ({ id: m.id, media_type: 'movie', title: m.title, poster_path: m.poster_path || null, release_year: m.release_year })));
    } finally {
      setStartSearching(false);
    }
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (seedParam) params.set('seed', seedParam);
      if (targetKindParam) params.set('targetKind', targetKindParam);
      if (targetIdParam) params.set('targetId', targetIdParam);
      if (targetMediaTypeParam) params.set('targetMediaType', targetMediaTypeParam);
      if (startIdParam) params.set('startId', startIdParam);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/game/seven/init${qs}`);
      if (!res.ok) return;
      const data: InitPayload = await res.json();
      if (!active) return;
      setInitData(data);
      setPath([data.start]);
      setMovesLeft(data.moves);
      const exp = await fetch(`/api/game/seven/expand?kind=title&id=${data.start.id}&type=${data.start.media_type}`);
      const ex: ExpandResponse = await exp.json();
      if (!active) return;
      setFrontier(ex.nodes || []);
      setLoading(false);
    };
    run();
    return () => { active = false; };
  }, [seedParam, targetKindParam, targetIdParam, targetMediaTypeParam, startIdParam]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('seven_degrees_stats');
      if (raw) {
        const parsed = JSON.parse(raw);
        setStats({ played: parsed.played || 0, won: parsed.won || 0, lost: parsed.lost || 0, quickest: parsed.quickest });
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Count a play when a game successfully initializes once
    if (initData && !countedPlayed) {
      const next = { ...stats, played: (stats.played || 0) + 1 };
      setStats(next);
      try { localStorage.setItem('seven_degrees_stats', JSON.stringify(next)); } catch {}
      setCountedPlayed(true);
    }
    // Count outcome when win/lose is first set
    if (initData && !countedOutcome && (win || lose)) {
      const usedMoves = Math.max(0, (path.length - 1));
      const next = { ...stats } as any;
      if (win) {
        next.won = (next.won || 0) + 1;
        next.quickest = typeof next.quickest === 'number' ? Math.min(next.quickest, usedMoves) : usedMoves;
      }
      if (lose) {
        next.lost = (next.lost || 0) + 1;
      }
      setStats(next);
      try { localStorage.setItem('seven_degrees_stats', JSON.stringify(next)); } catch {}
      // Fire-and-forget analytics log
      try { fetch('/api/analytics/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ game: 'seven-degrees', score: win ? usedMoves : 0 }) }); } catch {}
      setCountedOutcome(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData, win, lose, path.length]);

  const current = path[path.length - 1] as TitleNode | PersonNode | undefined;

  const shareUrl = useMemo(() => {
    if (!initData) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('seed', String(initData.seed));
    return url.toString();
  }, [initData]);

  const onPick = async (node: TitleNode | PersonNode) => {
    if (win || lose || loading) return;
    if (!initData) return;
    if (
      (node.kind === 'person' && initData.target.kind === 'person' && node.id === initData.target.id) ||
      (node.kind === 'title' && initData.target.kind === 'title' && node.id === initData.target.id)
    ) {
      setPath((p) => [...p, node]);
      setWin(true);
      return;
    }
    const nextMoves = movesLeft - 1;
    const newPath = [...path, node];
    setPath(newPath);
    setMovesLeft(nextMoves);
    const params = node.kind === 'title'
      ? `kind=title&id=${node.id}&type=${node.media_type}`
      : `kind=person&id=${node.id}`;
    const res = await fetch(`/api/game/seven/expand?${params}`);
    const ex: ExpandResponse = await res.json();
    setFrontier(ex.nodes || []);
    if (nextMoves <= 0) setLose(true);
  };

  const reset = () => {
    window.location.href = '/game/seven-degrees';
  };

  useEffect(() => {
    const t = setTimeout(() => { doActorSearch(); }, 300);
    return () => clearTimeout(t);
  }, [actorQuery]);

  useEffect(() => {
    const t = setTimeout(() => { doStartSearch(); }, 300);
    return () => clearTimeout(t);
  }, [startQuery]);

  const startWithActor = (personId: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('targetKind', 'person');
    url.searchParams.set('targetId', String(personId));
    url.searchParams.delete('targetMediaType');
    url.searchParams.delete('seed');
    window.location.href = url.toString();
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm hover:underline">← Back to search</Link>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs text-[var(--color-muted)] bg-[var(--color-surface)] border border-[rgba(0,0,0,0.06)] rounded px-2 py-1">
            <span>Played: <strong className="text-[var(--color-text)]">{stats.played || 0}</strong></span>
            <span>Won: <strong className="text-[var(--color-text)]">{stats.won || 0}</strong></span>
            <span>Lost: <strong className="text-[var(--color-text)]">{stats.lost || 0}</strong></span>
            <span>Quickest: <strong className="text-[var(--color-text)]">{typeof stats.quickest === 'number' ? stats.quickest : '—'}</strong></span>
          </div>
          <button onClick={reset} className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:brightness-95">Restart game</button>
          <Link href="/settings" className="text-sm hover:underline">Settings</Link>
        </div>
      </div>

      <h1 className="text-3xl font-extrabold mb-4">Seven Degrees</h1>

      <div className="mb-6">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={actorQuery}
            onChange={(e) => setActorQuery(e.target.value)}
            placeholder="Search destination actor (defaults to Kevin Bacon)"
            className="border border-[rgba(0,0,0,0.1)] rounded px-3 py-2 text-sm w-full max-w-md bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] caret-[var(--color-text)]"
            aria-label="Search destination actor"
          />
          <button onClick={doActorSearch} className="px-3 py-2 rounded bg-[var(--color-brand)] text-black text-sm">Search</button>
          {searching && <span className="text-xs text-[var(--color-muted)]">Searching…</span>}
        </div>
        {actorResults.length > 0 && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {actorResults.map((p) => (
              <button key={p.id} onClick={() => startWithActor(p.id)} className="bg-[var(--color-surface)] rounded border border-[rgba(0,0,0,0.06)] p-2 text-left hover:brightness-95">
                <div className="h-28 bg-gray-200 mb-2">
                  {p.profile_path ? (
                    <img src={`https://image.tmdb.org/t/p/w300${p.profile_path}`} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                  )}
                </div>
                <div className="text-sm line-clamp-2">{p.name}</div>
                <div className="text-xs text-[var(--color-muted)]">Set as destination</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {initData && (
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--color-surface)] rounded-lg shadow-[var(--shadow-low)] border border-[rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex justify-between items-center px-3 pt-3">
                <div className="text-sm font-semibold">Start</div>
                <button onClick={() => setStartModalOpen(true)} className="text-xs underline">change start movie</button>
              </div>
              <div className="h-32 sm:h-36 bg-gray-200 relative">
                {initData.start.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w500${initData.start.poster_path}`} alt={initData.start.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div className="p-3">
                <div className="text-sm line-clamp-2">{initData.start.title}</div>
                <div className="text-[var(--color-muted)] text-xs">{initData.start.media_type === 'movie' ? 'Movie' : 'TV Show'}{initData.start.release_year ? ` • ${initData.start.release_year}` : ''}</div>
              </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-lg shadow-[var(--shadow-low)] border border-[rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex justify-between items-center px-3 pt-3">
                <div className="text-sm font-semibold">{initData.target.kind === 'person' ? 'Target actor' : 'Target title'}</div>
                <button onClick={() => setDestModalOpen(true)} className="text-xs underline">change destination actor</button>
              </div>
              <div className="h-32 sm:h-36 bg-gray-200 relative">
                {initData.target.kind === 'person'
                  ? (
                    initData.target.profile_path ? (
                      <img src={`https://image.tmdb.org/t/p/w500${initData.target.profile_path}`} alt={initData.target.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )
                  )
                  : (
                    initData.target.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w500${(initData.target as any).poster_path}`} alt={(initData.target as any).title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )
                  )}
              </div>
              <div className="p-3">
                <div className="text-sm">{initData.target.kind === 'person' ? (initData.target as any).name : (initData.target as any).title}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[rgba(0,0,0,0.05)]">
              <span className="text-sm text-[var(--color-muted)]">Moves left</span>
              <span className="text-2xl font-extrabold leading-none">{movesLeft}</span>
            </div>
            <div className="mt-2 text-xs text-[var(--color-muted)]">Stats — Played: {stats.played || 0} • Won: {stats.won || 0} • Lost: {stats.lost || 0} • Quickest: {typeof stats.quickest === 'number' ? stats.quickest : '—'}</div>
          </div>
        </div>
      )}

      {/* Start change modal */}
      {startModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-lg shadow-[var(--shadow-mid)] w-full max-w-2xl p-6 relative">
            <button aria-label="Close" className="absolute right-3 top-3 text-[var(--color-muted)] hover:opacity-80" onClick={() => setStartModalOpen(false)}>×</button>
            <h3 className="text-xl font-bold mb-3">Change start movie</h3>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={startQuery}
                onChange={(e) => setStartQuery(e.target.value)}
                placeholder="Search movies"
                className="border border-[rgba(0,0,0,0.1)] rounded px-3 py-2 text-sm w-full bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] caret-[var(--color-text)]"
                aria-label="Search start movie"
              />
              <button onClick={doStartSearch} className="px-3 py-2 rounded bg-[var(--color-brand)] text-black text-sm">Search</button>
              {startSearching && <span className="text-xs text-[var(--color-muted)]">Searching…</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {startResults.map((m) => (
                <button key={m.id} onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('startId', String(m.id));
                  url.searchParams.delete('seed');
                  window.location.href = url.toString();
                }} className="bg-[var(--color-surface)] rounded border border-[rgba(0,0,0,0.06)] p-2 text-left hover:brightness-95">
                  <div className="h-28 bg-gray-200 mb-2">
                    {m.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w300${m.poster_path}`} alt={m.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="text-sm line-clamp-2">{m.title}</div>
                  <div className="text-xs text-[var(--color-muted)]">Movie{m.release_year ? ` • ${m.release_year}` : ''}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Destination change modal */}
      {destModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-lg shadow-[var(--shadow-mid)] w-full max-w-2xl p-6 relative">
            <button aria-label="Close" className="absolute right-3 top-3 text-[var(--color-muted)] hover:opacity-80" onClick={() => setDestModalOpen(false)}>×</button>
            <h3 className="text-xl font-bold mb-3">Change destination actor</h3>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={actorQuery}
                onChange={(e) => setActorQuery(e.target.value)}
                placeholder="Search actors"
                className="border border-[rgba(0,0,0,0.1)] rounded px-3 py-2 text-sm w-full bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-muted)] caret-[var(--color-text)]"
                aria-label="Search destination actor"
              />
              <button onClick={doActorSearch} className="px-3 py-2 rounded bg-[var(--color-brand)] text-black text-sm">Search</button>
              {searching && <span className="text-xs text-[var(--color-muted)]">Searching…</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {actorResults.map((p) => (
                <button key={p.id} onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('targetKind', 'person');
                  url.searchParams.set('targetId', String(p.id));
                  url.searchParams.delete('targetMediaType');
                  url.searchParams.delete('seed');
                  window.location.href = url.toString();
                }} className="bg-[var(--color-surface)] rounded border border-[rgba(0,0,0,0.06)] p-2 text-left hover:brightness-95">
                  <div className="h-28 bg-gray-200 mb-2">
                    {p.profile_path ? (
                      <img src={`https://image.tmdb.org/t/p/w300${p.profile_path}`} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="text-sm line-clamp-2">{p.name}</div>
                  <div className="text-xs text-[var(--color-muted)]">Set as destination</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        {path.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {path.map((n, i) => (
              <span key={`${n.kind}-${n.id}-${i}`} className="inline-flex items-center gap-2">
                {n.kind === 'title' ? (
                  <span className="px-2 py-1 rounded bg-[rgba(0,0,0,0.05)]">{n.title}</span>
                ) : (
                  <span className="px-2 py-1 rounded bg-[var(--color-surface)] border border-[rgba(0,0,0,0.06)]">{n.name}</span>
                )}
                {i < path.length - 1 && <span className="text-[var(--color-muted)]">→</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="text-[var(--color-muted)]">Loading…</div>}

      {!loading && frontier.length > 0 && current?.kind === 'title' && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Pick an actor from this title</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {frontier.map((p) => (
              p.kind === 'person' && (
                <button
                  key={`p-${p.id}`}
                  className="bg-[var(--color-surface)] rounded-lg shadow-[var(--shadow-low)] overflow-hidden hover:shadow-[var(--shadow-mid)] transition-shadow border border-[rgba(0,0,0,0.06)] text-left"
                  onClick={() => onPick(p)}
                >
                  <div className="h-36 sm:h-40 bg-gray-200 relative">
                    {p.profile_path ? (
                      <img src={`https://image.tmdb.org/t/p/w500${p.profile_path}`} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold">{p.name}</div>
                    {p.character && <div className="text-xs text-[var(--color-muted)]">as {p.character}</div>}
                  </div>
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {!loading && frontier.length > 0 && current?.kind === 'person' && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Pick a title starring this actor</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {frontier.map((t) => (
              t.kind === 'title' && (
                <button
                  key={`t-${t.id}`}
                  className="bg-[var(--color-surface)] rounded-lg shadow-[var(--shadow-low)] overflow-hidden hover:shadow-[var(--shadow-mid)] transition-shadow border border-[rgba(0,0,0,0.06)] text-left"
                  onClick={() => onPick(t)}
                >
                  <div className="h-36 sm:h-40 bg-gray-200 relative">
                    {t.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w500${t.poster_path}`} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold">{t.title}</div>
                    <div className="text-xs text-[var(--color-muted)]">{t.media_type === 'movie' ? 'Movie' : 'TV Show'}{t.release_year ? ` • ${t.release_year}` : ''}</div>
                  </div>
                </button>
              )
            ))}
          </div>
        </div>
      )}
      {/* Close container before modal */}
      </div>

      {(win || lose) && initData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-lg shadow-[var(--shadow-mid)] w-full max-w-md p-6 relative">
            <button
              aria-label="Close"
              className="absolute right-3 top-3 text-[var(--color-muted)] hover:opacity-80"
              onClick={() => { setWin(false); setLose(false); }}
            >
              ×
            </button>
            <h3 className="text-xl font-bold mb-2">{win ? 'Congratulations' : 'Out of moves'}</h3>
            <p className="text-[var(--color-muted)] mb-4">
              {win
                ? 'You achieved seven degrees! Why not share with your friends and see if they can match your skills'
                : 'Out of moves. Try again in another round or share your attempt.'}
            </p>
            <div className="space-y-3">
              <div className="bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.06)] rounded p-2 text-sm break-all">{shareUrl}</div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="px-3 py-2 rounded bg-[var(--color-brand)] text-white text-sm">Copy share link</button>
                <a
                  className="px-3 py-2 rounded bg-[var(--color-brand)] text-white text-sm"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I played Seven Degrees on Whats on Where!')}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share on X
                </a>
                <a
                  className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent('I achieved Seven Degrees on Whats on Where!')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share on Facebook
                </a>
                <button onClick={reset} className="px-3 py-2 rounded bg-green-600 text-white text-sm hover:brightness-95">Play again</button>
                <Link href="/" className="px-3 py-2 rounded bg-[var(--color-surface)] border border-[rgba(0,0,0,0.06)] text-sm hover:brightness-95">Back to search</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
