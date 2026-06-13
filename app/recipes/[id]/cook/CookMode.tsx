'use client';

import { useState, useEffect, useRef } from 'react';

type Step = { id: string; text: string; order: number; section: string | null };

/** Extrait une durée en secondes depuis le texte d'une étape. */
function parseTimerSeconds(text: string): number | null {
  // "1 h 30 min", "1h30", "1 heure et 30 minutes"
  const combined = text.match(/(\d+)\s*h(?:eure?s?)?\s*(?:et\s*)?(\d+)\s*min/i);
  if (combined) return parseInt(combined[1]) * 3600 + parseInt(combined[2]) * 60;

  // "2 heures", "1h"
  const hoursOnly = text.match(/(\d+)\s*h(?:eure?s?)?\b/i);
  if (hoursOnly && !text.match(/\d+\s*min/i)) return parseInt(hoursOnly[1]) * 3600;

  // "5 minutes", "10 min"
  const mins = text.match(/(\d+)\s*min(?:ute?s?)?\b/i);
  if (mins) return parseInt(mins[1]) * 60;

  // "30 secondes"
  const secs = text.match(/(\d+)\s*sec(?:onde?s?)?\b/i);
  if (secs) return parseInt(secs[1]);

  return null;
}

function formatTimer(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      const start = ctx.currentTime + i * 0.4;
      gain.gain.setValueAtTime(0.4, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.start(start);
      osc.stop(start + 0.3);
    }
  } catch { /* AudioContext non dispo */ }
}

/**
 * Calcule la position de chaque étape DANS sa section (1-based) et la taille
 * de la section, pour afficher « Étape 2 sur 5 » par section et redémarrer
 * la numérotation à chaque sous-recette.
 */
function computeSectionLayout(steps: Step[]) {
  const sectionTotals = new Map<string, number>();
  for (const s of steps) {
    const key = s.section ?? '__none__';
    sectionTotals.set(key, (sectionTotals.get(key) ?? 0) + 1);
  }
  const counters = new Map<string, number>();
  return steps.map(s => {
    const key = s.section ?? '__none__';
    const pos = (counters.get(key) ?? 0) + 1;
    counters.set(key, pos);
    return { positionInSection: pos, totalInSection: sectionTotals.get(key)! };
  });
}

