'use client';

import { useEffect } from 'react';

export function AutoPrint({ recipeId }: { recipeId: string }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="print:hidden fixed top-4 left-4 flex gap-3 z-50">
      <a
        href={`/recipes/${recipeId}`}
        className="bg-white border border-stone-300 text-stone-600 text-sm font-medium rounded-lg px-4 py-2 shadow-sm hover:border-stone-400 transition-colors"
      >
        ← Retour
      </a>
      <button
        onClick={() => window.print()}
        className="bg-orange-600 text-white text-sm font-medium rounded-lg px-4 py-2 shadow-sm hover:bg-orange-700 transition-colors"
      >
        🖨 Imprimer / Enregistrer PDF
      </button>
    </div>
  );
}
