import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { SearchBar } from '@/app/components/SearchBar';
import { RecipeGrid } from '@/app/components/RecipeGrid';

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
        <p className="text-stone-400 dark:text-stone-500 text-sm shrink-0">
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
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-orange-400 hover:text-orange-600 dark:hover:border-orange-600 dark:hover:text-orange-400'
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
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border-stone-300 dark:border-stone-700 hover:border-orange-400 hover:text-orange-600 dark:hover:border-orange-600 dark:hover:text-orange-400'
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
          <p className="text-lg font-medium text-stone-600 dark:text-stone-400">
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
      {recipes.length > 0 && <RecipeGrid recipes={recipes} />}
    </main>
  );
}
