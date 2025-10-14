export type ProviderKey = 'netflix' | 'disney' | 'prime' | 'appletv' | string;

export type Offer = {
  service?: string; // provider display name or key
  streamingType?: 'subscription' | 'buy' | 'rent' | 'free' | 'ads';
  link?: string;
  videoLink?: string;
  quality?: string;
};

export function normalizeProviderKey(name?: string): ProviderKey {
  const n = (name || '').toLowerCase().replace(/[^a-z0-9+]/g, '');
  if (n === 'amazonprimevideo' || n === 'primevideo' || n === 'prime') return 'prime';
  if (n === 'disney+' || n === 'disneyplus' || n === 'disney') return 'disney';
  if (n === 'appletv+' || n === 'appletvplus' || n === 'appletv') return 'appletv';
  if (n === 'netflix') return 'netflix';
  return n;
}

export type UserPrefs = {
  preferredProvider?: ProviderKey;
  openInApp?: boolean; // placeholder for possible app-scheme behavior
};

export function selectBestOffer(offers: Offer[], prefs?: UserPrefs): Offer | undefined {
  if (!Array.isArray(offers) || offers.length === 0) return undefined;
  const byKey = offers.reduce<Record<string, Offer[]>>((acc, o) => {
    const key = normalizeProviderKey(o.service);
    (acc[key] ||= []).push(o);
    return acc;
  }, {});

  // 1) Preferred provider
  if (prefs?.preferredProvider && byKey[prefs.preferredProvider]) {
    // prefer subscription over buy/rent
    const preferred = byKey[prefs.preferredProvider].find((o) => o.streamingType === 'subscription')
      || byKey[prefs.preferredProvider][0];
    if (preferred?.link) return preferred;
  }

  // 2) Any subscription offer
  const sub = offers.find((o) => o.streamingType === 'subscription' && o.link);
  if (sub) return sub;

  // 3) Fallback: any link
  return offers.find((o) => !!o.link) || offers[0];
}