export function CookMode({ recipeId, title, steps }: { recipeId: string; title: string; steps: Step[] }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [initialSecs, setInitialSecs] = useState<number | null>(null);
  const [timerSecs, setTimerSecs] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const layout = computeSectionLayout(steps);
  const current = layout[stepIdx];
  const prevSection = stepIdx > 0 ? steps[stepIdx - 1].section : null;
  const showSectionHeader = steps[stepIdx].section !== null && steps[stepIdx].section !== prevSection;

  // Wake lock : empêche l'écran de s'éteindre
  useEffect(() => {
    (async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch { /* ignoré si refusé */ }
    })();
    return () => { wakeLockRef.current?.release(); };
  }, []);

  // Réinitialise la minuterie à chaque changement d'étape
  useEffect(() => {
    const detected = parseTimerSeconds(steps[stepIdx].text);
    setInitialSecs(detected);
    setTimerSecs(detected);
    setTimerRunning(false);
    setTimerDone(false);
    setCustomMinutes('');
  }, [stepIdx, steps]);

  // Décompte
  useEffect(() => {
    if (!timerRunning || timerSecs === null) return;
    if (timerSecs <= 0) {
      setTimerRunning(false);
      setTimerDone(true);
      playBeep();
      return;
    }
    const t = setTimeout(() => setTimerSecs(s => (s ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [timerRunning, timerSecs]);

  function resetTimer() {
    setTimerSecs(initialSecs);
    setTimerRunning(false);
    setTimerDone(false);
  }

  function applyCustomTimer() {
    const mins = parseFloat(customMinutes);
    if (!mins || mins <= 0) return;
    const secs = Math.round(mins * 60);
    setInitialSecs(secs);
    setTimerSecs(secs);
    setTimerRunning(false);
    setTimerDone(false);
    setCustomMinutes('');
  }

  const step = steps[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === steps.length - 1;

  return (
    <div className="min-h-screen bg-stone-950 text-white flex flex-col select-none">
      {/* Barre du haut */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-stone-800">
        <a
          href={`/recipes/${recipeId}`}
          className="text-stone-400 hover:text-white text-sm transition-colors"
        >
          ✕ Quitter
        </a>
        <p className="text-stone-300 text-sm font-medium truncate max-w-[60%] text-center">{title}</p>
        <span className="text-stone-400 text-sm tabular-nums">
          {stepIdx + 1} / {steps.length}
        </span>
      </header>

      {/* Étape */}
      <main className="flex-1 flex flex-col justify-center px-6 py-8 max-w-2xl mx-auto w-full">
        {/* En-tête de section (visible seulement à l'entrée d'une nouvelle section) */}
        {showSectionHeader && (
          <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-3">
            {steps[stepIdx].section}
          </p>
        )}

        {/* Numéro de l'étape — position dans la section */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-full bg-orange-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
            {current.positionInSection}
          </span>
          <span className="text-stone-400 text-sm">
            Étape {current.positionInSection} sur {current.totalInSection}
            {steps[stepIdx].section && ` · ${steps[stepIdx].section}`}
          </span>
        </div>

        {/* Texte de l'étape */}
        <p className="text-2xl leading-relaxed text-stone-100 font-medium mb-10">
          {step.text}
        </p>

        {/* Zone minuterie */}
        {timerSecs !== null ? (
          <div className={`rounded-2xl p-6 text-center transition-colors ${timerDone ? 'bg-green-900/40 border border-green-600' : 'bg-stone-900 border border-stone-700'}`}>
            {timerDone && (
              <p className="text-green-400 text-sm font-medium mb-2">✓ Minuterie terminée !</p>
            )}
            <p className={`text-5xl font-bold tabular-nums mb-4 ${timerDone ? 'text-green-400' : timerSecs < 30 && timerRunning ? 'text-orange-400' : 'text-white'}`}>
              {formatTimer(timerSecs)}
            </p>
            <div className="flex justify-center gap-3">
              {!timerDone && (
                <button
                  onClick={() => setTimerRunning(r => !r)}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl px-8 py-3 text-lg transition-colors"
                >
                  {timerRunning ? '⏸' : '▶'}
                </button>
              )}
              <button
                onClick={resetTimer}
                className="bg-stone-700 hover:bg-stone-600 text-white rounded-xl px-5 py-3 text-lg transition-colors"
              >
                ↺
              </button>
            </div>
          </div>
        ) : (
          /* Pas de minuterie détectée — champ manuel */
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={customMinutes}
              onChange={e => setCustomMinutes(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyCustomTimer()}
              placeholder="Minutes…"
              className="w-32 bg-stone-800 text-white border border-stone-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-stone-500"
            />
            <button
              onClick={applyCustomTimer}
              className="bg-stone-700 hover:bg-stone-600 text-white rounded-xl px-4 py-2 text-sm transition-colors"
            >
              + Minuterie
            </button>
          </div>
        )}
      </main>

      {/* Navigation bas */}
      <footer className="px-5 pb-8 pt-4 border-t border-stone-800">
        {/* Indicateurs de progression */}
        <div className="flex justify-center gap-1.5 mb-5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStepIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIdx ? 'w-6 bg-orange-500' : i < stepIdx ? 'w-1.5 bg-stone-500' : 'w-1.5 bg-stone-700'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => setStepIdx(i => i - 1)}
            disabled={isFirst}
            className="flex-1 bg-stone-800 hover:bg-stone-700 text-white font-medium rounded-2xl py-4 text-base disabled:opacity-30 transition-colors"
          >
            ← Précédente
          </button>
          {isLast ? (
            <a
              href={`/recipes/${recipeId}`}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white font-medium rounded-2xl py-4 text-base transition-colors text-center"
            >
              ✓ Terminé !
            </a>
          ) : (
            <button
              onClick={() => setStepIdx(i => i + 1)}
              className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl py-4 text-base transition-colors"
            >
              Suivante →
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
