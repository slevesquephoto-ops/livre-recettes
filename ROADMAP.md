# ROADMAP — VidéoRecettes

Chaque jalon = une session Claude Code courte, terminée par un **test que
TU fais toi-même**. On ne passe au jalon suivant que si le test réussit.

---

## 🟢 PHASE 1 — MVP YouTube (le pipeline complet, version simple)

### Jalon 1.1 — Fondations du projet
- Initialiser Next.js (TypeScript, Tailwind, App Router) + git
- Prisma + SQLite avec le schéma de CLAUDE.md, première migration
- Page d'accueil vide « Mon livre de recettes » + `.env.example`
- ✅ **Test :** `npm run dev` → la page s'affiche sur http://localhost:3000
  et `npx prisma studio` montre les tables vides.

### Jalon 1.2 — Extraction du transcript YouTube
- Fonction `extractYoutube(url)` : transcript (fr puis en) + titre,
  miniature, durée
- Petite route API de test `/api/debug/transcript?url=...`
- ✅ **Test :** coller une URL YouTube de recette dans la route de test →
  le texte de la vidéo s'affiche en JSON.

### Jalon 1.3 — Structuration par IA (Gemini Flash)
- Couche `LLMProvider` + implémentation `gemini.ts`
- Prompt chargé depuis fichier (basé sur PROMPTS.md)
- Validation du JSON retourné (zod) + 1 nouvelle tentative si invalide
- ✅ **Test :** le transcript du jalon 1.2 ressort en recette structurée
  (ingrédients + étapes) dans la console ou une route de test.

### Jalon 1.4 — Import de bout en bout + sauvegarde
- Page « Ajouter une recette » : champ URL + bouton Importer
- Pipeline complet : URL → transcript → LLM → sauvegarde en BD
- Statuts visibles (Traitement en cours… / Prête / Erreur)
- ✅ **Test :** coller un lien YouTube → la recette apparaît dans la BD
  (Prisma Studio) avec ses ingrédients et étapes.

### Jalon 1.5 — Consultation du livre
- Page d'accueil : grille des recettes (miniature, titre, plateforme)
- Page recette : ingrédients, étapes numérotées, lien vers la vidéo source
- Suppression d'une recette
- ✅ **Test :** importer 3 vraies recettes YouTube et les consulter.
  🎉 Fin de la Phase 1 : l'application est déjà utilisable !

---

## 🟡 PHASE 2 — TikTok et Facebook (audio → Whisper)

### Jalon 2.1 — Script de transcription locale
- `scripts/transcribe.py` : yt-dlp (audio seulement) + faster-whisper
  (modèle `small`), texte sur stdout
- ✅ **Test :** lancer le script à la main avec une URL TikTok → le texte
  de la vidéo s'affiche dans le terminal.

### Jalon 2.2 — Support Facebook (cookies)
- Export des cookies (extension navigateur), variable `FB_COOKIES_PATH`
- yt-dlp avec `--cookies` pour les URL Facebook
- ✅ **Test :** le script transcrit une vidéo Facebook de recette.

### Jalon 2.3 — Intégration dans l'app
- Détection automatique de la plateforme selon l'URL
- Appel du script Python depuis l'API (child_process), traitement
  asynchrone avec mise à jour du statut
- ✅ **Test :** importer une recette TikTok ET une recette Facebook
  directement depuis l'interface web.

---

## 🔵 PHASE 3 — Le vrai « livre de recettes »

### Jalon 3.1 — Organisation
- Tags/catégories (souper, dessert, BBQ…), filtres et recherche par
  titre/ingrédient
- ✅ **Test :** retrouver une recette par un ingrédient.

### Jalon 3.2 — Confort de cuisine
- Ajustement des portions (les quantités se recalculent)
- Cases à cocher sur les ingrédients et les étapes
- Notes personnelles sur chaque recette
- ✅ **Test :** doubler une recette de 4 à 8 portions.

### Jalon 3.3 — Édition et fiabilité
- Modifier une recette (corriger une quantité mal extraite)
- Bouton « Ré-extraire » (relance le LLM sur le transcript conservé)
- ✅ **Test :** corriger une erreur d'extraction sans tout réimporter.

### Jalon 3.4 — Export PDF (optionnel)
- Export d'une recette ou du livre complet en PDF propre
- ✅ **Test :** imprimer une recette pour la cuisine. 📖

---

## Idées pour plus tard (backlog, rien d'engagé)
- Mode « cuisson » plein écran avec minuteries par étape
- Provider Ollama local comme alternative à Gemini
- Extraction d'une image de la vidéo comme photo de recette
- Liste d'épicerie générée à partir de plusieurs recettes
