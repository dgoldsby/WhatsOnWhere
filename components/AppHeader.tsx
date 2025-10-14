'use client';

import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import SearchBar from './SearchBar';
import { useCallback, useMemo } from 'react';

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Hide header on home page as requested
  if (pathname === '/') return null;

  const q = searchParams.get('q') || '';

  const onSubmit = useCallback(
    (value?: string) => {
      const term = (value ?? q).trim();
      if (!term) return;
      const params = new URLSearchParams();
      params.set('q', term);
      router.push(`/?${params.toString()}`);
    },
    [router, q]
  );

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <a href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="Whats on Where" width={32} height={32} className="rounded" />
          <span className="font-semibold text-brand-black hidden sm:inline">Whats on Where</span>
        </a>
        <div className="flex-1" />
        <div className="w-full max-w-md">
          <SearchBar
            value={q}
            onChange={() => { /* controlled via query; no-op */ }}
            onSubmit={() => onSubmit()}
            size="small"
          />
        </div>
      </div>
    </header>
  );
}
