'use client';

import { useState } from 'react';

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  onSubmit?: (v: string) => void;
  placeholder?: string;
  size?: 'large' | 'small';
  disabled?: boolean;
};

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search for a movie or TV show...', size = 'small', disabled }: Props) {
  const [internal, setInternal] = useState(value || '');
  const controlled = typeof value === 'string';
  const val = controlled ? value! : internal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    onSubmit?.(val);
  };

  const baseInput = 'flex-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-black';
  const baseBtn = 'text-white rounded-lg hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-brand-black focus:ring-offset-2 disabled:opacity-50';

  const inputClass = size === 'large' ? `${baseInput} px-4 py-3` : `${baseInput} px-3 py-2 text-sm`;
  const btnClass = size === 'large' ? `${baseBtn} bg-brand-red px-6 py-3` : `${baseBtn} bg-brand-red px-4 py-2 text-sm`;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <input
        type="text"
        value={val}
        onChange={(e) => {
          controlled ? onChange?.(e.target.value) : setInternal(e.target.value);
        }}
        placeholder={placeholder}
        className={inputClass}
        disabled={disabled}
      />
      <button type="submit" className={btnClass} disabled={disabled}>
        Search
      </button>
    </form>
  );
}
