import fs from 'fs';
import path from 'path';
import { RecipeSchema, type LLMProvider, type RecipeJSON } from './types';

const PROMPT_PATH = path.join(process.cwd(), 'lib', 'prompts', 'extract-recipe.txt');

function buildPrompt(transcript: string): string {
  const template = fs.readFileSync(PROMPT_PATH, 'utf-8');
  return template.replace('{{TRANSCRIPT}}', transcript);
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  if (!apiKey) throw new Error('GEMINI_API_KEY manquante dans .env');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        // Force la réponse en JSON valide
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API erreur ${res.status} : ${body}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Réponse Gemini vide ou inattendue.');
  return text;
}

function parseAndValidate(raw: string): RecipeJSON {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`JSON invalide reçu du LLM : ${raw.slice(0, 200)}`);
  }

  // Cas spécial : le LLM indique qu'il n'y a pas de recette
  if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
    throw new Error('NO_RECIPE_FOUND');
  }

  const result = RecipeSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Structure de recette invalide : ${result.error.message}`);
  }
  return result.data;
}

export const geminiProvider: LLMProvider = {
  name: 'gemini',

  async extractRecipe(transcript: string): Promise<RecipeJSON> {
    const prompt = buildPrompt(transcript);

    // Première tentative
    const raw = await callGemini(prompt);
    try {
      return parseAndValidate(raw);
    } catch (firstErr) {
      // Une seule nouvelle tentative si le JSON est invalide
      if (firstErr instanceof Error && firstErr.message === 'NO_RECIPE_FOUND') {
        throw firstErr;
      }
      console.warn('[Gemini] Première tentative invalide, réessai…', firstErr);
      const raw2 = await callGemini(prompt);
      return parseAndValidate(raw2);
    }
  },
};
