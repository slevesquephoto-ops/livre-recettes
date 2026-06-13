import { prisma } from './prisma';
import { detectPlatform } from './platform';
import { extractYoutube } from './youtube';
import { runTranscribeScript } from './transcribe';
import { extractThumbnail } from './thumbnail';
import { geminiProvider } from './providers/gemini';

/** Relance uniquement l'extraction LLM sur le transcript déjà conservé. */
export async function reExtractRecipe(recipeId: string): Promise<void> {
  await prisma.recipe.update({ where: { id: recipeId }, data: { status: 'PROCESSING' } });

  try {
    const existing = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!existing?.transcript) throw new Error('Aucun transcript disponible pour ré-extraire');

    const recipe = await geminiProvider.extractRecipe(existing.transcript, existing.sourceUrl);

    // Remplace les ingrédients et étapes existants
    await prisma.ingredient.deleteMany({ where: { recipeId } });
    await prisma.step.deleteMany({ where: { recipeId } });

    await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        status: 'READY',
        title: recipe.title,
        servings: recipe.servings,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
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

    if (recipe.suggestedTags.length > 0) {
      const tags = await Promise.all(
        recipe.suggestedTags.map(name =>
          prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
        )
      );
      await prisma.recipe.update({
        where: { id: recipeId },
        data: { tags: { set: tags.map(t => ({ id: t.id })) } },
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    await prisma.recipe.update({ where: { id: recipeId }, data: { status: 'ERROR', errorMessage } });
  }
}

/** Exécute le pipeline complet pour une recette déjà créée en BD (status PENDING). */
export async function runPipeline(recipeId: string, url: string): Promise<void> {
  await prisma.recipe.update({
    where: { id: recipeId },
    data: { status: 'PROCESSING' },
  });

  try {
    const platform = detectPlatform(url);
    let transcript: string;
    let imageUrl: string | undefined;
    let title = 'Sans titre';

    if (platform === 'youtube') {
      // YouTube : transcript via API + métadonnées (titre, miniature)
      const yt = await extractYoutube(url);
      transcript = yt.transcript;
      imageUrl = yt.imageUrl;
      title = yt.title;
    } else {
      // TikTok / Facebook : audio via yt-dlp + transcription locale Whisper
      const cookiesPath = platform === 'facebook'
        ? (process.env.FB_COOKIES_PATH || undefined)
        : undefined;
      const [t, thumb] = await Promise.all([
        runTranscribeScript(url, cookiesPath),
        extractThumbnail(url, platform, cookiesPath),
      ]);
      transcript = t;
      imageUrl = thumb ?? undefined;
    }

    const recipe = await geminiProvider.extractRecipe(transcript, url);

    // Sauvegarde complète en une transaction
    await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        status: 'READY',
        title: recipe.title || title,
        imageUrl: imageUrl ?? null,
        servings: recipe.servings,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
        transcript,
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
