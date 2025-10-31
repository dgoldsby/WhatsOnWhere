import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import ThemeRoot from '@/components/ThemeRoot';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Whats on Where – Your one stop shop for streaming',
  description: 'Whats on Where helps you find where to watch movies and TV shows across all streaming platforms.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const disableHeader = process.env.NEXT_PUBLIC_DISABLE_HEADER === '1';
  const region = cookies().get('wow_region')?.value?.toUpperCase() || 'GB';
  return (
    <html lang="en" data-region={region}>
      <body className={`${inter.className} bg-[var(--color-bg)] text-[var(--color-text)]`}>
        <ThemeRoot>
          {children}
        </ThemeRoot>
        <ServiceWorkerRegister />
        {process.env.NODE_ENV === 'production' && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
