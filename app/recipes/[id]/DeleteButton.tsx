'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeleteButton({ recipeId }: { recipeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Supprimer cette recette définitivement ?')) return;
    setLoading(true);
    await fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' });
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50 transition-colors"
    >
      {loading ? 'Suppression…' : 'Supprimer la recette'}
    </button>
  );
}
