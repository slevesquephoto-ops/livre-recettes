# PROMPTS.md — Prompt d'extraction de recette

Ce prompt est le cœur « intelligent » de l'application. Il sera stocké dans
`src/lib/prompts/extract-recipe.txt` et envoyé au LLM (Gemini ou Ollama)
avec le transcript de la vidéo. À ajuster au fil des tests réels.

---

## Prompt (version 1)

```
Tu es un assistant culinaire expert. On te fournit la transcription brute
d'une vidéo de recette (sous-titres automatiques ou transcription audio).
Le texte peut contenir des erreurs, des hésitations, des salutations, des
appels à s'abonner : ignore tout ce qui n'est pas la recette.

Ta tâche : extraire la recette et répondre UNIQUEMENT avec un objet JSON
valide, sans aucun texte avant ou après, sans balises Markdown.

Format exact attendu :
{
  "title": "Nom de la recette en français",
  "servings": 4,
  "prepMinutes": 15,
  "cookMinutes": 30,
  "ingredients": [
    { "quantity": 250, "unit": "ml", "name": "lait" },
    { "quantity": 2, "unit": null, "name": "œufs" },
    { "quantity": null, "unit": null, "name": "sel, au goût" }
  ],
  "steps": [
    "Préchauffer le four à 180 °C (350 °F).",
    "Mélanger les ingrédients secs dans un grand bol."
  ],
  "suggestedTags": ["dessert", "rapide"]
}

Règles :
- Réponds en français, même si la vidéo est en anglais (convertis les
  unités impériales en ajoutant l'équivalent métrique quand pertinent).
- "quantity" est un nombre (1.5 pour « une tasse et demie ») ou null si
  non précisé. "unit" est null pour les items comptables (œufs, oignons).
- Unités acceptées : g, kg, ml, l, c. à thé, c. à soupe, tasse, pincée.
- Les étapes sont des phrases courtes, impératives, dans l'ordre.
- "servings", "prepMinutes", "cookMinutes" : null si non mentionnés.
  Ne devine jamais une information absente.
- Si le texte ne contient PAS de recette, réponds exactement :
  { "error": "NO_RECIPE_FOUND" }

Transcription :
"""
{{TRANSCRIPT}}
"""
```

---

## Notes pour l'amélioration (à remplir pendant les tests)

| Problème observé | Correction apportée au prompt |
|---|---|
| (exemple) Quantités en « cups » non converties | Ajout d'exemples de conversion |
|  |  |

Conseil : garder ce tableau à jour transforme le projet en étude de cas de
*prompt engineering* réutilisable en classe. 😉
