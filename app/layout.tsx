import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { Suspense } from 'react';

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
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
