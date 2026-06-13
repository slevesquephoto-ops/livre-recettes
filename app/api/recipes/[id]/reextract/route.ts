import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { reExtractRecipe } from '@/lib/pipeline';

export async function POST(
  _request: Request,
  ctx: RouteContext<'/api/recipes/[id]/reextract'>
) {
  const { id } = await ctx.params;
  const recipe = await prisma.recipe.findUnique({ where: { id } });

  if (!recipe) return Response.json({ error: 'Recette introuvable' }, { status: 404 });
  if (!recipe.transcript) return Response.json({ error: 'Aucun transcript disponible' }, { status: 400 });

  await prisma.recipe.update({ where: { id }, data: { status: 'PENDING' } });
  after(() => reExtractRecipe(id));

  return Response.json({ status: 'PENDING' });
}
