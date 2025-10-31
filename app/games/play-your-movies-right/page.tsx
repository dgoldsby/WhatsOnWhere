'use client';

import { useEffect, useMemo, useState } from 'react';

type Card = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number; // 0-10
};

type Stats = { gamesPlayed: number; bestStreak: number };

const CATEGORIES = [
  { key: 'comedy', label: 'Comedy' },
  { key: 'sci-fi', label: 'Sci Fi' },
  { key: 'rom-com', label: 'Rom Com' },
  { key: 'action', label: 'Action' },
  { key: 'family', label: 'Family' },
];

export default function PlayYourMoviesRightPage() {
  const [category, setCategory] = useState<string>('comedy');
  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0); // index of the CURRENT revealed card
  const [streak, setStreak] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [revealed, setRevealed] = useState(false); // reveal next card's rating
  const [gameOver, setGameOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ gamesPlayed: 0, bestStreak: 0 });
  const [counted, setCounted] = useState(false);

  const current = deck[index];
  const next = deck[index + 1];

  // Load stats
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pymr_stats');
      if (raw) {
        const parsed = JSON.parse(raw);
        setStats({ gamesPlayed: Number(parsed.gamesPlayed) || 0, bestStreak: Number(parsed.bestStreak) || 0 });
      }
    } catch {}
  }, []);

  // Fetch deck when category changes
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      setDeck([]);
      setIndex(0);
      setStreak(0);
      setRevealed(false);
      setGameOver(false);
      try {
        const res = await fetch(`/api/games/pymr/deck?category=${encodeURIComponent(category)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load deck');
        const d: Card[] = Array.isArray(data?.deck) ? data.deck : [];
        setDeck(d);
        // Count a game played on successful deck load
        if (!counted) {
          const nextStats = { ...stats, gamesPlayed: stats.gamesPlayed + 1 };
          setStats(nextStats);
          try { localStorage.setItem('pymr_stats', JSON.stringify(nextStats)); } catch {}
          setCounted(true);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load deck');
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const onGuess = async (dir: 'higher' | 'lower') => {
    if (!current || !next || flipping || revealed || gameOver) return;
    setFlipping(true);
    // small delay to play the flip animation
    setTimeout(() => {
      setRevealed(true);
      const cur = current.vote_average;
      const nxt = next.vote_average;
      const correct = dir === 'higher' ? nxt >= cur : nxt <= cur; // treat equal as correct for MVP
      if (correct) {
        setStreak((s) => s + 1);
        // after reveal, advance to next pair
        setTimeout(() => {
          setIndex((i) => i + 1);
          setRevealed(false);
          setFlipping(false);
        }, 700);
      } else {
        setGameOver(true);
        setFlipping(false);
        // update best streak
        const best = Math.max(stats.bestStreak, streak);
        if (best !== stats.bestStreak) {
          const nextStats = { ...stats, bestStreak: best };
          setStats(nextStats);
          try { localStorage.setItem('pymr_stats', JSON.stringify(nextStats)); } catch {}
        }
        // analytics log
        try { fetch('/api/analytics/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ game: 'play-your-movies-right', score: streak }) }); } catch {}
      }
    }, 300);
  };

  const reset = () => {
    setIndex(0);
    setStreak(0);
    setRevealed(false);
    setGameOver(false);
    setCounted(false);
    // trigger re-fetch by nudging category state to itself
    setCategory((c) => c);
  };

  const shareText = useMemo(() => `I scored ${streak} points at Play Your Movies Right! How will you do?`, [streak]);
  const shareUrl = useMemo(() => typeof window !== 'undefined' ? window.location.href : '', []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Play Your Movies Right</h1>
            <p className="text-[var(--color-muted)]">Guess if the next movie's TMDB rating is higher or lower.</p>
          </div>
          <div className="text-xs text-[var(--color-muted)] bg-[var(--color-surface)] border border-[rgba(0,0,0,0.06)] rounded px-2 py-1">
            <span>Games Played: <strong className="text-[var(--color-text)]">{stats.gamesPlayed}</strong></span>
            <span className="ml-3">Best Streak: <strong className="text-[var(--color-text)]">{stats.bestStreak}</strong></span>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`px-3 py-2 rounded border text-sm ${category === c.key ? 'bg-[var(--color-brand)] text-black border-transparent' : 'bg-[var(--color-surface)] text-[var(--color-text)] border-[rgba(0,0,0,0.1)]'}`}
              disabled={loading}
            >
              {c.label}
            </button>
          ))}
          <button onClick={reset} className="ml-auto px-3 py-2 rounded bg-green-600 text-white text-sm hover:brightness-95">New deck</button>
        </div>

        {error && <div className="text-red-600 text-sm mb-4">{String(error)}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Current card (revealed) */}
          <div className="flex justify-center">
            {current && (
              <div className="w-64 h-96 [perspective:1000px]">
                <div className="relative w-full h-full rounded-xl shadow-[var(--shadow-low)] border border-[rgba(0,0,0,0.06)] bg-[var(--color-surface)]">
                  <div className="p-3 text-center">
                    <div className="font-semibold line-clamp-2 h-10">{current.title}</div>
                  </div>
                  <div className="px-3">
                    <div className="h-48 bg-gray-200 rounded overflow-hidden">
                      {current.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w342${current.poster_path}`} alt={current.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">No Image</div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[rgba(0,0,0,0.05)]">
                      <span className="text-sm text-[var(--color-muted)]">TMDB Rating</span>
                      <span className="text-2xl font-extrabold leading-none">{current.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next card (flip to reveal) */}
          <div className="flex flex-col items-center gap-3">
            {next ? (
              <div className="w-64 h-96 [perspective:1000px]">
                <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${revealed ? '[transform:rotateY(180deg)]' : ''}`}>
                  {/* Back (facing) */}
                  <div className="absolute inset-0 rounded-xl shadow-[var(--shadow-low)] border border-[rgba(0,0,0,0.06)] bg-[var(--color-surface)] [backface-visibility:hidden] flex flex-col">
                    <div className="p-3 text-center">
                      <div className="font-semibold line-clamp-2 h-10">{next.title}</div>
                    </div>
                    <div className="px-3">
                      <div className="h-48 bg-gray-200 rounded overflow-hidden">
                        {next.poster_path ? (
                          <img src={`https://image.tmdb.org/t/p/w342${next.poster_path}`} alt={next.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">No Image</div>
                        )}
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[rgba(0,0,0,0.05)]">
                        <span className="text-sm text-[var(--color-muted)]">TMDB Rating</span>
                        <span className="text-2xl font-extrabold leading-none">{revealed ? next.vote_average.toFixed(1) : '?'}</span>
                      </div>
                    </div>
                  </div>
                  {/* Front (hidden until flip) */}
                  <div className="absolute inset-0 rounded-xl shadow-[var(--shadow-low)] border border-[rgba(0,0,0,0.06)] bg-[var(--color-brand)] text-black [transform:rotateY(180deg)] [backface-visibility:hidden] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-semibold">Next Card</div>
                      <div className="text-sm opacity-80">Higher or Lower?</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[var(--color-muted)]">No more cards — great job!</div>
            )}

            <div className="flex gap-2">
              <button disabled={!next || gameOver || flipping} onClick={() => onGuess('lower')} className="px-4 py-2 rounded bg-[var(--color-surface)] text-[var(--color-text)] border border-[rgba(0,0,0,0.1)] text-sm disabled:opacity-50">Lower</button>
              <button disabled={!next || gameOver || flipping} onClick={() => onGuess('higher')} className="px-4 py-2 rounded bg-[var(--color-brand)] text-black text-sm disabled:opacity-50">Higher</button>
            </div>

            <div className="text-sm text-[var(--color-muted)]">Current streak: <strong className="text-[var(--color-text)]">{streak}</strong></div>
          </div>
        </div>

        {gameOver && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-[var(--color-surface)] rounded-lg shadow-[var(--shadow-mid)] w-full max-w-md p-6 relative">
              <button aria-label="Close" className="absolute right-3 top-3 text-[var(--color-muted)] hover:opacity-80" onClick={() => setGameOver(false)}>×</button>
              <h3 className="text-xl font-bold mb-2">Game over</h3>
              <p className="text-[var(--color-muted)] mb-4">{shareText}</p>
              <div className="space-y-3">
                <div className="bg-[rgba(0,0,0,0.03)] border border-[rgba(0,0,0,0.06)] rounded p-2 text-sm break-all">{shareText} {shareUrl}</div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => navigator.clipboard.writeText(`${shareText} ${shareUrl}`)} className="px-3 py-2 rounded bg-[var(--color-brand)] text-black text-sm">Copy</button>
                  <a className="px-3 py-2 rounded bg-brand-red text-black text-sm" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">Share on X</a>
                  <a className="px-3 py-2 rounded bg-blue-600 text-white text-sm" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">Share on Facebook</a>
                  <button onClick={reset} className="px-3 py-2 rounded bg-green-600 text-white text-sm hover:brightness-95">Play again</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
