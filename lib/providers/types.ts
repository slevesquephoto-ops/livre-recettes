import { z } from 'zod';

export const IngredientSchema = z.object({
  quantity: z.number().nullable(),
  unit: z.string().nullable(),
  name: z.string(),
});

export const RecipeSchema = z.object({
  title: z.string(),
  servings: z.number().nullable(),
  prepMinutes: z.number().nullable(),
  cookMinutes: z.number().nullable(),
  ingredients: z.array(IngredientSchema),
  steps: z.array(z.string()),
  suggestedTags: z.array(z.string()),
});

export type RecipeJSON = z.infer<typeof RecipeSchema>;

export interface LLMProvider {
  name: string;
  extractRecipe(transcript: string, sourceUrl: string): Promise<RecipeJSON>;
}
