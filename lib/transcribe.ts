import { spawn } from 'child_process';
import path from 'path';

/**
 * Appelle scripts/transcribe.py via child_process et retourne le texte sur stdout.
 * Les variables d'environnement WHISPER_MODEL, WHISPER_DEVICE et YTDLP_BIN
 * sont transmises au sous-processus depuis process.env.
 */
export function runTranscribeScript(url: string, cookiesPath?: string): Promise<string> {
  const pythonBin = process.env.PYTHON_BIN;
  if (!pythonBin) throw new Error('PYTHON_BIN manquant dans .env');

  const scriptPath = path.join(process.cwd(), 'scripts', 'transcribe.py');

  const args = [scriptPath, url];
  if (cookiesPath) args.push('--cookies', cookiesPath);

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonBin, args, {
      env: {
        ...process.env,
        // S'assure que les vars de config whisper/yt-dlp sont bien transmises
        WHISPER_MODEL: process.env.WHISPER_MODEL ?? 'small',
        WHISPER_DEVICE: process.env.WHISPER_DEVICE ?? 'cpu',
      },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');
    proc.stdout.on('data', (chunk: string) => { stdout += chunk; });
    proc.stderr.on('data', (chunk: string) => { stderr += chunk; });

    proc.on('error', (err) => {
      reject(new Error(`Impossible de lancer le script Python : ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        // Extrait la dernière ligne d'erreur significative (ignore les warnings HF)
        const lastError = stderr.split('\n').filter(l => l.startsWith('yt-dlp') || l.startsWith('Error') || l.startsWith('Traceback')).at(-1)
          ?? stderr.slice(-300);
        reject(new Error(`Transcription échouée (code ${code}) : ${lastError.trim()}`));
      } else {
        const text = stdout.trim();
        if (!text) reject(new Error('Transcription vide — la vidéo n\'a peut-être pas de paroles.'));
        else resolve(text);
      }
    });
  });
}
