#!/usr/bin/env python3
"""
Télécharge l'audio d'une vidéo (TikTok, Facebook, YouTube) via yt-dlp,
le transcrit avec faster-whisper, et imprime le texte brut sur stdout.

Usage :
  python transcribe.py <url>
  python transcribe.py <url> --cookies /chemin/vers/cookies.txt   # Facebook

Codes de sortie :
  0  succès  (texte sur stdout)
  1  erreur  (message sur stderr)
"""

import sys
import os
import tempfile
import subprocess
import argparse


def transcribe(url: str, cookies_path: str | None = None) -> str:
    whisper_model = os.environ.get("WHISPER_MODEL", "small")
    ytdlp_bin = os.environ.get("YTDLP_BIN", "yt-dlp")

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
        if cookies_path:
            cmd += ["--cookies", cookies_path]
        cmd.append(url)

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

        # device="auto" utilise CUDA si disponible, sinon CPU
        model = WhisperModel(
            whisper_model,
            device="auto",
            compute_type="auto",
        )
        segments, _ = model.transcribe(audio_file, beam_size=5, language=None)

        return " ".join(seg.text.strip() for seg in segments)


def main():
    parser = argparse.ArgumentParser(description="Transcrit une vidéo en texte.")
    parser.add_argument("url", help="URL de la vidéo")
    parser.add_argument("--cookies", help="Fichier de cookies (ex : Facebook)", default=None)
    args = parser.parse_args()

    text = transcribe(args.url, args.cookies)
    if not text.strip():
        print("Transcription vide — la vidéo n'a peut-être pas de paroles.", file=sys.stderr)
        sys.exit(1)

    print(text)


if __name__ == "__main__":
    main()
