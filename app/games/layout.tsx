import Link from 'next/link';
import AppHeader from '@/components/AppHeader';

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-3xl font-extrabold text-brand-black">Games</h1>
          <p className="text-gray-700">Discover fun film and TV games.</p>
        </header>
        <nav className="mb-6 border-b border-gray-200">
          <ul className="flex gap-4 text-sm">
            <li>
              <Link href="/games" className="inline-block px-3 py-2 hover:underline">All Games</Link>
            </li>
            <li>
              <Link href="/games/seven-degrees" className="inline-block px-3 py-2 hover:underline">Seven Degrees</Link>
            </li>
            <li>
              <Link href="/games/play-your-movies-right" className="inline-block px-3 py-2 hover:underline">Play Your Movies Right</Link>
            </li>
          </ul>
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
