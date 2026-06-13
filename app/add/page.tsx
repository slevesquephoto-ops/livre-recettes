'use client';

import { useState, useEffect, useRef } from 'react';

type Stage = 'idle' | 'submitting' | 'polling' | 'done' | 'error';

export default function AddPage() {
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState('PENDING');
  const [recipeTitle, setRecipeTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setStage('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json() as { id?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Erreur serveur');
      setRecipeId(data.id!);
      setStage('polling');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue');
      setStage('error');
    }
  }

  useEffect(() => {
    if (stage !== 'polling' || !recipeId) return;

    const check = async () => {
      try {
        const res = await fetch(`/api/recipes/${recipeId}`);
        const data = await res.json() as { status: string; title: string; errorMessage?: string };
        setDbStatus(data.status);
        if (data.status === 'READY') { setRecipeTitle(data.title); setStage('done'); }
        else if (data.status === 'ERROR') { setErrorMsg(data.errorMessage ?? 'Erreur lors du traitement'); setStage('error'); }
      } catch { /* ignore les erreurs réseau passagères */ }
    };

    check();
    intervalRef.current = setInterval(check, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [stage, recipeId]);

  useEffect(() => {
    if (stage === 'done' || stage === 'error') {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [stage]);

  const isProcessing = stage === 'submitting' || stage === 'polling';

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900 mb-2">Importer une recette</h1>
      <p className="text-stone-500 text-sm mb-8">Collez le lien d&apos;une vidéo YouTube, TikTok ou Facebook.</p>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label htmlFor="url" className="text-sm font-medium text-stone-700">
            URL de la vidéo
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="YouTube, TikTok ou Facebook..."
            required
            disabled={isProcessing || stage === 'done'}
            className="w-full bg-white text-stone-900 placeholder-stone-400 border border-stone-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-stone-50 disabled:text-stone-400"
          />
          <button
            type="submit"
            disabled={stage !== 'idle' && stage !== 'error'}
            className="w-full bg-orange-600 text-white rounded-lg px-6 py-3 font-medium text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            Importer
          </button>
        </form>

        {/* Traitement */}
        {isProcessing && (
          <div className="mt-6 flex flex-col items-center gap-3 text-stone-500">
            <svg className="animate-spin h-6 w-6 text-orange-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-sm text-center">
              {stage === 'submitting' ? 'Démarrage…'
                : dbStatus === 'PROCESSING' ? 'Analyse et structuration par IA…'
                : 'En attente de traitement…'}
            </p>
          </div>
        )}

        {/* Succès */}
        {stage === 'done' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="font-semibold text-green-800">{recipeTitle}</p>
            <p className="text-green-600 text-sm mt-1">Recette importée avec succès !</p>
            <button
              onClick={() => { setStage('idle'); setUrl(''); setRecipeId(null); setDbStatus('PENDING'); }}
              className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Importer une autre recette →
            </button>
          </div>
        )}

        {/* Erreur */}
        {stage === 'error' && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="font-semibold text-red-800 text-sm">Erreur lors de l&apos;importation</p>
            <p className="text-red-600 text-sm mt-1">{errorMsg}</p>
            <button
              onClick={() => { setStage('idle'); setErrorMsg(''); }}
              className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Réessayer →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
