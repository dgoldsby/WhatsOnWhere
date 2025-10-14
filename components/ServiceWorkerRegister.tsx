'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const swUrl = '/sw.js';
      navigator.serviceWorker
        .register(swUrl)
        .catch(() => {
          // no-op
        });
    }
  }, []);
  return null;
}
