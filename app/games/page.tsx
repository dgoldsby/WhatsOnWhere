import Link from 'next/link';

export default function GamesIndexPage() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-card overflow-hidden border border-gray-100">
          <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-center">
            {/* Chain icon for connections */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M10 14a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 10a5 5 0 0 1 0 7L12.5 19.5a5 5 0 1 1-7-7L7 11" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="p-4">
            <h2 className="text-xl font-semibold text-brand-black mb-1">Seven Degrees</h2>
            <p className="text-gray-700 text-sm mb-3">Connect from a start title to the destination in seven moves or fewer.</p>
            <Link href="/games/seven-degrees" className="inline-flex items-center px-3 py-2 rounded bg-brand-black text-white text-sm hover:brightness-95">
              Play Seven Degrees
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card overflow-hidden border border-gray-100">
          <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center justify-center">
            {/* Playing card icon */}
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="6" y="3" width="12" height="18" rx="2" stroke="#111827" strokeWidth="1.5"/>
              <circle cx="12" cy="9" r="2" fill="#EF4444"/>
              <circle cx="12" cy="15" r="2" fill="#111827"/>
            </svg>
          </div>
          <div className="p-4">
            <h2 className="text-xl font-semibold text-brand-black mb-1">Play Your Movies Right</h2>
            <p className="text-gray-700 text-sm mb-3">Guess if the next movie's TMDB rating is higher or lower. How long can your streak go?</p>
            <Link href="/games/play-your-movies-right" className="inline-flex items-center px-3 py-2 rounded bg-brand-black text-white text-sm hover:brightness-95">
              Play Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
