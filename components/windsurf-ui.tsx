'use client';

// Windsurf UI — Single-file starter template (React + TypeScript + Tailwind)
// Incorporated into components/windsurf-ui.tsx for app usage

import React, { createContext, useContext, useEffect, useState } from 'react';

export const defaultTokens = {
  name: 'windsurf-default',
  colors: {
    bg: '#0f172a',
    surface: '#0b1220',
    muted: '#94a3b8',
    text: '#e6eef8',
    brand: '#06b6d4',
    brandAccent: '#5eead4'
  },
  radius: { sm: '6px', md: '12px', lg: '18px' },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px' },
  shadows: { low: '0 1px 6px rgba(2,6,23,0.45)', mid: '0 6px 20px rgba(2,6,23,0.55)' },
  fonts: { ui: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue"' }
};

function tokensToCSSVars(tokens: typeof defaultTokens) {
  const lines: string[] = [];
  Object.entries(tokens.colors).forEach(([k, v]) => lines.push(`--color-${k}: ${v};`));
  Object.entries(tokens.radius).forEach(([k, v]) => lines.push(`--radius-${k}: ${v};`));
  Object.entries(tokens.spacing).forEach(([k, v]) => lines.push(`--space-${k}: ${v};`));
  Object.entries(tokens.shadows).forEach(([k, v]) => lines.push(`--shadow-${k}: ${v};`));
  Object.entries(tokens.fonts).forEach(([k, v]) => lines.push(`--font-${k}: ${v};`));
  return lines.join('\n');
}

// Theme Provider
export type Theme = typeof defaultTokens;
const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void } | undefined>(undefined);

export const ThemeProvider: React.FC<{ initial?: Theme; children: React.ReactNode }> = ({ initial, children }) => {
  const [theme, setTheme] = useState<Theme>(initial ?? defaultTokens);

  // Load saved theme once on mount
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('windsurf_theme') : null;
      if (saved) {
        if (saved === altTheme.name) setTheme(altTheme);
        else if (saved === defaultTokens.name) setTheme(defaultTokens);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const css = tokensToCSSVars(theme);
    const root = document.documentElement;
    root.setAttribute('data-windsurf-theme', theme.name);
    root.style.cssText += '\n' + css;
    try { localStorage.setItem('windsurf_theme', theme.name); } catch {}
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

// Small utility components
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }> = ({ variant = 'primary', children, className = '', ...rest }) => {
  const base = 'px-4 py-2 rounded-[var(--radius-md)] font-medium shadow-[var(--shadow-low)] focus:outline-none';
  const variants: Record<string, string> = {
    primary: `bg-[var(--color-brand)] text-black hover:brightness-95`,
    ghost: `bg-transparent text-[var(--color-text)] border border-[rgba(0,0,0,0.06)] hover:bg-[rgba(0,0,0,0.02)]`,
    danger: `bg-red-500 text-white`
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className={`w-full px-3 py-2 rounded-[var(--radius-sm)] bg-transparent border border-[rgba(0,0,0,0.06)] placeholder:[var(--color-muted)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-brand)] ${props.className ?? ''}`}
  />
);

// AppShell (optional to adopt later)
export const AppShell: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-[var(--font-ui)] antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--color-surface)] flex items-center justify-center shadow-[var(--shadow-low)]">⚓</div>
            <div>
              <div className="text-lg font-semibold">{title ?? 'Windsurf UI'}</div>
              <div className="text-xs text-[var(--color-muted)]">Brandable marketing components</div>
            </div>
          </div>
        </header>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <main>{children}</main>
      </div>
      <footer className="mt-12 pb-12 text-center text-[var(--color-muted)]">© {new Date().getFullYear()} Windsurf UI</footer>
    </div>
  );
};

// Light alternative theme (exported)
export const altTheme: Theme = {
  ...defaultTokens,
  name: 'alt-mint',
  colors: { ...defaultTokens.colors, bg: '#f8fafc', surface: '#ffffff', text: '#0b1220', brand: '#0ea5a4', brandAccent: '#7dd3fc', muted: '#475569' }
};

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isAlt = theme.name === altTheme.name;
  return (
    <button
      onClick={() => setTheme(isAlt ? defaultTokens : altTheme)}
      className="px-3 py-2 rounded border border-[rgba(0,0,0,0.1)] bg-[var(--color-surface)] text-sm"
    >
      {isAlt ? 'Default theme' : 'Mint theme'}
    </button>
  );
};
