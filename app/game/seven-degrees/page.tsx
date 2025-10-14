'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type MediaType = 'movie' | 'tv';

type TitleNode = { kind: 'title'; id: number; media_type: MediaType; title: string; poster_path: string | null; release_year?: number };
type PersonNode = { kind: 'person'; id: number; name: string; profile_path: string | null; character?: string };

type InitPayload = {
  seed: number;
  start: TitleNode;
  target: PersonNode;
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
  const [loading, setLoading] = useState(true);
  const [initData, setInitData] = useState<InitPayload | null>(null);
  const [path, setPath] = useState<Array<TitleNode | PersonNode>>([]);
  const [frontier, setFrontier] = useState<Array<TitleNode | PersonNode>>([]);
  const [movesLeft, setMovesLeft] = useState(7);
  const [win, setWin] = useState(false);
  const [lose, setLose] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const qs = seedParam ? `?seed=${encodeURIComponent(seedParam)}` : '';
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
  }, [seedParam]);

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
    if (node.kind === 'person' && node.id === initData.target.id) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <a href="/" className="text-sm text-brand-black hover:underline">← Back to search</a>
        <Link href="/settings" className="text-sm text-brand-black hover:underline">Settings</Link>
      </div>

      <h1 className="text-3xl font-extrabold text-brand-black mb-4">Seven Degrees</h1>

      {initData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-card border border-gray-100 overflow-hidden">
              <div className="h-64 bg-gray-200 relative">
                {initData.start.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w500${initData.start.poster_path}`} alt={initData.start.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-brand-black">Start</h2>
                <p className="text-brand-black">{initData.start.title}</p>
                <p className="text-gray-600 text-sm">{initData.start.media_type === 'movie' ? 'Movie' : 'TV Show'}{initData.start.release_year ? ` • ${initData.start.release_year}` : ''}</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-gray-600">Moves left</div>
              <div className="text-4xl font-extrabold text-brand-black">{movesLeft}</div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-card border border-gray-100 overflow-hidden">
              <div className="h-64 bg-gray-200 relative">
                {initData.target.profile_path ? (
                  <img src={`https://image.tmdb.org/t/p/w500${initData.target.profile_path}`} alt={initData.target.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-brand-black">Target actor</h2>
                <p className="text-brand-black">{initData.target.name}</p>
              </div>
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
                  <span className="px-2 py-1 rounded bg-gray-100">{n.title}</span>
                ) : (
                  <span className="px-2 py-1 rounded bg-gray-100">{n.name}</span>
                )}
                {i < path.length - 1 && <span className="text-gray-400">→</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {loading && <div className="text-gray-600">Loading…</div>}

      {!loading && frontier.length > 0 && current?.kind === 'title' && (
        <div>
          <h2 className="text-lg font-semibold text-brand-black mb-2">Pick an actor from this title</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {frontier.map((p) => (
              p.kind === 'person' && (
                <button
                  key={`p-${p.id}`}
                  className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-card-hover transition-shadow border border-gray-100 text-left"
                  onClick={() => onPick(p)}
                >
                  <div className="h-40 bg-gray-200 relative">
                    {p.profile_path ? (
                      <img src={`https://image.tmdb.org/t/p/w500${p.profile_path}`} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold text-brand-black">{p.name}</div>
                    {p.character && <div className="text-xs text-gray-600">as {p.character}</div>}
                  </div>
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {!loading && frontier.length > 0 && current?.kind === 'person' && (
        <div>
          <h2 className="text-lg font-semibold text-brand-black mb-2">Pick a title starring this actor</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {frontier.map((t) => (
              t.kind === 'title' && (
                <button
                  key={`t-${t.id}`}
                  className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-card-hover transition-shadow border border-gray-100 text-left"
                  onClick={() => onPick(t)}
                >
                  <div className="h-40 bg-gray-200 relative">
                    {t.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w500${t.poster_path}`} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-semibold text-brand-black">{t.title}</div>
                    <div className="text-xs text-gray-600">{t.media_type === 'movie' ? 'Movie' : 'TV Show'}{t.release_year ? ` • ${t.release_year}` : ''}</div>
                  </div>
                </button>
              )
            ))}
          </div>
        </div>
      )}

      {(win || lose) && initData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-brand-black mb-2">{win ? 'You did it!' : 'Out of moves'}</h3>
            <p className="text-gray-700 mb-4">
              {win ? 'You reached the target actor within the move limit.' : 'Try again with a new seed or share your attempt.'}
            </p>
            <div className="space-y-3">
              <div className="bg-gray-50 border rounded p-2 text-sm break-all">{shareUrl}</div>
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(shareUrl)} className="px-3 py-2 rounded bg-brand-black text-white text-sm">Copy share link</button>
                <a
                  className="px-3 py-2 rounded bg-brand-red text-white text-sm"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('I played Seven Degrees on Whats on Where!')}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share on X
                </a>
                <button onClick={reset} className="px-3 py-2 rounded bg-gray-200 text-sm">Play again</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
