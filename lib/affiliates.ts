import type { MediaType } from '@/types/media';

type Region = 'US' | 'GB' | string;

type ResolverArgs = {
  providerName: string;
  providerSlug: string;
  mediaType: MediaType;
  tmdbId: number;
  imdbId?: string;
  region: Region;
  platform?: 'ios' | 'android' | 'desktop';
};

const slugMap: Record<string, string> = {
  'amazon prime video': 'prime',
  'amazon': 'prime',
  'prime video': 'prime',
  'paramount+': 'paramount',
  'apple tv': 'appletv',
  'apple tv+': 'appletv',
  'now': 'now',
};

export function providerSlugFromName(name: string): string | undefined {
  const key = (name || '').toLowerCase().trim();
  return slugMap[key] || key.replace(/[^a-z0-9]+/g, '');
}

export function hasAffiliate(providerName: string, region: Region): boolean {
  const slug = providerSlugFromName(providerName);
  if (!slug) return false;
  if (slug === 'netflix') return false;
  const map = affiliateMap[region] || affiliateMap['US'] || {};
  return Boolean(map[slug]);
}

// Map slugs to resolvers per region
type Resolver = (args: ResolverArgs) => string | undefined;

const usResolvers: Record<string, Resolver> = {
  // Amazon generic Prime landing with associate tag
  prime: () => {
    const tag = process.env.NEXT_PUBLIC_AMAZON_TAG_US || process.env.AMAZON_TAG_US;
    return tag ? `https://www.amazon.com/gp/video/storefront?tag=${encodeURIComponent(tag)}` : undefined;
  },
  // Paramount+ landing
  paramount: () => {
    const url = process.env.NEXT_PUBLIC_PARAMOUNT_URL_US || process.env.PARAMOUNT_URL_US || 'https://www.paramountplus.com/';
    return url;
  },
  // Apple Services affiliate token via at=
  appletv: () => {
    const at = process.env.NEXT_PUBLIC_APPLE_AT || process.env.APPLE_AT;
    return at ? `https://tv.apple.com/?at=${encodeURIComponent(at)}` : 'https://tv.apple.com/';
  },
};

const gbResolvers: Record<string, Resolver> = {
  prime: () => {
    const tag = process.env.NEXT_PUBLIC_AMAZON_TAG_GB || process.env.AMAZON_TAG_GB;
    return tag ? `https://www.amazon.co.uk/gp/video/storefront?tag=${encodeURIComponent(tag)}` : undefined;
  },
  now: () => {
    // Awin or partner deep link if available
    return process.env.NEXT_PUBLIC_NOW_AFFILIATE_GB || process.env.NOW_AFFILIATE_GB || 'https://www.nowtv.com/';
  },
  appletv: () => {
    const at = process.env.NEXT_PUBLIC_APPLE_AT || process.env.APPLE_AT;
    return at ? `https://tv.apple.com/gb?at=${encodeURIComponent(at)}` : 'https://tv.apple.com/gb';
  },
  paramount: () => {
    const url = process.env.NEXT_PUBLIC_PARAMOUNT_URL_GB || process.env.PARAMOUNT_URL_GB || 'https://www.paramountplus.com/gb/';
    return url;
  },
};

export const affiliateMap: Record<string, Record<string, Resolver>> = {
  US: usResolvers,
  GB: gbResolvers,
};

export function resolveAffiliateUrlBySlug(slug: string, args: Omit<ResolverArgs, 'providerSlug'>): string | undefined {
  const region = args.region || 'US';
  const regionResolvers = affiliateMap[region] || affiliateMap['US'] || {};
  const resolver = regionResolvers[slug];
  if (!resolver) return undefined;
  return resolver({ ...args, providerSlug: slug });
}

export function resolveAffiliateUrl(args: ResolverArgs): string | undefined {
  const slug = args.providerSlug || providerSlugFromName(args.providerName);
  if (!slug) return undefined;
  const { providerSlug: _omit, ...rest } = args as any;
  return resolveAffiliateUrlBySlug(slug, rest);
}