import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  ctx: RouteContext<'/api/recipes/[id]'>
) {
  const { id } = await ctx.params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { orderBy: { order: 'asc' } },
      steps: { orderBy: { order: 'asc' } },
      tags: true,
    },
  });

  if (!recipe) {
    return Response.json({ error: 'Recette introuvable' }, { status: 404 });
  }

  return Response.json(recipe);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<'/api/recipes/[id]'>
) {
  const { id } = await ctx.params;
  try {
    await prisma.recipe.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: 'Recette introuvable' }, { status: 404 });
  }
}
