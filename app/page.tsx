import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '@/app/components/SearchBar';

function timeLabel(prep: number | null, cook: number | null): string | null {
  const total = (prep ?? 0) + (cook ?? 0);
  if (total === 0) return null;
  return total < 60 ? `${total} min` : `${Math.floor(total / 60)}h${total % 60 > 0 ? (total % 60) : ''}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;
  const search = q?.trim() ?? '';
  const activeTag = tag?.trim() ?? '';

  const [recipes, allTags] = await Promise.all([
    prisma.recipe.findMany({
      where: {
        status: 'READY',
        ...(search && {
          OR: [
            { title: { contains: search } },
            { ingredients: { some: { name: { contains: search } } } },
          ],
        }),
        ...(activeTag && { tags: { some: { name: activeTag } } }),
      },
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { recipes: { where: { status: 'READY' } } } } },
    }),
  ]);

  const visibleTags = allTags.filter(t => t._count.recipes > 0);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* En-tête + barre de recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <SearchBar defaultValue={search} />
        </div>
        <p className="text-stone-400 text-sm shrink-0">
          {recipes.length} recette{recipes.length !== 1 ? 's' : ''}
          {(search || activeTag) ? ' trouvée' + (recipes.length !== 1 ? 's' : '') : ''}
        </p>
      </div>

      {/* Chips de tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/"
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
              !activeTag
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-stone-600 border-stone-300 hover:border-orange-400 hover:text-orange-600'
            }`}
          >
            Toutes
          </Link>
          {visibleTags.map(t => {
            const isActive = activeTag === t.name;
            const href = isActive ? (search ? `/?q=${encodeURIComponent(search)}` : '/') : `/?tag=${encodeURIComponent(t.name)}${search ? `&q=${encodeURIComponent(search)}` : ''}`;
            return (
              <Link
                key={t.id}
                href={href}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-stone-600 border-stone-300 hover:border-orange-400 hover:text-orange-600'
                }`}
              >
                {t.name}
                <span className="ml-1 opacity-60">({t._count.recipes})</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* État vide */}
      {recipes.length === 0 && (
        <div className="text-center py-24 text-stone-400">
          <p className="text-5xl mb-4">{search || activeTag ? '🔍' : '🍽️'}</p>
          <p className="text-lg font-medium text-stone-600">
            {search || activeTag ? 'Aucune recette ne correspond.' : 'Aucune recette pour l\'instant'}
          </p>
          {search || activeTag ? (
            <Link href="/" className="mt-4 inline-block text-sm text-orange-600 hover:text-orange-700 font-medium">
              Effacer les filtres →
            </Link>
          ) : (
            <Link href="/add" className="mt-6 inline-block bg-orange-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-orange-700 transition-colors text-sm">
              + Importer une recette
            </Link>
          )}
        </div>
      )}

      {/* Grille */}
      {recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="group block bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md hover:border-orange-200 transition-all"
            >
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
                <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full capitalize">
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
                    {recipe.tags.slice(0, 3).map(t => (
                      <span key={t.id} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full border border-orange-100">
                        {t.name}
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
