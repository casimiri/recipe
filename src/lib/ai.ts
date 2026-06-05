// ai.ts — thin client over the Supabase Edge Functions that proxy OpenAI.
// Every call has an offline fallback so the UX works without credentials.
import { supabase, isSupabaseConfigured } from './supabase';
import { subFor } from '../utils/format';
import { U } from '../data/seed';
import type { Recipe, SourceKind } from '../data/types';

/** Demo recipe returned by the offline import fallback. */
export const IMPORT_DEMO: Recipe = {
  id: 'imported-tuscan',
  title: 'Creamy Tuscan Chicken',
  cuisine: 'Italian', meal: 'Dinner',
  time: 30, servings: 4, cal: 540, difficulty: 'Easy', rating: 4.8, reviews: 0,
  img: U('1604908176997-125f25cc6f3d'),
  source: { kind: 'instagram', handle: '@thecozykitchen', name: 'The Cozy Kitchen' },
  saves: 0, cooked: 0, imported: true,
  desc: 'Pan-seared chicken in a sun-dried tomato and spinach cream sauce. Imported from a 38-second reel — ready in half an hour.',
  tags: ['High protein', 'One pan', 'Under 30 min'],
  nutrition: { cal: 540, protein: 42, carbs: 14, fat: 34, fiber: 3, sugar: 5 },
  ingredients: [
    { qty: 4, unit: '', item: 'chicken breasts', g: 'Main' },
    { qty: 1, unit: 'cup', item: 'heavy cream', g: 'Sauce' },
    { qty: 0.5, unit: 'cup', item: 'sun-dried tomatoes', g: 'Sauce' },
    { qty: 2, unit: 'cups', item: 'baby spinach', g: 'Sauce' },
    { qty: 3, unit: 'cloves', item: 'garlic, minced', g: 'Sauce' },
    { qty: 0.5, unit: 'cup', item: 'parmesan, grated', g: 'Sauce' },
    { qty: 2, unit: 'tbsp', item: 'olive oil', g: 'Main' },
  ],
  steps: [
    { t: 'Sear the chicken', d: 'Season the chicken and sear in olive oil until golden and cooked through. Remove and set aside.', timer: 480 },
    { t: 'Build the sauce', d: 'In the same pan, soften the garlic, then stir in the sun-dried tomatoes and cream. Simmer to thicken.', timer: 300 },
    { t: 'Finish', d: 'Stir in the parmesan and spinach until wilted, return the chicken and spoon over the sauce.', timer: 180 },
  ],
};

export interface ImportInput {
  url?: string;
  text?: string;
  imageBase64?: string;
  sourceKind: SourceKind;
}

/** Parse a recipe from a link/text/photo via the import-recipe Edge Function. */
export async function importRecipe(input: ImportInput): Promise<Recipe> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('import-recipe', { body: input });
      if (!error && data?.recipe) {
        const r = data.recipe as Recipe;
        return { ...r, id: r.id || `imp-${Date.now()}`, imported: true };
      }
    } catch {
      // fall through to offline demo
    }
  }
  return { ...IMPORT_DEMO, id: `imp-${Date.now()}` };
}

export type AiTool = 'substitute' | 'simplify';

/** Ask AI for ingredient substitutions or simplified steps. */
export async function aiTool(args: {
  tool: AiTool;
  recipe: Recipe;
  ingredient?: string;
}): Promise<{ substitutions?: string[]; steps?: { t: string; d: string }[] }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('ai-tools', { body: args });
      if (!error && data) return data;
    } catch {
      // fall through
    }
  }
  // Offline fallbacks
  if (args.tool === 'substitute') {
    return { substitutions: subFor(args.ingredient || args.recipe.ingredients[0]?.item || '') };
  }
  return {
    steps: args.recipe.steps.map((s) => ({ t: s.t, d: s.d.split('.')[0] + '.' })),
  };
}
