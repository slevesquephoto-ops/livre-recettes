# 📖 VidéoRecettes

> ## 🚧 Projet personnel — en révision
> **Hors service pour le moment.** Le modèle d'IA utilisé à l'origine (Gemini 2.0 Flash)
> a été retiré par Google le 1er juin 2026. Le projet a été mis à jour vers un modèle
> récent, mais ce correctif n'a pas encore été testé de bout en bout.
>
> Application conçue pour un usage personnel, sur un seul ordinateur. Elle n'a pas
> d'authentification et n'est pas destinée à être exposée sur un réseau ou sur Internet.

Ton livre de recettes personnel. Colle le lien d'une vidéo YouTube, TikTok ou Facebook — l'app extrait automatiquement les ingrédients et les étapes, et les sauvegarde dans un livre consultable, avec mode cuisson, liste d'épicerie et export PDF.

---

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma 7 + SQLite · API Gemini ·
yt-dlp + faster-whisper (transcription locale en Python)

## Développement assisté par IA

Projet développé avec **Claude Code**, avancé jalon par jalon (voir `ROADMAP.md`).
Mon rôle : définir le besoin et les jalons, valider chaque étape, tester l'application.
Le prompt d'extraction est versionné à part dans `lib/prompts/extract-recipe.txt`
(voir aussi `PROMPTS.md`), et le fournisseur d'IA est isolé derrière une interface
(`lib/providers/`) pour pouvoir être remplacé.

---

## Ce que l'app fait

- **Importer** une recette depuis une vidéo YouTube, TikTok ou Facebook
- **Consulter** ses recettes avec ingrédients, étapes numérotées et miniature
- **Ajuster les portions** (les quantités se recalculent automatiquement)
- **Cocher** les ingrédients et les étapes pendant la cuisine
- **Mode cuisson** plein écran avec minuteries automatiques
- **Prendre des notes** personnelles sur chaque recette
- **Modifier** une recette manuellement ou la ré-extraire avec l'IA
- **Générer une liste d'épicerie** à partir de plusieurs recettes
- **Exporter en PDF** pour imprimer ou sauvegarder

---

## Ce qu'il faut installer

Tu as besoin de trois programmes sur ton ordinateur :

### 1. Node.js (le moteur de l'application web)
1. Va sur **https://nodejs.org**
2. Clique sur le gros bouton **"LTS"** (version recommandée)
3. Télécharge et installe — laisse toutes les options par défaut
4. Pour vérifier que c'est installé : ouvre un terminal et tape `node -v` → tu dois voir un numéro de version

### 2. Git (pour télécharger le projet)
1. Va sur **https://git-scm.com/downloads**
2. Télécharge pour ton système (Windows / Mac / Linux)
3. Installe — laisse toutes les options par défaut

### 3. Python 3.10 ou plus (pour TikTok et Facebook seulement)
> Si tu utilises **uniquement YouTube**, tu peux sauter cette étape.

1. Va sur **https://www.python.org/downloads**
2. Télécharge la version **3.10, 3.11, 3.12 ou 3.13**
3. **Important sur Windows** : lors de l'installation, coche la case **"Add Python to PATH"**
4. Pour vérifier : tape `python --version` dans un terminal

---

## Installation pas à pas

### Étape 1 — Télécharger le projet

Ouvre un terminal (sur Windows : cherche "Invite de commandes" ou "PowerShell" dans le menu Démarrer).

```
git clone https://github.com/slevesquephoto-ops/livre-recettes.git
cd livre-recettes
```

### Étape 2 — Installer les dépendances JavaScript

```
npm install
```

> Cela télécharge automatiquement tous les modules nécessaires. Ça peut prendre 1-2 minutes.

### Étape 3 — Créer le fichier de configuration

Copie le fichier modèle :

- **Windows** : `copy .env.example .env`
- **Mac / Linux** : `cp .env.example .env`

Ouvre ensuite le fichier `.env` avec un éditeur de texte (Bloc-notes, TextEdit, VS Code…) et remplis les valeurs — voir la section **Configuration** ci-dessous.

### Étape 4 — Créer la base de données

```
npx prisma migrate deploy
```

> Cela crée un fichier `dev.db` sur ton ordinateur. Toutes tes recettes seront stockées là.

### Étape 5 — Lancer l'application

```
npm run dev
```

Ouvre ton navigateur à l'adresse **http://localhost:3001** — l'app est prête !

> L'app écoute seulement sur ton ordinateur (`127.0.0.1`) : elle n'est pas accessible depuis les autres appareils du réseau. C'est voulu, puisqu'elle n'a pas de mot de passe.

---

## Configuration (le fichier `.env`)

Ouvre le fichier `.env` et remplis les champs suivants.

### Clé Gemini (obligatoire — c'est l'IA qui structure la recette)

1. Va sur **https://aistudio.google.com/app/apikey**
2. Connecte-toi avec un compte Google
3. Clique **"Create API key"**
4. Copie la clé et colle-la dans `.env` :

