import Image from 'next/image';

export default function AppHeader() {
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
      </div>
    </header>
  );
}
