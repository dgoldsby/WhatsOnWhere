import Link from 'next/link';
import Image from 'next/image';
import { getPerson, getPersonCombinedCredits } from '@/lib/tmdb';

export default async function PersonPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    throw new Error('Invalid person id');
  }

  const [person, credits] = await Promise.all([
    getPerson(id),
    getPersonCombinedCredits(id),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-brand-black hover:underline">← Back to search</a>
      </div>

      <h1 className="text-3xl font-extrabold text-brand-black mb-2">{person?.name || 'Person'}</h1>

      {credits && credits.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
          {credits.map((c) => (
            <Link href={`/title/${c.media_type}/${c.id}`} key={`${c.media_type}-${c.id}`} className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-card-hover transition-shadow border border-gray-100 block">
              <div className="h-48 bg-gray-200 relative">
                {c.poster_path ? (
                  // plain img to avoid extra config
                  <img src={`https://image.tmdb.org/t/p/w500${c.poster_path}`} alt={c.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-1 text-brand-black">{c.title}</h2>
                <p className="text-gray-600 text-sm">
                  {(c.media_type === 'movie' ? 'Movie' : 'TV Show')}{c.release_year ? ` • ${c.release_year}` : ''}
                </p>
                {c.character && <p className="text-gray-500 text-sm mt-1">as {c.character}</p>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 mt-4">No credits found.</p>
      )}
    </div>
  );
}