```
GEMINI_API_KEY="ta-clé-ici"
GEMINI_MODEL="gemini-3.5-flash"
```

> Le niveau gratuit de Gemini suffit habituellement pour un usage personnel. Vérifie les limites du modèle choisi dans Google AI Studio.
> Google retire régulièrement ses anciens modèles : si l'extraction cesse de fonctionner, consulte https://ai.google.dev/gemini-api/docs/deprecations et change `GEMINI_MODEL`.

### Base de données (ne rien changer)

```
DATABASE_URL="file:./dev.db"
```

---

## Pour TikTok et Facebook (optionnel)

Ces plateformes nécessitent de télécharger l'audio localement et de le transcrire avec l'IA vocale Whisper.

### Étape A — Créer un environnement Python virtuel

**Windows** (dans le terminal) :
```
python -m venv C:\Users\TON_NOM\.venv-recettes
C:\Users\TON_NOM\.venv-recettes\Scripts\activate
```

**Mac / Linux** :
```
python3 -m venv ~/.venv-recettes
source ~/.venv-recettes/bin/activate
```

### Étape B — Installer les outils de transcription

```
pip install yt-dlp faster-whisper imageio-ffmpeg
```

> - **yt-dlp** : télécharge l'audio des vidéos
> - **faster-whisper** : convertit la parole en texte (IA locale, rien n'est envoyé en ligne)
> - **imageio-ffmpeg** : outil audio bundlé (pas besoin d'installer ffmpeg séparément)

### Étape C — Remplir `.env` avec les chemins Python

**Windows** :
```
PYTHON_BIN="C:\\Users\\TON_NOM\\.venv-recettes\\Scripts\\python.exe"
YTDLP_BIN="C:\\Users\\TON_NOM\\.venv-recettes\\Scripts\\yt-dlp.exe"
WHISPER_MODEL="small"
WHISPER_DEVICE="cpu"
```

**Mac / Linux** :
```
PYTHON_BIN="/home/TON_NOM/.venv-recettes/bin/python"
YTDLP_BIN="/home/TON_NOM/.venv-recettes/bin/yt-dlp"
WHISPER_MODEL="small"
WHISPER_DEVICE="cpu"
```

> Remplace `TON_NOM` par ton nom d'utilisateur Windows/Mac/Linux.
> Si tu as une carte graphique NVIDIA, tu peux mettre `WHISPER_DEVICE="cuda"` pour aller 5× plus vite.

### Pour Facebook spécifiquement — exporter tes cookies

Facebook vérifie que tu es connecté pour accéder aux vidéos. Il faut lui donner tes cookies de navigateur.

1. Installe l'extension **"Get cookies.txt LOCALLY"** sur Chrome ou Firefox
2. Connecte-toi à Facebook dans le navigateur
3. Va sur **facebook.com**, clique sur l'icône de l'extension, exporte les cookies
4. Sauvegarde le fichier quelque part (ex: `C:\Users\TON_NOM\facebook_cookies.txt`)
5. Dans `.env` :

```
FB_COOKIES_PATH="C:\\Users\\TON_NOM\\facebook_cookies.txt"
```

---

## Lancer l'app au quotidien

À chaque fois que tu veux utiliser l'app :

```
cd livre-recettes
npm run dev
```

Puis ouvre **http://localhost:3001** dans ton navigateur.

Pour arrêter l'app : appuie sur **Ctrl+C** dans le terminal.

---

## En cas de problème

| Symptôme | Solution |
|---|---|
| `command not found: node` | Node.js n'est pas installé ou pas dans le PATH — réinstalle depuis nodejs.org |
| `command not found: npm` | Même chose que ci-dessus |
| L'app affiche "Erreur serveur" sur une recette YouTube | Vérifie que `GEMINI_API_KEY` est bien rempli dans `.env` |
| TikTok/Facebook ne fonctionnent pas | Vérifie les chemins `PYTHON_BIN` et `YTDLP_BIN` dans `.env` |
| La transcription est lente | Normal sur CPU — le modèle `small` prend 1-3 min. Passe à `WHISPER_DEVICE=cuda` si tu as une GPU NVIDIA |
| Port 3001 déjà utilisé | Ferme l'autre programme qui l'utilise, ou change le numéro après `-p` dans `package.json` |
| Erreur Gemini 404 « model not found » | Le modèle a été retiré par Google : change `GEMINI_MODEL` dans `.env` (voir la page des retraits de modèles) |

---

## Structure du projet (pour les curieux)

```
app/              → Pages et composants de l'interface
lib/              → Pipeline d'extraction (YouTube, TikTok, Facebook, IA)
prisma/           → Schéma de la base de données
scripts/          → Script Python de transcription audio (Whisper)
.env.example      → Modèle de configuration (copier vers .env)
```

---

*Projet personnel — non destiné à la revente ou à la distribution commerciale.*
