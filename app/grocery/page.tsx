import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { GroceryList } from './GroceryList';
import type { GroceryItem } from './GroceryList';

function consolidate(
  recipes: { title: string; ingredients: { name: string; unit: string | null; quantity: number | null }[] }[]
): GroceryItem[] {
  const map = new Map<string, GroceryItem>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = `${ing.name.trim().toLowerCase()}||${(ing.unit ?? '').toLowerCase().trim()}`;
      const existing = map.get(key);
      if (existing) {
        // Additionne seulement si les deux ont une quantité
        if (existing.totalQty !== null && ing.quantity !== null) {
          existing.totalQty += ing.quantity;
        } else {
          existing.totalQty = null; // quantité inconnue → n'affiche pas de total
        }
        if (!existing.recipes.includes(recipe.title)) {
          existing.recipes.push(recipe.title);
        }
      } else {
        map.set(key, {
          name: ing.name.trim(),
          unit: ing.unit,
          totalQty: ing.quantity,
          recipes: [recipe.title],
        });
      }
    }
  }

  // Tri : ingrédients sans quantité à la fin, puis alphabétique
  return [...map.values()].sort((a, b) => {
    if (a.totalQty === null && b.totalQty !== null) return 1;
    if (a.totalQty !== null && b.totalQty === null) return -1;
    return a.name.localeCompare(b.name, 'fr');
  });
}

export default async function GroceryPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const idList = (ids ?? '').split(',').map(s => s.trim()).filter(Boolean);

  if (idList.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="text-stone-400 hover:text-orange-600 text-sm transition-colors">
          ← Retour
        </Link>
        <div className="text-center py-24 text-stone-400">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-lg font-medium text-stone-600">Aucune recette sélectionnée</p>
          <Link href="/" className="mt-4 inline-block text-sm text-orange-600 hover:text-orange-700 font-medium">
            Sélectionner des recettes →
          </Link>
        </div>
      </main>
    );
  }

  const recipes = await prisma.recipe.findMany({
    where: { id: { in: idList }, status: 'READY' },
    include: { ingredients: { orderBy: { order: 'asc' } } },
  });

  const items = consolidate(recipes);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 print:py-4">
      <Link href="/" className="text-stone-400 hover:text-orange-600 text-sm transition-colors print:hidden">
        ← Retour
      </Link>

      <h1 className="text-2xl font-bold text-stone-900 mt-6 mb-2">Liste d&apos;épicerie</h1>

      {/* Titres des recettes incluses */}
      <div className="flex flex-wrap gap-2 mb-6">
        {recipes.map(r => (
          <span key={r.id} className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full border border-orange-100">
            {r.title}
          </span>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
        <GroceryList items={items} recipeCount={recipes.length} />
      </div>
    </main>
  );
}
