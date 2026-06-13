'use client';

import { useRouter } from 'next/navigation';
import { useRef } from 'react';

export function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? '';
    const params = new URLSearchParams(window.location.search);
    if (q) params.set('q', q);
    else params.delete('q');
    params.delete('page');
    router.push(`/?${params.toString()}`);
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = '';
    const params = new URLSearchParams(window.location.search);
    params.delete('q');
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <span className="absolute left-3 text-stone-400 dark:text-stone-500 pointer-events-none">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Rechercher par titre ou ingrédient…"
        className="w-full bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 border border-stone-300 dark:border-stone-700 rounded-xl pl-9 pr-20 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
      />
      <div className="absolute right-2 flex gap-1">
        {defaultValue && (
          <button type="button" onClick={handleClear} className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 px-1 text-lg leading-none">×</button>
        )}
        <button type="submit" className="bg-orange-600 text-white text-xs font-medium rounded-lg px-3 py-1.5 hover:bg-orange-700 transition-colors">
          OK
        </button>
      </div>
    </form>
  );
}
