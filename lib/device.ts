export type Platform = 'ios' | 'android' | 'desktop';

export function detectPlatform(ua?: string): Platform {
  const s = (ua || (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase();
  if (/iphone|ipad|ipod/.test(s)) return 'ios';
  if (/android/.test(s)) return 'android';
  return 'desktop';
}
