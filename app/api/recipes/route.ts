import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectPlatform } from '@/lib/platform';
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

  let platform: string;
  try {
    platform = detectPlatform(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Plateforme non supportée';
    return Response.json({ error: message }, { status: 400 });
  }

  // Crée l'entrée en BD immédiatement
  const recipe = await prisma.recipe.create({
    data: { title: 'Importation en cours…', sourceUrl: url, platform },
  });

  // Lance le pipeline après l'envoi de la réponse
  after(() => runPipeline(recipe.id, url));

  return Response.json({ id: recipe.id, status: recipe.status }, { status: 201 });
}
