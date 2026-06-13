import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AutoPrint } from './AutoPrint';

function formatTime(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function formatQty(qty: number | null): string {
  if (qty === null) return '';
  return Number.isInteger(qty) ? String(qty) : parseFloat(qty.toFixed(2)).toString();
}

function groupBySection<T extends { section: string | null }>(items: T[]): { section: string | null; items: T[] }[] {
  const groups: { section: string | null; items: T[] }[] = [];
  const indexByKey = new Map<string, number>();
  for (const item of items) {
    const key = item.section ?? '__none__';
    let idx = indexByKey.get(key);
    if (idx === undefined) {
      idx = groups.length;
      indexByKey.set(key, idx);
      groups.push({ section: item.section, items: [] });
    }
    groups[idx].items.push(item);
  }
  return groups;
}

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
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

  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

  return (
    <>
      <AutoPrint recipeId={id} />

      <article className="max-w-2xl mx-auto px-8 py-12 print:px-0 print:py-0 font-sans text-stone-900">
        {/* En-tête */}
        <header className="mb-6 pb-4 border-b border-stone-300">
          <h1 className="text-3xl font-bold leading-tight mb-2">{recipe.title}</h1>

          {recipe.description && (
            <p className="text-stone-600 italic text-sm mb-3 leading-relaxed">
              {recipe.description}
            </p>
          )}

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {recipe.tags.map(tag => (
                <span key={tag.id} className="text-xs border border-stone-300 rounded-full px-2 py-0.5 text-stone-600">
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Méta : portions + temps */}
          <div className="flex flex-wrap gap-6 text-sm text-stone-600">
            {recipe.servings && (
              <span><strong className="text-stone-800">{recipe.servings}</strong> portion{recipe.servings > 1 ? 's' : ''}</span>
            )}
            {recipe.prepMinutes ? (
              <span>Préparation : <strong className="text-stone-800">{formatTime(recipe.prepMinutes)}</strong></span>
            ) : null}
            {recipe.cookMinutes ? (
              <span>Cuisson : <strong className="text-stone-800">{formatTime(recipe.cookMinutes)}</strong></span>
            ) : null}
            {totalMinutes > 0 && (recipe.prepMinutes || recipe.cookMinutes) ? (
              <span>Total : <strong className="text-stone-800">{formatTime(totalMinutes)}</strong></span>
            ) : null}
          </div>
        </header>

        {/* Corps sur 2 colonnes à l'impression */}
        <div className="print:grid print:grid-cols-[1fr_2fr] print:gap-8">
          {/* Ingrédients */}
          <section className="mb-8 print:mb-0">
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide text-stone-700 text-sm">Ingrédients</h2>
            <div className="space-y-4">
              {groupBySection(recipe.ingredients).map((group, gi) => (
                <div key={gi}>
                  {group.section && (
                    <h3 className="text-xs font-bold uppercase tracking-wide text-orange-700 mb-1.5">
                      {group.section}
                    </h3>
                  )}
                  <ul className="space-y-1.5">
                    {group.items.map(ing => (
                      <li key={ing.id} className="flex items-baseline gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                        <span>
                          {ing.quantity != null && (
                            <span className="font-semibold">
                              {formatQty(ing.quantity)}{ing.unit ? ` ${ing.unit}` : ''}{' '}
                            </span>
                          )}
                          {ing.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Étapes — numérotation redémarre par section */}
          <section className="mb-8 print:mb-0">
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide text-stone-700 text-sm">Préparation</h2>
            <div className="space-y-5">
              {groupBySection(recipe.steps).map((group, gi) => (
                <div key={gi}>
                  {group.section && (
                    <h3 className="text-xs font-bold uppercase tracking-wide text-orange-700 mb-2">
                      {group.section}
                    </h3>
                  )}
                  <ol className="space-y-3">
                    {group.items.map((step, i) => (
                      <li key={step.id} className="flex gap-3 text-sm">
                        <span className="shrink-0 w-5 h-5 mt-0.5 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center print:bg-stone-700">
                          {i + 1}
                        </span>
                        <p className="leading-relaxed text-stone-800">{step.text}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Notes personnelles */}
        {recipe.notes && (
          <section className="mt-6 pt-4 border-t border-stone-200">
            <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500 mb-2">Mes notes</h2>
            <p className="text-sm text-stone-700 whitespace-pre-wrap">{recipe.notes}</p>
          </section>
        )}

        {/* Source */}
        <footer className="mt-6 pt-4 border-t border-stone-200 text-xs text-stone-400">
          Source : {recipe.sourceUrl}
        </footer>
      </article>
    </>
  );
}
