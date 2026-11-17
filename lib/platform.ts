export type Platform = 'youtube' | 'tiktok' | 'facebook';

// Domaines acceptés pour chaque plateforme (sous-domaines inclus : www., m., vm., etc.)
const DOMAINES: Record<Platform, string[]> = {
  youtube: ['youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com'],
  facebook: ['facebook.com', 'fb.watch'],
};

const ERREUR = 'Plateforme non supportée. Utilisez une URL YouTube, TikTok ou Facebook.';

/**
 * Valide l'URL et retourne sa plateforme.
 * L'URL est ensuite passée à yt-dlp : on refuse donc tout ce qui n'est pas une
 * vraie adresse http(s) d'un domaine connu (ex. un texte qui commence par
 * « -- » serait lu par yt-dlp comme une option).
 */
export function detectPlatform(url: string): Platform {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(ERREUR);
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error(ERREUR);

  const hote = parsed.hostname.toLowerCase();
  for (const [platform, domaines] of Object.entries(DOMAINES) as [Platform, string[]][]) {
    if (domaines.some((d) => hote === d || hote.endsWith('.' + d))) return platform;
  }
  throw new Error(ERREUR);
}
