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

export async function PUT(
  request: Request,
  ctx: RouteContext<'/api/recipes/[id]'>
) {
  const { id } = await ctx.params;
  const body = await request.json() as {
    title?: string;
    servings?: number | null;
    prepMinutes?: number | null;
    cookMinutes?: number | null;
    ingredients?: { quantity: number | null; unit: string | null; name: string; order: number }[];
    steps?: { text: string; order: number }[];
  };

  await prisma.recipe.update({
    where: { id },
    data: {
      title: body.title,
      servings: body.servings,
      prepMinutes: body.prepMinutes,
      cookMinutes: body.cookMinutes,
    },
  });

  if (body.ingredients) {
    await prisma.ingredient.deleteMany({ where: { recipeId: id } });
    await prisma.ingredient.createMany({
      data: body.ingredients.map(ing => ({ ...ing, recipeId: id })),
    });
  }

  if (body.steps) {
    await prisma.step.deleteMany({ where: { recipeId: id } });
    await prisma.step.createMany({
      data: body.steps.map(s => ({ ...s, recipeId: id })),
    });
  }

  return Response.json({ ok: true });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<'/api/recipes/[id]'>
) {
  const { id } = await ctx.params;
  const body = await request.json() as { notes?: string };
  const recipe = await prisma.recipe.update({
    where: { id },
    data: { notes: body.notes },
  });
  return Response.json({ notes: recipe.notes });
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
