'use client';

import { useEffect, useState } from 'react';
import type { UserPrefs, ProviderKey } from '@/lib/deeplink';

const LS_KEY = 'wow_prefs_v1';

const PROVIDER_OPTIONS: { value: ProviderKey; label: string }[] = [
  { value: 'netflix', label: 'Netflix' },
  { value: 'disney', label: 'Disney+' },
  { value: 'prime', label: 'Prime Video' },
  { value: 'appletv', label: 'Apple TV' },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPrefs>({});
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setPrefs(JSON.parse(raw));
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(prefs));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      // ignore
    }
  };

  if (!loaded) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-brand-black hover:underline">← Back to home</a>
      </div>

      <h1 className="text-2xl font-bold text-brand-black mb-6">Settings</h1>

      <div className="max-w-xl space-y-6">
        <div>
          <label htmlFor="preferredProvider" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred provider
          </label>
          <select
            id="preferredProvider"
            value={prefs.preferredProvider || ''}
            onChange={(e) => setPrefs((p) => ({ ...p, preferredProvider: (e.target.value || undefined) as ProviderKey }))}
            className="border rounded px-3 py-2 w-full"
          >
            <option value="">No preference</option>
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Used for the "Watch now" button when multiple providers are available.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="openInApp"
            type="checkbox"
            checked={!!prefs.openInApp}
            onChange={(e) => setPrefs((p) => ({ ...p, openInApp: e.target.checked }))}
          />
          <label htmlFor="openInApp" className="text-sm text-gray-800">Prefer opening in native app when possible</label>
        </div>

        <div>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 rounded bg-brand-black text-white text-sm hover:brightness-110"
          >
            Save settings
          </button>
          {saved && <span className="ml-2 text-sm text-green-700">Saved</span>}
        </div>
      </div>
    </div>
  );
}
