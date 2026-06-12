import { prisma } from './prisma';
import { extractYoutube } from './youtube';
import { geminiProvider } from './providers/gemini';

/** Exécute le pipeline complet pour une recette déjà créée en BD (status PENDING). */
export async function runPipeline(recipeId: string, url: string): Promise<void> {
  await prisma.recipe.update({
    where: { id: recipeId },
    data: { status: 'PROCESSING' },
  });

  try {
    const youtube = await extractYoutube(url);
    const recipe = await geminiProvider.extractRecipe(youtube.transcript, url);

    // Sauvegarde complète en une transaction
    await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        status: 'READY',
        title: recipe.title,
        imageUrl: youtube.imageUrl,
        servings: recipe.servings,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        transcript: youtube.transcript,
        ingredients: {
          create: recipe.ingredients.map((ing, i) => ({
            quantity: ing.quantity,
            unit: ing.unit,
            name: ing.name,
            order: i,
          })),
        },
        steps: {
          create: recipe.steps.map((text, i) => ({ order: i, text })),
        },
      },
    });

    // Tags : upsert puis connexion à la recette
    if (recipe.suggestedTags.length > 0) {
      const tags = await Promise.all(
        recipe.suggestedTags.map(name =>
          prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
        )
      );
      await prisma.recipe.update({
        where: { id: recipeId },
        data: { tags: { connect: tags.map(t => ({ id: t.id })) } },
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    await prisma.recipe.update({
      where: { id: recipeId },
      data: { status: 'ERROR', errorMessage },
    });
  }
}
