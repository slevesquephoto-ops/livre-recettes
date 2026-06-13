'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Recipe = {
  id: string;
  title: string;
  platform: string;
  imageUrl: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  servings: number | null;
  tags: { id: string; name: string }[];
};

function timeLabel(prep: number | null, cook: number | null): string | null {
  const total = (prep ?? 0) + (cook ?? 0);
  if (total === 0) return null;
  return total < 60 ? `${total} min` : `${Math.floor(total / 60)}h${total % 60 > 0 ? (total % 60) : ''}`;
}

export function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function goToGrocery() {
    const ids = [...selected].join(',');
    router.push(`/grocery?ids=${encodeURIComponent(ids)}`);
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => {
          const isSelected = selected.has(recipe.id);
          return (
            <div key={recipe.id} className="relative group">
              {/* Checkbox de sélection */}
              <button
                type="button"
                onClick={() => toggle(recipe.id)}
                aria-label={isSelected ? 'Désélectionner' : 'Sélectionner pour la liste d\'épicerie'}
                className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'bg-white/80 dark:bg-stone-900/80 border-stone-300 dark:border-stone-600 opacity-0 group-hover:opacity-100'
                }`}
              >
                {isSelected && (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              <Link
                href={`/recipes/${recipe.id}`}
                className={`block bg-white dark:bg-stone-900 rounded-2xl border shadow-sm overflow-hidden hover:shadow-md transition-all ${
                  isSelected
                    ? 'border-orange-400 dark:border-orange-500 ring-2 ring-orange-200 dark:ring-orange-900'
                    : 'border-stone-200 dark:border-stone-800 hover:border-orange-200 dark:hover:border-orange-800'
                }`}
              >
                {/* Miniature */}
                <div className="relative aspect-video bg-stone-100 dark:bg-stone-800">
                  {recipe.imageUrl ? (
                    <Image
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">🍴</div>
                  )}
                  <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full capitalize">
                    {recipe.platform}
                  </span>
                </div>

                {/* Infos */}
                <div className="p-4">
                  <h2 className={`font-semibold leading-snug line-clamp-2 min-h-[2.75rem] transition-colors ${isSelected ? 'text-orange-700 dark:text-orange-400' : 'text-stone-900 dark:text-stone-100 group-hover:text-orange-600 dark:group-hover:text-orange-400'}`}>
                    {recipe.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-stone-400 dark:text-stone-500 text-xs">
                    {timeLabel(recipe.prepMinutes, recipe.cookMinutes) && (
                      <span>⏱ {timeLabel(recipe.prepMinutes, recipe.cookMinutes)}</span>
                    )}
                    {recipe.servings && <span>👤 {recipe.servings} pers.</span>}
                  </div>
                  {recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {recipe.tags.slice(0, 3).map(t => (
                        <span key={t.id} className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-xs px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-900">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Barre flottante de sélection */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-stone-900 dark:bg-stone-800 text-white rounded-2xl shadow-2xl px-5 py-3 border border-stone-700 dark:border-stone-600">
          <span className="text-sm">
            <span className="font-bold text-orange-400">{selected.size}</span> recette{selected.size > 1 ? 's' : ''} sélectionnée{selected.size > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-stone-400 hover:text-white text-lg leading-none transition-colors"
          >
            ×
          </button>
          <button
            onClick={goToGrocery}
            className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold rounded-xl px-4 py-1.5 transition-colors"
          >
            🛒 Liste d&apos;épicerie →
          </button>
        </div>
      )}
    </>
  );
}
