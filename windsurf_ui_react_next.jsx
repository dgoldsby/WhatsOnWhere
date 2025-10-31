// Windsurf UI — Single-file starter template (React + TypeScript + Tailwind)
// -------------------------------------------------------------
// Drop this file into a Next.js project (e.g. `components/windsurf-ui.tsx`) and
// follow the Tailwind config snippet below. This file contains:
//  - Design tokens (CSS variables)
//  - A small ThemeProvider to apply branding tokens
//  - Clean, non-generic components: AppShell, Search, ResultCard, Quiz, AdminTable
//  - Usage examples exported as React components
// -------------------------------------------------------------

import React, { createContext, useContext, useEffect, useState } from 'react';

// --------------------
// 1) Design tokens (JSON -> CSS variables)
// --------------------

export const defaultTokens = {
  name: 'windsurf-default',
  colors: {
    bg: '#0f172a', // neutral navy background (can be replaced)
    surface: '#0b1220',
    muted: '#94a3b8',
    text: '#e6eef8',
    brand: '#06b6d4',
    brandAccent: '#5eead4'
  },
  radius: {
    sm: '6px',
    md: '12px',
    lg: '18px'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px'
  },
  shadows: {
    low: '0 1px 6px rgba(2,6,23,0.45)',
    mid: '0 6px 20px rgba(2,6,23,0.55)'
  },
  fonts: {
    ui: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue"'
  }
};

// Helper that converts tokens to CSS variables string
function tokensToCSSVars(tokens: typeof defaultTokens) {
  const lines: string[] = [];
  Object.entries(tokens.colors).forEach(([k, v]) => lines.push(`--color-${k}: ${v};`));
  Object.entries(tokens.radius).forEach(([k, v]) => lines.push(`--radius-${k}: ${v};`));
  Object.entries(tokens.spacing).forEach(([k, v]) => lines.push(`--space-${k}: ${v};`));
  Object.entries(tokens.shadows).forEach(([k, v]) => lines.push(`--shadow-${k}: ${v};`));
  Object.entries(tokens.fonts).forEach(([k, v]) => lines.push(`--font-${k}: ${v};`));
  return lines.join('\n');
}

// --------------------
// 2) Theme Provider
// --------------------

type Theme = typeof defaultTokens;
const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void } | undefined>(undefined);

export const ThemeProvider: React.FC<{ initial?: Theme; children: React.ReactNode }> = ({ initial, children }) => {
  const [theme, setTheme] = useState<Theme>(initial ?? defaultTokens);

  useEffect(() => {
    const css = tokensToCSSVars(theme);
    const root = document.documentElement;
    // apply under a top-level data attribute so it's easy to scope in CSS
    root.setAttribute('data-windsurf-theme', theme.name);
    root.style.cssText += '\n' + css;
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

// --------------------
// 3) Small utility components (Button, Input)
// --------------------

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }> = ({ variant = 'primary', children, className = '', ...rest }) => {
  const base = 'px-4 py-2 rounded-[var(--radius-md)] font-medium shadow-[var(--shadow-low)] focus:outline-none';
  const variants: Record<string, string> = {
    primary: `bg-[var(--color-brand)] text-black hover:brightness-95`,
    ghost: `bg-transparent text-[var(--color-text)] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.02)]`,
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
    className={`w-full px-3 py-2 rounded-[var(--radius-sm)] bg-transparent border border-[rgba(255,255,255,0.06)] placeholder:[var(--color-muted)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-brand)] ${props.className ?? ''}`}
  />
);

// --------------------
// 4) AppShell (Navbar + Sidebar) — clean layout
// --------------------

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
          <div className="flex items-center gap-3">
            <SearchBar compact />
            <ThemeToggle />
          </div>
        </header>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <main>{children}</main>
      </div>

      <footer className="mt-12 pb-12 text-center text-[var(--color-muted)]">© {new Date().getFullYear()} Windsurf UI — made to brand</footer>
    </div>
  );
};

// --------------------
// 5) Search components
// --------------------

export const SearchBar: React.FC<{ compact?: boolean; placeholder?: string; onSearch?: (q: string) => void }> = ({ compact, placeholder = 'Search...', onSearch }) => {
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.(q);
      }}
      className={`${compact ? 'w-64' : 'w-full'} relative`}
    >
      <label className="sr-only">Search</label>
      <div className="flex items-center gap-2 bg-[var(--color-surface)] rounded-[var(--radius-md)] px-2 py-1 shadow-[var(--shadow-low)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-70">
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></path>
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"></circle>
        </svg>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className={`bg-transparent border-0 p-0 focus:ring-0 ${compact ? 'text-sm' : ''}`}
        />
        <Button type="submit" variant="primary" className="text-sm">Search</Button>
      </div>
    </form>
  );
};

export const ResultCard: React.FC<{ title: string; desc?: string; tags?: string[]; onClick?: () => void }> = ({ title, desc, tags = [], onClick }) => {
  return (
    <article
      onClick={onClick}
      className="group cursor-pointer p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-low)] hover:shadow-[var(--shadow-mid)] transition-shadow"
    >
      <h3 className="font-semibold text-lg group-hover:text-[var(--color-brand)]">{title}</h3>
      {desc && <p className="text-sm text-[var(--color-muted)] mt-2">{desc}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t} className="text-xs px-2 py-1 rounded-full bg-[rgba(255,255,255,0.03)]">{t}</span>
        ))}
      </div>
    </article>
  );
};

