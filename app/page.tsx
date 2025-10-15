'use client';

import { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { hasAffiliate, providerSlugFromName } from '@/lib/affiliates';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const searchParams = useSearchParams();

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setHasSearched(true);
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Search failed');
      }
      const data = await response.json();
      setSearchResults(Array.isArray(data?.results) ? data.results : []);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch results. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    runSearch(searchQuery);
  };

  useEffect(() => {
    const q = searchParams?.get('q');
    if (q && q !== searchQuery) {
      setSearchQuery(q);
      // Kick off search for q arrived via header form
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-white">

        <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex flex-col items-center justify-center gap-3">
            <Image src="/icon.png" alt="Whats on Where" width={72} height={72} className="rounded-xl shadow-card" priority />
            <h1 className="text-4xl font-extrabold text-brand-black">Whats on Where</h1>
            <p className="text-gray-700">Your one stop shop for streaming</p>
            <div className="mt-1">
              <Link href="/games" className="text-sm text-brand-red hover:underline">Explore Games →</Link>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setHasSearched(false); }}
              placeholder="Search for a movie or TV show..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 bg-white text-brand-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-black"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-brand-red text-white px-6 py-3 rounded-lg hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-black focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {hasAffiliate('amazon prime video', (process.env.DEFAULT_REGION || 'US') as any) && (
            <div className="mt-4 text-center">
              <a
                href={`/go/prime?region=${(process.env.DEFAULT_REGION || 'US')}`}
                className="inline-block px-4 py-2 rounded bg-brand-yellow text-black text-sm font-semibold shadow-card hover:brightness-95 border border-gray-200"
              >
                Try Prime Video — Start your subscription
              </a>
            </div>
          )}
          <div className="mt-4 text-center">
            <Link href="/games/seven-degrees" className="inline-block px-4 py-2 rounded bg-brand-yellow text-black text-sm font-semibold shadow-card hover:brightness-95 border border-gray-200">
              NEW — Play "Seven Degrees" →
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-8" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((item) => (
              <Link href={`/title/${item.media_type}/${item.id}`} key={item.id} className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-card-hover transition-shadow border border-gray-100 block">
                <div className="h-48 bg-gray-200 relative">
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title || item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image Available
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 text-brand-black">{item.title || item.name}</h2>
                  <p className="text-gray-600 text-sm mb-3">
                    {item.media_type === 'movie'
                      ? `Movie${item.release_year ? ` • ${item.release_year}` : ''}`
                      : `TV Show${item.release_year ? ` • ${item.release_year}` : ''}`}
                  </p>
                  {/* Prime promo chip if available */}
                  {(() => {
                    const region = (process.env.DEFAULT_REGION || 'US') as string;
                    const flatrate = (item.providers?.flatrate || []) as any[];
                    const hasPrimeProvider = flatrate.some((p: any) => providerSlugFromName(p.provider_name) === 'prime');
                    if (hasAffiliate('amazon prime video', region) && (hasPrimeProvider || true)) {
                      return (
                        <div className="mb-2">
                          <a
                            href={`/go/prime?id=${item.id}&type=${item.media_type}&region=${region}`}
                            className="inline-flex items-center px-2 py-1 rounded bg-brand-yellow text-black text-xs font-semibold border border-gray-200 hover:brightness-95"
                          >
                            Watch with Prime Video
                          </a>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3">{item.overview}</p>
                  {(item.providers?.flatrate || item.providers?.buy || item.providers?.rent) && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Available on:</p>
                      <div className="flex flex-wrap gap-2">
                        {(item.providers?.flatrate || [])
                          .slice(0, 8)
                          .map((p: any) => (
                            <span key={p.provider_id} className="bg-brand-yellow text-black text-xs px-2 py-1 rounded">
                              {p.provider_name}
                            </span>
                          ))}
                        {(!item.providers?.flatrate || item.providers.flatrate.length === 0) && (item.providers?.buy || item.providers?.rent) && (
                          <span className="text-xs text-gray-600">Available to buy/rent</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {searchResults.length === 0 && !isLoading && hasSearched && (
          <div className="text-center text-gray-500 mt-12">
            No results found for "{searchQuery}"
          </div>
        )}
        </main>

        <footer className="bg-brand-black border-t border-gray-200 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
            <p className="text-white">© {new Date().getFullYear()} Whats on Where. Data provided by TMDB and JustWatch.</p>
            <p className="mt-2 text-gray-300">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
          </div>
        </footer>
      </div>
    </Suspense>
  );
}
