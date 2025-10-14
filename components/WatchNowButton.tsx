'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProviderKey, Offer, UserPrefs } from '@/lib/deeplink';
import { normalizeProviderKey, selectBestOffer } from '@/lib/deeplink';

const LS_KEY = 'wow_prefs_v1';

function loadPrefs(): UserPrefs | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as UserPrefs) : undefined;
  } catch {
    return undefined;
  }
}

export default function WatchNowButton({ offers }: { offers: Offer[] }) {
  const [prefs, setPrefs] = useState<UserPrefs | undefined>(undefined);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const best = useMemo(() => selectBestOffer(offers || [], prefs), [offers, prefs]);

  if (!offers || offers.length === 0 || !best?.link) return null;

  return (
    <a
      href={best.link}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 rounded bg-brand-black text-white text-sm hover:brightness-110"
    >
      Watch now{best.streamingType ? ` • ${best.streamingType}` : ''}
    </a>
  );
}
