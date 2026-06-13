'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import type { Prisma } from '@/app/generated/prisma/client';

type Recipe = Prisma.RecipeGetPayload<{
  include: { ingredients: { orderBy: { order: 'asc' } }; steps: { orderBy: { order: 'asc' } }; tags: true };
}>;

function scaleQty(qty: number | null, scale: number): string {
  if (qty === null) return '';
  const scaled = qty * scale;
  if (Number.isInteger(scaled)) return String(scaled);
  return parseFloat(scaled.toFixed(2)).toString();
}

/**
 * Regroupe une liste d'items par section, en préservant l'ordre d'apparition.
 * Items avec section=null sont regroupés dans un bloc unique sans titre.
 */
function groupBySection<T extends { section: string | null }>(items: T[]): { section: string | null; items: T[] }[] {
  const groups: { section: string | null; items: T[] }[] = [];
  const indexByKey = new Map<string, number>();
  for (const item of items) {
    const key = item.section ?? '__none__';
    let idx = indexByKey.get(key);
    if (idx === undefined) {
      idx = groups.length;
      indexByKey.set(key, idx);
      groups.push({ section: item.section, items: [] });
    }
    groups[idx].items.push(item);
  }
  return groups;
}

function formatTime(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function RecipeInteractive({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const originalServings = recipe.servings ?? 4;
  const [servings, setServings] = useState(originalServings);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState(recipe.notes ?? '');
  const [noteStatus, setNoteStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleting, setDeleting] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scale = servings / originalServings;

  function toggleIngredient(id: string) {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleStep(id: string) {
    setCheckedSteps(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    setNoteStatus('saving');
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: value }),
      });
      setNoteStatus('saved');
      setTimeout(() => setNoteStatus('idle'), 2000);
    }, 800);
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette recette définitivement ?')) return;
    setDeleting(true);
    await fetch(`/api/recipes/${recipe.id}`, { method: 'DELETE' });
    router.push('/');
    router.refresh();
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <Link href="/" className="text-stone-400 dark:text-stone-500 hover:text-orange-600 dark:hover:text-orange-400 text-sm transition-colors">
        ← Toutes les recettes
      </Link>

      {/* Miniature */}
      {recipe.imageUrl && (
        <div className="relative aspect-video rounded-2xl overflow-hidden mt-4 bg-stone-100 dark:bg-stone-800">
          <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
        </div>
      )}

      {/* Titre + plateforme */}
      <div className="mt-6 flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 leading-tight">{recipe.title}</h1>
        <span className="shrink-0 bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 text-xs px-2 py-1 rounded-full border border-stone-200 dark:border-stone-700 mt-1 capitalize">
          {recipe.platform}
        </span>
      </div>

      {/* Description */}
      {recipe.description && (
        <p className="mt-3 text-stone-600 dark:text-stone-400 italic leading-relaxed">
          {recipe.description}
        </p>
      )}

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {recipe.tags.map(tag => (
            <span key={tag.id} className="bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-xs px-3 py-1 rounded-full border border-orange-100 dark:border-orange-900">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Contrôle des portions + méta */}
      <div className="mt-6 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 flex flex-wrap gap-6 items-center">
        {/* Portions */}
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wide">Portions</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setServings(s => Math.max(1, s - 1))}
              className="w-7 h-7 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 font-bold text-lg flex items-center justify-center hover:border-orange-400 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-orange-400 transition-colors"
            >−</button>
            <span className="text-xl font-bold text-stone-900 dark:text-stone-100 min-w-[2ch] text-center">{servings}</span>
            <button
              onClick={() => setServings(s => s + 1)}
              className="w-7 h-7 rounded-full bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 font-bold text-lg flex items-center justify-center hover:border-orange-400 hover:text-orange-600 dark:hover:border-orange-500 dark:hover:text-orange-400 transition-colors"
            >+</button>
          </div>
          {scale !== 1 && (
            <button onClick={() => setServings(originalServings)} className="text-xs text-orange-500 hover:text-orange-700">
              reset ({originalServings})
            </button>
          )}
        </div>

        {recipe.prepMinutes && (
          <div className="text-center">
            <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wide">Préparation</p>
            <p className="font-semibold text-stone-800 dark:text-stone-200">{formatTime(recipe.prepMinutes)}</p>
          </div>
        )}
        {recipe.cookMinutes && (
          <div className="text-center">
            <p className="text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wide">Cuisson</p>
            <p className="font-semibold text-stone-800 dark:text-stone-200">{formatTime(recipe.cookMinutes)}</p>
          </div>
        )}
      </div>

      <hr className="my-8 border-stone-200 dark:border-stone-800" />

      {/* Ingrédients */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Ingrédients</h2>
          {checkedIngredients.size > 0 && (
            <button onClick={() => setCheckedIngredients(new Set())} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
              Tout décocher
            </button>
          )}
        </div>
        <div className="space-y-5">
          {groupBySection(recipe.ingredients).map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400 mb-2">
                  {group.section}
                </h3>
              )}
              <ul className="space-y-2">
                {group.items.map(ing => {
                  const checked = checkedIngredients.has(ing.id);
                  const qty = scaleQty(ing.quantity, scale);
                  return (
                    <li key={ing.id}>
                      <label className="flex items-baseline gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleIngredient(ing.id)}
                          className="mt-1 shrink-0 accent-orange-600 w-4 h-4"
                        />
                        <span className={`text-stone-700 dark:text-stone-300 leading-snug transition-opacity ${checked ? 'line-through opacity-40' : ''}`}>
                          {qty && (
                            <span className="font-semibold text-stone-900 dark:text-stone-100">
                              {qty}{ing.unit ? ` ${ing.unit}` : ''}{' '}
                            </span>
                          )}
                          {ing.name}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <hr className="my-8 border-stone-200 dark:border-stone-800" />

      {/* Étapes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Préparation</h2>
          {checkedSteps.size > 0 && (
            <button onClick={() => setCheckedSteps(new Set())} className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
              Tout décocher
            </button>
          )}
        </div>
        <div className="space-y-6">
          {groupBySection(recipe.steps).map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400 mb-3">
                  {group.section}
                </h3>
              )}
              <ol className="space-y-3">
                {group.items.map((step, i) => {
                  const checked = checkedSteps.has(step.id);
                  return (
                    <li key={step.id}>
                      <label className="flex gap-4 cursor-pointer">
                        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                          checked ? 'bg-green-500 text-white' : 'bg-orange-600 text-white'
                        }`}>
                          {checked ? '✓' : i + 1}
                        </span>
                        <div className="flex items-start gap-2 flex-1 pt-0.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStep(step.id)}
                            className="mt-1 shrink-0 accent-orange-600 w-4 h-4"
                          />
                          <p className={`text-stone-700 dark:text-stone-300 leading-relaxed transition-opacity ${checked ? 'line-through opacity-40' : ''}`}>
                            {step.text}
                          </p>
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <hr className="my-8 border-stone-200 dark:border-stone-800" />

      {/* Notes personnelles */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">📝 Mes notes</h2>
          <span className={`text-xs transition-opacity duration-300 ${noteStatus === 'idle' ? 'opacity-0' : 'opacity-100'} ${noteStatus === 'saved' ? 'text-green-600 dark:text-green-400' : 'text-stone-400 dark:text-stone-500'}`}>
            {noteStatus === 'saving' ? 'Sauvegarde…' : '✓ Sauvegardé'}
          </span>
        </div>
        <textarea
          value={notes}
          onChange={e => handleNotesChange(e.target.value)}
          placeholder="Mes variantes, astuces, prochaines fois…"
          rows={4}
          className="w-full bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 border border-stone-300 dark:border-stone-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        />
      </section>

      <hr className="my-8 border-stone-200 dark:border-stone-800" />

      {/* Mode cuisson */}
      {recipe.steps.length > 0 && (
        <div className="mb-8">
          <Link
            href={`/recipes/${recipe.id}/cook`}
            className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-2xl py-4 text-base transition-colors"
          >
            👨‍🍳 Mode cuisson
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
        >
          ▶ Voir la vidéo originale →
        </a>
        <div className="flex items-center gap-4">
          <Link
            href={`/recipes/${recipe.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            🖨️ Imprimer
          </Link>
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            ✏️ Modifier
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50 transition-colors"
          >
            {deleting ? 'Suppression…' : 'Supprimer la recette'}
          </button>
        </div>
      </div>
    </main>
  );
}
