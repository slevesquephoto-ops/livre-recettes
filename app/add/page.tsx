'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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

  // Polling du statut toutes les 2 secondes
  useEffect(() => {
    if (stage !== 'polling' || !recipeId) return;

    const check = async () => {
      try {
        const res = await fetch(`/api/recipes/${recipeId}`);
        const data = await res.json() as { status: string; title: string; errorMessage?: string };
        setDbStatus(data.status);

        if (data.status === 'READY') {
          setRecipeTitle(data.title);
          setStage('done');
        } else if (data.status === 'ERROR') {
          setErrorMsg(data.errorMessage ?? 'Erreur lors du traitement');
          setStage('error');
        }
      } catch {
        // Ignore les erreurs réseau passagères
      }
    };

    check();
    intervalRef.current = setInterval(check, 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [stage, recipeId]);

  // Arrête le polling quand on a une réponse définitive
  useEffect(() => {
    if (stage === 'done' || stage === 'error') {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [stage]);

  const statusLabel: Record<string, string> = {
    PENDING: 'En attente…',
    PROCESSING: 'Analyse de la vidéo et structuration par IA…',
  };

  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-amber-400 hover:text-amber-600 text-sm">← Livre</Link>
          <h1 className="text-2xl font-bold text-amber-900">Importer une recette</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
            disabled={stage === 'submitting' || stage === 'polling' || stage === 'done'}
            className="border border-amber-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-amber-50 disabled:text-amber-400"
          />
          <button
            type="submit"
            disabled={stage !== 'idle' && stage !== 'error'}
            className="bg-amber-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            Importer
          </button>
        </form>

        {/* Traitement en cours */}
        {(stage === 'submitting' || stage === 'polling') && (
          <div className="mt-6 text-center">
            <div className="text-3xl animate-spin inline-block">⏳</div>
            <p className="mt-2 text-amber-700 text-sm">
              {stage === 'submitting' ? 'Démarrage…' : (statusLabel[dbStatus] ?? 'Traitement en cours…')}
            </p>
            <div className="mt-3 flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Succès */}
        {stage === 'done' && (
          <div className="mt-6 text-center bg-green-50 rounded-xl p-5">
            <p className="text-3xl">✅</p>
            <p className="font-semibold text-green-800 mt-2">{recipeTitle}</p>
            <p className="text-green-600 text-sm mt-1">Recette importée avec succès !</p>
            <button
              onClick={() => { setStage('idle'); setUrl(''); setRecipeId(null); setDbStatus('PENDING'); }}
              className="mt-4 text-sm text-amber-600 underline"
            >
              Importer une autre recette
            </button>
          </div>
        )}

        {/* Erreur */}
        {stage === 'error' && (
          <div className="mt-6 bg-red-50 rounded-xl p-5 text-red-700">
            <p className="font-semibold">Erreur lors de l&apos;importation</p>
            <p className="text-sm mt-1">{errorMsg}</p>
            <button
              onClick={() => { setStage('idle'); setErrorMsg(''); }}
              className="mt-3 text-sm underline"
            >
              Réessayer
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
