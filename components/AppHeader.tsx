import Image from 'next/image';
import { headers } from 'next/headers';

export default function AppHeader() {
  const h = headers();
  const path =
    h.get('x-matched-path') ||
    h.get('x-invoke-path') ||
    h.get('next-url') ||
    '';

  // Hide on home page
  if (path === '/') return null;

  // Allow future hiding via CSV prefixes (e.g., "/admin,/auth")
  const csv = process.env.NEXT_PUBLIC_SEARCH_HIDE_PREFIXES || '';
  if (csv) {
    const prefixes = csv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (prefixes.some((p) => path.startsWith(p))) return null;
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <a href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="Whats on Where" width={32} height={32} className="rounded" />
          <span className="font-semibold text-brand-black hidden sm:inline">Whats on Where</span>
        </a>
        <div className="flex-1" />
        <form method="get" action="/" className="w-full max-w-md flex gap-2">
          <input
            type="text"
            name="q"
            placeholder="Search for a movie or TV show..."
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-black"
          />
          <button type="submit" className="bg-brand-red text-white rounded-lg px-4 py-2 text-sm hover:brightness-95">
            Search
          </button>
        </form>
        <a
          href="/go/prime"
          className="hidden sm:inline-flex items-center rounded-lg px-3 py-2 text-sm bg-brand-yellow text-black border border-gray-200 hover:brightness-95"
        >
          Try Prime Video
        </a>
      </div>
    </header>
  );
}
