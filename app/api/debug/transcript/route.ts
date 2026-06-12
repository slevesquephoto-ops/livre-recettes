import { extractYoutube } from '@/lib/youtube';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return Response.json({ error: 'Paramètre ?url= manquant' }, { status: 400 });
  }
  try {
    const data = await extractYoutube(url);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return Response.json({ error: message }, { status: 500 });
  }
}
