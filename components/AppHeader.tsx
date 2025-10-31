import Image from 'next/image';
import { headers } from 'next/headers';
import { ThemeToggle } from '@/components/windsurf-ui';
import { detectRegionFromRequest } from '@/lib/region';

export default function AppHeader() {
  const h = headers();
  const path =
    h.get('x-matched-path') ||
    h.get('x-invoke-path') ||
    h.get('next-url') ||
    '';
  const region = detectRegionFromRequest();

  // Previously hidden on home page; now always visible to expose ThemeToggle globally

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
    <header className="w-full border-b border-[rgba(0,0,0,0.06)] bg-[var(--color-surface)] text-[var(--color-text)]">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <a href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="Whats on Where" width={32} height={32} className="rounded" />
          <span className="font-semibold hidden sm:inline">Whats on Where</span>
        </a>
        <div className="flex-1" />
        <form method="get" action="/" className="w-full max-w-md flex gap-2">
          <input type="hidden" name="region" value={region} />
          <input
            type="text"
            name="q"
            placeholder="Search for a movie or TV show..."
            className="flex-1 rounded-lg border border-[rgba(0,0,0,0.1)] px-3 py-2 text-sm bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
          />
          <button type="submit" className="bg-[var(--color-brand)] text-black rounded-lg px-4 py-2 text-sm hover:brightness-95">
            Search
          </button>
        </form>
        <div className="hidden sm:flex items-center gap-2">
          <a
            href="/go/prime"
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm bg-brand-yellow text-black border border-[rgba(0,0,0,0.06)] hover:brightness-95"
          >
            Try Prime Video
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