// --------------------
// 6) Quiz components (lightweight engine)
// --------------------

export const QuizCard: React.FC<{
  question: string;
  options: string[];
  onAnswer?: (index: number) => void;
  selectedIndex?: number | null;
}> = ({ question, options, onAnswer, selectedIndex = null }) => {
  return (
    <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-[var(--shadow-mid)] max-w-2xl">
      <div className="text-sm text-[var(--color-muted)]">Quiz</div>
      <h2 className="text-xl font-semibold mt-2">{question}</h2>
      <div className="mt-4 grid gap-3">
        {options.map((op, i) => {
          const sel = selectedIndex === i;
          return (
            <button
              key={i}
              onClick={() => onAnswer?.(i)}
              className={`text-left p-3 rounded-[var(--radius-md)] border border-transparent ${sel ? 'ring-2 ring-[var(--color-brand)] bg-[rgba(6,182,212,0.05)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}
            >
              {op}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --------------------
// 7) Admin Table (simple but elegant)
// --------------------

export const AdminTable: React.FC<{ columns: string[]; rows: Array<Record<string, React.ReactNode>> }> = ({ columns, rows }) => {
  return (
    <div className="rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface)] shadow-[var(--shadow-low)]">
      <table className="w-full table-auto text-sm">
        <thead>
          <tr className="text-[var(--color-muted)]">
            {columns.map((c) => (
              <th key={c} className="text-left px-4 py-3 border-b border-[rgba(255,255,255,0.02)]">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="hover:bg-[rgba(255,255,255,0.02)]">
              {columns.map((c) => (
                <td key={c} className="px-4 py-3 align-top">{r[c]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --------------------
// 8) Theme toggle (example of how to swap tokens)
// --------------------

const altTheme: typeof defaultTokens = {
  ...defaultTokens,
  name: 'alt-mint',
  colors: { ...defaultTokens.colors, bg: '#f8fafc', surface: '#ffffff', text: '#0b1220', brand: '#0ea5a4', brandAccent: '#7dd3fc', muted: '#475569' }
};

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isAlt = theme.name === altTheme.name;
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={() => setTheme(isAlt ? defaultTokens : altTheme)}>{isAlt ? 'Default' : 'Mint'}</Button>
    </div>
  );
};

// --------------------
// 9) Small example pages
// --------------------

export const SearchPageExample: React.FC = () => {
  const sampleResults = new Array(6).fill(0).map((_, i) => ({
    title: `Result ${i + 1}`,
    desc: `Short description for result ${i + 1}. Clean preview snippet that avoids looking generic.`,
    tags: ['news', 'tool']
  }));

  return (
    <AppShell title="Search / Discover">
      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="grid gap-4">
            {sampleResults.map((r, i) => (
              <ResultCard key={i} title={r.title} desc={r.desc} tags={r.tags} />
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-low)]">
            <div className="text-sm text-[var(--color-muted)]">Filters</div>
            <div className="mt-3 grid gap-2">
              <Input placeholder="Tag: e.g. news" />
              <Button variant="ghost">Apply</Button>
            </div>
          </div>

          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] shadow-[var(--shadow-low)]">
            <div className="text-sm text-[var(--color-muted)]">Explore</div>
            <div className="mt-2 text-sm">Curated lists, trending items, or small promos work well here.</div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
};

export const QuizPageExample: React.FC = () => {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <AppShell title="Play / Quiz">
      <div className="mt-8 grid place-items-center">
        <QuizCard
          question="Which UX principle helps make interfaces predictable?"
          options={["Consistency", "Randomness", "Opacity"]}
          selectedIndex={selected}
          onAnswer={(i) => setSelected(i)}
        />
        {selected !== null && <div className="mt-4 text-[var(--color-muted)]">You selected option {selected + 1}.</div>}
      </div>
    </AppShell>
  );
};

export const AdminPageExample: React.FC = () => {
  const columns = ['User', 'Email', 'Role', 'Actions'];
  const rows = [
    { User: 'Alex', Email: 'alex@example.com', Role: 'Admin', Actions: <Button variant="ghost">Edit</Button> },
    { User: 'Sam', Email: 'sam@example.com', Role: 'Editor', Actions: <Button variant="ghost">Edit</Button> }
  ];
  return (
    <AppShell title="Admin">
      <div className="mt-6">
        <AdminTable columns={columns} rows={rows} />
      </div>
    </AppShell>
  );
};

// --------------------
// 10) Export a tiny design tokens + tailwind guide (copy-paste)
// --------------------

export const tailwindGuide = `
// tailwind.config.js (snippet)
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // rely on CSS variables for brandable colors in runtime
      }
    }
  },
  plugins: []
};

/* Add base CSS (globals.css) */
:root[data-windsurf-theme] {
  /* the ThemeProvider injects variables for the active theme */
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-ui);
}
`;

// --------------------
// 11) Quick usage example (Next.js page)
// --------------------
export const UsageSnippet = `
import { ThemeProvider, SearchPageExample } from '@/components/windsurf-ui';

export default function Page() {
  return (
    <ThemeProvider>
      <SearchPageExample />
    </ThemeProvider>
  );
}
`;

// --------------------
// default export is intentionally omitted — consumers should import the pieces they need
// --------------------

// End of file
