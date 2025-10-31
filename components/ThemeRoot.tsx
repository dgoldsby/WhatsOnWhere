'use client';

import React from 'react';
import { ThemeProvider, altTheme } from '@/components/windsurf-ui';

export default function ThemeRoot({ children }: { children: React.ReactNode }) {
  return <ThemeProvider initial={altTheme}>{children}</ThemeProvider>;
}
