@AGENTS.md

# CLAUDE.md — VidéoRecettes

## Contexte
Application web **personnelle** (un seul utilisateur, aucune authentification,
aucune commercialisation). À partir d'un lien de vidéo de recette (YouTube,
TikTok, Facebook), l'app extrait le texte de la vidéo, le structure en recette
via un LLM, et la sauvegarde dans un livre de recettes consultable.

L'utilisateur est le **architecte senior** : il dirige, valide chaque jalon,
et apprend en cours de route. Claude Code agit comme **développeur junior** :
il explique ses choix simplement, sans jargon inutile.

## Stack réelle (versions installées)
- **Next.js 16.2.9** (App Router, Turbopack en dev) + **TypeScript** strict
- **Prisma 7 / @prisma/client 7** + **SQLite** (fichier `dev.db` à la racine)
  - Client généré dans `app/generated/prisma/` (import : `@/app/generated/prisma`)
  - Config dans `prisma.config.ts` (Prisma 7 n'utilise plus `datasource.url` dans `schema.prisma`)
- **Tailwind CSS v4** pour le style
- Pas de librairie UI lourde ; composants simples et lisibles
- Environnement : Windows 11 + WSL Ubuntu pour scripts Python, port 3000
  (si le port 3000 est occupé, Next.js passe automatiquement au port 3001)

## Règles de développement
1. **Avancer jalon par jalon** selon ROADMAP.md. Ne jamais commencer un jalon
   sans que le précédent soit validé par l'utilisateur.
2. **Expliquer avant de coder** : pour chaque jalon, résumer en 3-5 lignes ce
   qui va être fait et pourquoi, en langage simple.
3. **Commits git** à la fin de chaque jalon, message en français
   (`feat: jalon 1.2 — extraction transcript YouTube`).
4. **Gestion d'erreurs visible** : toute erreur du pipeline (vidéo introuvable,
   transcript absent, JSON invalide du LLM) doit afficher un message clair
   dans l'interface, jamais un crash silencieux.
5. **Aucune clé API dans le code** : tout passe par `.env`
   (voir `.env.example`).
6. Code commenté en français aux endroits non évidents.

## Architecture clé : la couche LLMProvider
Interface unique pour que le modèle d'IA soit interchangeable :

```ts
// lib/providers/types.ts
export interface LLMProvider {
  name: string;
  extractRecipe(transcript: string, sourceUrl: string): Promise<RecipeJSON>;
}
```

Implémentations prévues :
- `lib/providers/gemini.ts` — Google Gemini Flash via API REST (palier gratuit). Par défaut.
- `lib/providers/ollama.ts` — Ollama local (`http://localhost:11434`, modèle `qwen2.5:7b`,
  `format: "json"`). Optionnel.

Le provider actif est choisi par la variable d'environnement `LLM_PROVIDER`
(`gemini` | `ollama`). Le prompt d'extraction est dans **PROMPTS.md** et doit
être chargé depuis un fichier (`lib/prompts/extract-recipe.txt`), pas
codé en dur.

## Pipeline d'extraction du texte
- **YouTube (Phase 1)** : récupérer le transcript (sous-titres, y compris
  auto-générés, priorité `fr` puis `en`) sans télécharger la vidéo.
  Récupérer aussi : titre, miniature, chaîne, durée.
- **TikTok / Facebook (Phase 2)** : le script `scripts/transcribe.py`
  télécharge l'audio avec yt-dlp, le transcrit avec faster-whisper
  (modèle `small`, langue auto), et imprime le texte sur stdout.
  L'API Next.js l'appelle via `child_process` (spawn).
  Pour Facebook : option `--cookies` avec le fichier pointé par `FB_COOKIES_PATH`.
  **Environnement Windows** : venv à `C:\Users\Steeve\.venv-recettes\`
  - Python  : `...\Scripts\python.exe`
  - yt-dlp  : `...\Scripts\yt-dlp.exe`
  - faster-whisper 1.2.1 + ctranslate2 4.8.0, device=auto (CPU/CUDA)
- Le traitement peut prendre 30 s à 2 min : l'interface doit afficher un
  état « Traitement en cours… » (statut en BD : `PENDING | PROCESSING |
  READY | ERROR`).

## Modèle de données (Prisma)
```prisma
model Recipe {
  id          String   @id @default(cuid())
  title       String
  sourceUrl   String
  platform    String   // "youtube" | "tiktok" | "facebook"
  imageUrl    String?
  servings    Int?
  prepMinutes Int?
  cookMinutes Int?
  status      String   @default("PENDING")
  transcript  String?  // texte brut conservé pour ré-extraction
  notes       String?  // notes personnelles
  createdAt   DateTime @default(now())
  ingredients Ingredient[]
  steps       Step[]
  tags        Tag[]
}

model Ingredient {
  id       String  @id @default(cuid())
  recipeId String
  recipe   Recipe  @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  quantity Float?
  unit     String? // "ml", "g", "tasse", "c. à soupe", null si "au goût"
  name     String
  order    Int
}

model Step {
  id       String @id @default(cuid())
  recipeId String
  recipe   Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  order    Int
  text     String
}

model Tag {
  id      String   @id @default(cuid())
  name    String   @unique
  recipes Recipe[]
}
```

## Commandes utiles
```bash
npm run dev                  # serveur de développement (port 3000 ou 3001)
npx prisma migrate dev       # appliquer le schéma à la BD
npx prisma studio            # explorer la BD dans le navigateur
npx tsc --noEmit             # vérifier les types TypeScript sans compiler
~/.venv-recettes/bin/python scripts/transcribe.py <url>   # test transcription
```

## Définition de « terminé » pour un jalon
- Le critère de test du jalon (ROADMAP.md) passe, démontré à l'utilisateur.
- Aucune erreur TypeScript (`npx tsc --noEmit`).
- Commit git fait.
- Courte note de ce qui a été appris/décidé si pertinent.
