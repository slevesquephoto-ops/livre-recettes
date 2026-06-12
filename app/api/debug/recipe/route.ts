import { extractYoutube } from '@/lib/youtube';
import { geminiProvider } from '@/lib/providers/gemini';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return Response.json({ error: 'Paramètre ?url= manquant' }, { status: 400 });
  }

  try {
    // Étape 1 : transcript YouTube
    const youtube = await extractYoutube(url);

    // Étape 2 : structuration par Gemini
    const recipe = await geminiProvider.extractRecipe(youtube.transcript, url);

    return Response.json({
      source: {
        title: youtube.title,
        channel: youtube.channel,
        imageUrl: youtube.imageUrl,
        durationSeconds: youtube.durationSeconds,
      },
      recipe,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: message }, { status: 500 });
  }
}
