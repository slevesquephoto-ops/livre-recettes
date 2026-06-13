'use client';

import { useState } from 'react';

export type GroceryItem = {
  name: string;
  unit: string | null;
  totalQty: number | null;
  recipes: string[];
};

function formatQty(qty: number | null): string {
  if (qty === null) return '';
  return Number.isInteger(qty) ? String(qty) : parseFloat(qty.toFixed(2)).toString();
}

export function GroceryList({ items, recipeCount }: { items: GroceryItem[]; recipeCount: number }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const remaining = items.length - checked.size;

  return (
    <div>
      {/* Résumé */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-stone-500">
          {recipeCount} recette{recipeCount > 1 ? 's' : ''} · {items.length} articles
          {checked.size > 0 && <span className="text-green-600"> · {checked.size} dans le panier</span>}
        </p>
        <div className="flex gap-3">
          {checked.size > 0 && (
            <button onClick={() => setChecked(new Set())} className="text-xs text-stone-400 hover:text-stone-600">
              Tout décocher
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="text-xs text-stone-400 hover:text-stone-600 print:hidden"
          >
            🖨 Imprimer
          </button>
        </div>
      </div>

      {/* Liste */}
      <ul className="space-y-1.5">
        {items.map((item, i) => {
          const done = checked.has(i);
          return (
            <li key={i}>
              <label className="flex items-baseline gap-3 cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-stone-50 transition-colors">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggle(i)}
                  className="mt-0.5 shrink-0 accent-orange-600 w-4 h-4"
                />
                <span className={`flex-1 text-sm transition-opacity ${done ? 'line-through opacity-40' : ''}`}>
                  {item.totalQty !== null && (
                    <span className="font-semibold text-stone-900">
                      {formatQty(item.totalQty)}{item.unit ? ` ${item.unit}` : ''}{' '}
                    </span>
                  )}
                  <span className="text-stone-700">{item.name}</span>
                  {item.recipes.length > 1 && (
                    <span className="ml-2 text-xs text-stone-400">
                      ({item.recipes.join(', ')})
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {remaining === 0 && items.length > 0 && (
        <div className="mt-8 text-center text-stone-400">
          <p className="text-3xl mb-2">🛒</p>
          <p className="text-sm font-medium text-stone-600">Tout est dans le panier !</p>
        </div>
      )}
    </div>
  );
}
