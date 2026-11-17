import { spawn } from 'child_process';

/** Récupère l'URL de la miniature pour TikTok (oEmbed) ou Facebook (yt-dlp). */
export async function extractThumbnail(
  url: string,
  platform: string,
  cookiesPath?: string
): Promise<string | null> {
  if (platform === 'tiktok') {
    try {
      const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json() as { thumbnail_url?: string };
        if (data.thumbnail_url) return data.thumbnail_url;
      }
    } catch { /* tombe sur yt-dlp en fallback */ }
  }

  // Facebook (et fallback TikTok) : yt-dlp --print thumbnail
  return new Promise((resolve) => {
    const ytdlpBin = process.env.YTDLP_BIN ?? 'yt-dlp';
    const args: string[] = [];
    if (cookiesPath) args.push('--cookies', cookiesPath);
    // « -- » : tout ce qui suit est une URL, jamais une option de yt-dlp
    args.push('--print', 'thumbnail', '--skip-download', '--no-playlist', '--', url);

    const proc = spawn(ytdlpBin, args);
    proc.stdout.setEncoding('utf8');
    let out = '';
    proc.stdout.on('data', (d: string) => { out += d; });
    proc.on('close', () => {
      const line = out.trim().split('\n')[0].trim();
      resolve(line || null);
    });
    proc.on('error', () => resolve(null));
  });
}
