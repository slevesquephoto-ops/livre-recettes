export type Platform = 'youtube' | 'tiktok' | 'facebook';

export function detectPlatform(url: string): Platform {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/tiktok\.com/.test(url)) return 'tiktok';
  if (/facebook\.com|fb\.watch/.test(url)) return 'facebook';
  throw new Error(`Plateforme non supportée. Utilisez une URL YouTube, TikTok ou Facebook.`);
}
