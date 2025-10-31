import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
// Global ThemeProvider is applied in RootLayout

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <AppHeader />
      <div className="container mx-auto px-4 py-6">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">Games</h1>
              <p className="text-[var(--color-muted)]">Discover fun film and TV games.</p>
            </div>
          </div>
        </header>
        <nav className="mb-6 border-b border-[rgba(0,0,0,0.06)]">
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
