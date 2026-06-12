import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';

function timeLabel(prep: number | null, cook: number | null): string | null {
  const total = (prep ?? 0) + (cook ?? 0);
  if (total === 0) return null;
  return total < 60 ? `${total} min` : `${Math.round(total / 6) / 10} h`;
}

export default async function Home() {
  const recipes = await prisma.recipe.findMany({
    where: { status: 'READY' },
    include: { tags: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Mes recettes</h1>
          <p className="text-stone-500 text-sm mt-1">{recipes.length} recette{recipes.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-24 text-stone-400">
          <p className="text-5xl mb-4">🍽️</p>
          <p className="text-lg font-medium text-stone-600">Aucune recette pour l&apos;instant</p>
          <p className="text-sm mt-2 mb-6">Importez votre première vidéo YouTube !</p>
          <Link href="/add" className="bg-orange-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-orange-700 transition-colors text-sm">
            + Importer une recette
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="group block bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md hover:border-orange-200 transition-all">
              {/* Miniature */}
              <div className="relative aspect-video bg-stone-100">
                {recipe.imageUrl ? (
                  <Image
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-4xl">🍴</div>
                )}
                <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {recipe.platform}
                </span>
              </div>

              {/* Infos */}
              <div className="p-4">
                <h2 className="font-semibold text-stone-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                  {recipe.title}
                </h2>

                <div className="flex items-center gap-3 mt-2 text-stone-400 text-xs">
                  {timeLabel(recipe.prepMinutes, recipe.cookMinutes) && (
                    <span>⏱ {timeLabel(recipe.prepMinutes, recipe.cookMinutes)}</span>
                  )}
                  {recipe.servings && <span>👤 {recipe.servings} pers.</span>}
                </div>

                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {recipe.tags.slice(0, 3).map(tag => (
                      <span key={tag.id} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-100">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
