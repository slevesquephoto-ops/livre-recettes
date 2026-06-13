'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Prisma } from '@/app/generated/prisma/client';

type Recipe = Prisma.RecipeGetPayload<{
  include: { ingredients: { orderBy: { order: 'asc' } }; steps: { orderBy: { order: 'asc' } } };
}>;

type IngRow = { id?: string; quantity: string; unit: string; name: string };
type StepRow = { id?: string; text: string };

export function EditForm({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [title, setTitle] = useState(recipe.title);
  const [servings, setServings] = useState(String(recipe.servings ?? ''));
  const [prepMinutes, setPrepMinutes] = useState(String(recipe.prepMinutes ?? ''));
  const [cookMinutes, setCookMinutes] = useState(String(recipe.cookMinutes ?? ''));
  const [ingredients, setIngredients] = useState<IngRow[]>(
    recipe.ingredients.map(i => ({ id: i.id, quantity: i.quantity != null ? String(i.quantity) : '', unit: i.unit ?? '', name: i.name }))
  );
  const [steps, setSteps] = useState<StepRow[]>(
    recipe.steps.map(s => ({ id: s.id, text: s.text }))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Ré-extraction
  const [reextractStage, setReextractStage] = useState<'idle' | 'pending' | 'done' | 'error'>('idle');
  const [reextractError, setReextractError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  function updateIngredient(i: number, field: keyof IngRow, value: string) {
    setIngredients(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  function addIngredient() {
    setIngredients(prev => [...prev, { quantity: '', unit: '', name: '' }]);
  }

  function removeIngredient(i: number) {
    setIngredients(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateStep(i: number, value: string) {
    setSteps(prev => prev.map((row, idx) => idx === i ? { ...row, text: value } : row));
  }

  function addStep() {
    setSteps(prev => [...prev, { text: '' }]);
  }

  function removeStep(i: number) {
    setSteps(prev => prev.filter((_, idx) => idx !== i));
  }

  function moveStep(i: number, dir: -1 | 1) {
    setSteps(prev => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          servings: servings ? parseInt(servings) : null,
          prepMinutes: prepMinutes ? parseInt(prepMinutes) : null,
          cookMinutes: cookMinutes ? parseInt(cookMinutes) : null,
          ingredients: ingredients
            .filter(i => i.name.trim())
            .map((i, order) => ({
              quantity: i.quantity ? parseFloat(i.quantity) : null,
              unit: i.unit.trim() || null,
              name: i.name.trim(),
              order,
            })),
          steps: steps
            .filter(s => s.text.trim())
            .map((s, order) => ({ text: s.text.trim(), order })),
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
      router.push(`/recipes/${recipe.id}`);
      router.refresh();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur inconnue');
      setSaving(false);
    }
  }

  async function handleReextract() {
    if (!confirm('Ré-extraire la recette avec l\'IA ? Les ingrédients et étapes actuels seront remplacés.')) return;
    setReextractStage('pending');
    setReextractError('');

    await fetch(`/api/recipes/${recipe.id}/reextract`, { method: 'POST' });

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/recipes/${recipe.id}`);
        const data = await res.json() as { status: string; errorMessage?: string };
        if (data.status === 'READY') {
          if (pollRef.current) clearInterval(pollRef.current);
          setReextractStage('done');
          router.push(`/recipes/${recipe.id}`);
          router.refresh();
        } else if (data.status === 'ERROR') {
          if (pollRef.current) clearInterval(pollRef.current);
          setReextractError(data.errorMessage ?? 'Erreur lors de la ré-extraction');
          setReextractStage('error');
        }
      } catch { /* ignore réseau */ }
    }, 2000);
  }

  const hasTranscript = Boolean((recipe as Recipe & { transcript?: string | null }).transcript);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <Link href={`/recipes/${recipe.id}`} className="text-stone-400 hover:text-orange-600 text-sm transition-colors">
        ← Retour à la recette
      </Link>

      <div className="mt-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-900">Modifier la recette</h1>

        {/* Bouton ré-extraction */}
        {hasTranscript && (
          <button
            type="button"
            onClick={handleReextract}
            disabled={reextractStage === 'pending'}
            className="flex items-center gap-2 text-sm font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
          >
            {reextractStage === 'pending' ? (
              <>
                <svg className="animate-spin h-4 w-4 text-orange-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Ré-extraction…
              </>
            ) : '↺ Ré-extraire avec l\'IA'}
          </button>
        )}
      </div>

      {reextractStage === 'error' && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {reextractError}
        </div>
      )}

      <form onSubmit={handleSave} className="mt-8 space-y-8">
        {/* Infos générales */}
        <section className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide">Informations générales</h2>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Titre</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Portions</label>
              <input
                type="number" min="1" value={servings}
                onChange={e => setServings(e.target.value)}
                className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Préparation (min)</label>
              <input
                type="number" min="0" value={prepMinutes}
                onChange={e => setPrepMinutes(e.target.value)}
                className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Cuisson (min)</label>
              <input
                type="number" min="0" value={cookMinutes}
                onChange={e => setCookMinutes(e.target.value)}
                className="w-full bg-white text-stone-900 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </section>

        {/* Ingrédients */}
        <section className="bg-white border border-stone-200 rounded-2xl p-6">
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-4">Ingrédients</h2>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text" placeholder="Qté" value={ing.quantity}
                  onChange={e => updateIngredient(i, 'quantity', e.target.value)}
                  className="w-16 bg-white text-stone-900 border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
                />
                <input
                  type="text" placeholder="Unité" value={ing.unit}
                  onChange={e => updateIngredient(i, 'unit', e.target.value)}
                  className="w-20 bg-white text-stone-900 border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="text" placeholder="Nom de l'ingrédient" value={ing.name}
                  onChange={e => updateIngredient(i, 'name', e.target.value)}
                  className="flex-1 bg-white text-stone-900 border border-stone-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button type="button" onClick={() => removeIngredient(i)}
                  className="text-stone-300 hover:text-red-500 text-lg leading-none px-1 transition-colors">×</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addIngredient}
            className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium">
            + Ajouter un ingrédient
          </button>
        </section>

        {/* Étapes */}
        <section className="bg-white border border-stone-200 rounded-2xl p-6">
          <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-4">Étapes</h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="shrink-0 w-6 h-6 mt-2 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <textarea
                  value={step.text}
                  onChange={e => updateStep(i, e.target.value)}
                  rows={2}
                  className="flex-1 bg-white text-stone-900 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <div className="flex flex-col gap-0.5 mt-1.5">
                  <button type="button" onClick={() => moveStep(i, -1)} disabled={i === 0}
                    className="text-stone-300 hover:text-stone-600 disabled:opacity-20 text-xs leading-none">▲</button>
                  <button type="button" onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1}
                    className="text-stone-300 hover:text-stone-600 disabled:opacity-20 text-xs leading-none">▼</button>
                  <button type="button" onClick={() => removeStep(i)}
                    className="text-stone-300 hover:text-red-500 text-base leading-none transition-colors">×</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addStep}
            className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium">
            + Ajouter une étape
          </button>
        </section>

        {saveError && (
          <p className="text-sm text-red-600">{saveError}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-orange-600 text-white rounded-lg px-6 py-2.5 font-medium text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
          <Link
            href={`/recipes/${recipe.id}`}
            className="bg-white text-stone-600 border border-stone-300 rounded-lg px-6 py-2.5 font-medium text-sm hover:border-stone-400 transition-colors"
          >
            Annuler
          </Link>
        </div>
      </form>
    </main>
  );
}
