import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runPipeline } from '@/lib/pipeline';

export async function POST(request: Request) {
  let url: string;
  try {
    const body = await request.json() as { url?: string };
    url = body.url?.trim() ?? '';
  } catch {
    return Response.json({ error: 'Corps JSON invalide' }, { status: 400 });
  }

  if (!url) {
    return Response.json({ error: 'Le champ url est requis' }, { status: 400 });
  }

  // Détection basique de la plateforme (YouTube seulement en Phase 1)
  const isYoutube = /youtube\.com|youtu\.be/.test(url);
  if (!isYoutube) {
    return Response.json(
      { error: 'Seules les URLs YouTube sont supportées pour l\'instant' },
      { status: 400 }
    );
  }

  // Crée l'entrée en BD immédiatement
  const recipe = await prisma.recipe.create({
    data: { title: 'Importation en cours…', sourceUrl: url, platform: 'youtube' },
  });

  // Lance le pipeline après l'envoi de la réponse
  after(() => runPipeline(recipe.id, url));

  return Response.json({ id: recipe.id, status: recipe.status }, { status: 201 });
}
