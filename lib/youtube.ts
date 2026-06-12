import { YoutubeTranscript } from 'youtube-transcript';

/** Extrait l'ID vidéo depuis les formats d'URL YouTube courants */
function extractVideoId(url: string): string {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  throw new Error(`Impossible d'extraire l'ID vidéo depuis : ${url}`);
}

/** Récupère le transcript : priorité fr → en → sans langue spécifiée */
async function fetchTranscript(videoId: string): Promise<string> {
  for (const lang of ['fr', 'en']) {
    try {
      const lines = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      if (lines.length > 0) return lines.map(l => l.text).join(' ');
    } catch {
      // Essaie la langue suivante
    }
  }
  // Dernier recours : laisser YouTube choisir la langue
  const lines = await YoutubeTranscript.fetchTranscript(videoId);
  if (lines.length === 0) throw new Error('Transcript vide pour cette vidéo.');
  return lines.map(l => l.text).join(' ');
}

interface OEmbedData {
  title: string;
  imageUrl: string;
  channel: string;
}

/** Titre, miniature et nom de chaîne via l'API oEmbed YouTube (sans clé API) */
async function fetchOEmbed(url: string): Promise<OEmbedData> {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`oEmbed YouTube a échoué (HTTP ${res.status})`);
  const data = await res.json() as Record<string, string>;
  return {
    title: data.title ?? 'Sans titre',
    imageUrl: data.thumbnail_url ?? '',
    channel: data.author_name ?? '',
  };
}

/** Convertit une durée ISO 8601 (ex: PT1H2M3S) en secondes */
function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0') * 3600)
       + (parseInt(m[2] ?? '0') * 60)
       +  parseInt(m[3] ?? '0');
}

/** Tente d'extraire la durée depuis le JSON-LD intégré dans la page YouTube */
async function fetchDuration(videoId: string): Promise<number | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'fr-FR' },
    });
    const html = await res.text();
    const match = html.match(/"duration"\s*:\s*"(PT[A-Z0-9]+)"/);
    if (match) return parseDuration(match[1]);
  } catch {
    // La durée n'est pas critique, on renvoie null
  }
  return null;
}

export interface YoutubeData {
  videoId: string;
  title: string;
  imageUrl: string;
  channel: string;
  durationSeconds: number | null;
  transcript: string;
}

/** Point d'entrée : extrait transcript + métadonnées depuis une URL YouTube */
export async function extractYoutube(url: string): Promise<YoutubeData> {
  const videoId = extractVideoId(url);
  const [meta, transcript, durationSeconds] = await Promise.all([
    fetchOEmbed(url),
    fetchTranscript(videoId),
    fetchDuration(videoId),
  ]);
  return { videoId, ...meta, durationSeconds, transcript };
}
