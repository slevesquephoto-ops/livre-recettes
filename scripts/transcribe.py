#!/usr/bin/env python3
"""
Télécharge l'audio d'une vidéo (TikTok, Facebook, YouTube) via yt-dlp,
le transcrit avec faster-whisper, et imprime le texte brut sur stdout.

Usage :
  python transcribe.py <url>
  python transcribe.py <url> --cookies /chemin/vers/cookies.txt   # Facebook explicite

  Pour Facebook sans passer --cookies, définir FB_COOKIES_PATH dans .env
  (l'app Next.js le fait automatiquement).

Codes de sortie :
  0  succès  (texte sur stdout)
  1  erreur  (message sur stderr)
"""

import sys
import os
import tempfile
import subprocess
import argparse


def _default_ytdlp() -> str:
    """Trouve yt-dlp dans le même dossier que l'interpréteur Python actuel."""
    scripts_dir = os.path.dirname(sys.executable)
    name = "yt-dlp.exe" if os.name == "nt" else "yt-dlp"
    candidate = os.path.join(scripts_dir, name)
    return candidate if os.path.isfile(candidate) else "yt-dlp"


def _find_ffmpeg() -> str | None:
    """Cherche ffmpeg : d'abord imageio-ffmpeg (bundlé dans le venv), puis PATH."""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return None


def _resolve_cookies(cookies_arg: str | None, url: str) -> str | None:
    """
    Priorité : argument CLI > variable FB_COOKIES_PATH (si URL Facebook).
    Vérifie que le fichier existe avant de le retourner.
    """
    path = cookies_arg or (
        os.environ.get("FB_COOKIES_PATH")
        if "facebook.com" in url or "fb.watch" in url
        else None
    )
    if path and not os.path.isfile(path):
        print(f"Avertissement : fichier de cookies introuvable : {path}", file=sys.stderr)
        return None
    return path


def transcribe(url: str, cookies_path: str | None = None) -> str:
    whisper_model = os.environ.get("WHISPER_MODEL", "small")
    ytdlp_bin = os.environ.get("YTDLP_BIN", _default_ytdlp())
    ffmpeg_path = _find_ffmpeg()
    cookies = _resolve_cookies(cookies_path, url)

    with tempfile.TemporaryDirectory() as tmpdir:
        audio_path = os.path.join(tmpdir, "audio.%(ext)s")

        # Téléchargement audio seulement (pas de vidéo)
        cmd = [
            ytdlp_bin,
            "--extract-audio",
            "--audio-format", "mp3",
            "--audio-quality", "0",
            "--output", audio_path,
            "--no-playlist",
            "--quiet",
        ]
        if ffmpeg_path:
            cmd += ["--ffmpeg-location", ffmpeg_path]
        if cookies:
            cmd += ["--cookies", cookies]
        # « -- » : tout ce qui suit est une URL, jamais une option de yt-dlp
        cmd += ["--", url]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"yt-dlp erreur : {result.stderr}", file=sys.stderr)
            sys.exit(1)

        # Cherche le fichier audio téléchargé
        audio_files = [f for f in os.listdir(tmpdir) if f.startswith("audio")]
        if not audio_files:
            print("Aucun fichier audio trouvé après téléchargement.", file=sys.stderr)
            sys.exit(1)

        audio_file = os.path.join(tmpdir, audio_files[0])

        # Transcription avec faster-whisper
        from faster_whisper import WhisperModel

        # CPU par défaut ; mettre WHISPER_DEVICE=cuda dans .env si CUDA disponible
        device = os.environ.get("WHISPER_DEVICE", "cpu")
        compute_type = "int8" if device == "cpu" else "float16"
        model = WhisperModel(whisper_model, device=device, compute_type=compute_type)
        segments, _ = model.transcribe(audio_file, beam_size=5, language=None)

        return " ".join(seg.text.strip() for seg in segments)


def main():
    parser = argparse.ArgumentParser(description="Transcrit une vidéo en texte.")
    parser.add_argument("url", help="URL de la vidéo (YouTube, TikTok, Facebook)")
    parser.add_argument(
        "--cookies",
        help="Fichier cookies Netscape (optionnel ; pour Facebook, FB_COOKIES_PATH dans .env suffit)",
        default=None,
    )
    args = parser.parse_args()

    text = transcribe(args.url, args.cookies)
    if not text.strip():
        print("Transcription vide — la vidéo n'a peut-être pas de paroles.", file=sys.stderr)
        sys.exit(1)

    print(text)


if __name__ == "__main__":
    main()
