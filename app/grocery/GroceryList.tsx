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

export function GroceryList({ items: initialItems, recipeCount, recipeNames }: {
  items: GroceryItem[];
  recipeCount: number;
  recipeNames: string[];
}) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState(false);

  function toggle(i: number) {
    if (isEditing) return;
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function updateItem(i: number, field: 'name' | 'unit' | 'totalQty', value: string) {
    setItems(prev => prev.map((item, idx) => {
      if (idx !== i) return item;
      if (field === 'totalQty') {
        const n = parseFloat(value);
        return { ...item, totalQty: value === '' ? null : isNaN(n) ? null : n };
      }
      if (field === 'unit') return { ...item, unit: value || null };
      return { ...item, [field]: value };
    }));
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
    setChecked(prev => {
      const next = new Set<number>();
      prev.forEach(n => { if (n < i) next.add(n); else if (n > i) next.add(n - 1); });
      return next;
    });
  }

  function addItem() {
    setItems(prev => [...prev, { name: '', unit: null, totalQty: null, recipes: [] }]);
  }

  const remaining = items.length - checked.size;

  return (
    <div>
      {/* Barre d'outils — masquée à l'impression */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {recipeCount} recette{recipeCount > 1 ? 's' : ''} · {items.length} articles
          {!isEditing && checked.size > 0 && (
            <span className="text-green-600 dark:text-green-400"> · {checked.size} dans le panier</span>
          )}
        </p>
        <div className="flex gap-3 items-center">
          {!isEditing && checked.size > 0 && (
            <button onClick={() => setChecked(new Set())} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
              Tout décocher
            </button>
          )}
          <button
            onClick={() => { setIsEditing(e => !e); setChecked(new Set()); }}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              isEditing
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-600 hover:border-orange-400 hover:text-orange-600'
            }`}
          >
            {isEditing ? '✓ Terminer' : '✏️ Modifier'}
          </button>
          <button
            onClick={() => window.print()}
            className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
          >
            🖨 Imprimer
          </button>
        </div>
      </div>

      {/* Liste */}
      <ul className="space-y-1.5">
        {items.map((item, i) => {
          const done = !isEditing && checked.has(i);
          return (
            <li key={i} className={`${isEditing ? '' : 'group'}`}>
              {isEditing ? (
                /* Mode édition : inputs */
                <div className="flex gap-2 items-center py-1">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.totalQty ?? ''}
                    onChange={e => updateItem(i, 'totalQty', e.target.value)}
                    placeholder="Qté"
                    className="w-16 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-600 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
                  />
                  <input
                    type="text"
                    value={item.unit ?? ''}
                    onChange={e => updateItem(i, 'unit', e.target.value)}
                    placeholder="Unité"
                    className="w-20 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-600 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    value={item.name}
                    onChange={e => updateItem(i, 'name', e.target.value)}
                    placeholder="Nom de l'article"
                    className="flex-1 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-600 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button type="button" onClick={() => removeItem(i)}
                    className="text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 text-xl leading-none transition-colors">×</button>
                </div>
              ) : (
                /* Mode consultation : case à cocher */
                <label className="flex items-baseline gap-3 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggle(i)}
                    className="mt-0.5 shrink-0 accent-orange-600 w-4 h-4 print:hidden"
                  />
                  {/* Version impression : puce simple */}
                  <span className="hidden print:inline w-4 shrink-0">□</span>
                  <span className={`flex-1 text-sm transition-opacity ${done ? 'line-through opacity-40' : ''}`}>
                    {item.totalQty !== null && (
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {formatQty(item.totalQty)}{item.unit ? ` ${item.unit}` : ''}{' '}
                      </span>
                    )}
                    <span className="text-stone-700 dark:text-stone-300">{item.name}</span>
                    {item.recipes.length > 1 && (
                      <span className="ml-2 text-xs text-stone-400 dark:text-stone-500 print:hidden">
                        ({item.recipes.join(', ')})
                      </span>
                    )}
                  </span>
                </label>
              )}
            </li>
          );
        })}
      </ul>

      {/* Bouton ajouter en mode édition */}
      {isEditing && (
        <button
          type="button"
          onClick={addItem}
          className="mt-3 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 font-medium print:hidden"
        >
          + Ajouter un article
        </button>
      )}

      {/* Message panier vide */}
      {!isEditing && remaining === 0 && items.length > 0 && (
        <div className="mt-8 text-center text-stone-400 print:hidden">
          <p className="text-3xl mb-2">🛒</p>
          <p className="text-sm font-medium text-stone-600 dark:text-stone-400">Tout est dans le panier !</p>
        </div>
      )}

      {/* Pied de page impression : noms des recettes */}
      <div className="hidden print:block mt-6 pt-4 border-t border-stone-200 text-xs text-stone-400">
        Recettes : {recipeNames.join(', ')}
      </div>
    </div>
  );
}
