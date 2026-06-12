import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { DeleteButton } from './DeleteButton';

function formatTime(minutes: number | null): string | null {
  if (!minutes) return null;
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60 > 0 ? `${minutes % 60} min` : ''}`.trim();
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
      tags: true,
    },
  });

  if (!recipe || recipe.status !== 'READY') notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <Link href="/" className="text-stone-400 hover:text-orange-600 text-sm transition-colors">
        ← Toutes les recettes
      </Link>

      {/* Miniature */}
      {recipe.imageUrl && (
        <div className="relative aspect-video rounded-2xl overflow-hidden mt-4 bg-stone-100">
          <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
        </div>
      )}

      {/* En-tête */}
      <div className="mt-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-stone-900 leading-tight">{recipe.title}</h1>
          <span className="shrink-0 bg-stone-100 text-stone-500 text-xs px-2 py-1 rounded-full border border-stone-200 mt-1">
            {recipe.platform}
          </span>
        </div>

        {/* Méta */}
        <div className="flex flex-wrap gap-4 mt-4">
          {recipe.servings && (
            <div className="text-center">
              <p className="text-xs text-stone-400 uppercase tracking-wide">Portions</p>
              <p className="font-semibold text-stone-800">{recipe.servings}</p>
            </div>
          )}
          {recipe.prepMinutes && (
            <div className="text-center">
              <p className="text-xs text-stone-400 uppercase tracking-wide">Préparation</p>
              <p className="font-semibold text-stone-800">{formatTime(recipe.prepMinutes)}</p>
            </div>
          )}
          {recipe.cookMinutes && (
            <div className="text-center">
              <p className="text-xs text-stone-400 uppercase tracking-wide">Cuisson</p>
              <p className="font-semibold text-stone-800">{formatTime(recipe.cookMinutes)}</p>
            </div>
          )}
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {recipe.tags.map(tag => (
              <span key={tag.id} className="bg-orange-50 text-orange-700 text-xs px-3 py-1 rounded-full border border-orange-100">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <hr className="my-8 border-stone-200" />

      {/* Ingrédients */}
      <section>
        <h2 className="text-xl font-bold text-stone-900 mb-4">Ingrédients</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map(ing => (
            <li key={ing.id} className="flex items-baseline gap-2 text-stone-700">
              <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0 mt-1.5" />
              <span>
                {ing.quantity != null && (
                  <span className="font-medium text-stone-900">
                    {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}{' '}
                  </span>
                )}
                {ing.name}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <hr className="my-8 border-stone-200" />

      {/* Étapes */}
      <section>
        <h2 className="text-xl font-bold text-stone-900 mb-4">Préparation</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step, i) => (
            <li key={step.id} className="flex gap-4">
              <span className="shrink-0 w-7 h-7 rounded-full bg-orange-600 text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-stone-700 leading-relaxed pt-0.5">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <hr className="my-8 border-stone-200" />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
        >
          ▶ Voir la vidéo originale →
        </a>
        <DeleteButton recipeId={recipe.id} />
      </div>
    </main>
  );
}
