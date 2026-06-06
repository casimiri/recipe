// taste.ts — scores a recipe against the user's onboarding "tastes" so the home
// feed can float matching recipes to the top. Tastes are a soft preference (a
// ranking signal), not a hard filter like dietary preferences, so nothing is
// hidden — recipes just reorder.
import type { Recipe } from '../data/types';

// Each taste -> does this recipe satisfy it? Matches against cuisine / meal /
// tags / difficulty / title so the vocabulary lines up with the catalog.
const MATCH: Record<string, (r: Recipe) => boolean> = {
  Italian: (r) => r.cuisine === 'Italian',
  Asian: (r) => r.cuisine === 'Asian',
  Mexican: (r) => r.cuisine === 'Local' || r.tags.includes('Mexican'),
  Vegetarian: (r) => r.tags.includes('Vegetarian'),
  Vegan: (r) => r.tags.includes('Vegan'),
  'High protein': (r) => r.tags.includes('High protein'),
  'Quick & easy': (r) => r.difficulty === 'Easy' || r.tags.some((t) => /quick|under/i.test(t)),
  Baking: (r) => r.cuisine === 'Dessert' || /cake|pizza|crepe|bread|cookie|muffin/i.test(r.title),
  Healthy: (r) => r.cuisine === 'Healthy' || r.tags.includes('High fiber'),
  'Comfort food': (r) => /pasta|pizza|curry|roast|cake|mac|stew|soup/i.test(r.title),
  Seafood: (r) => r.tags.includes('Pescatarian') || /salmon|fish|shrimp|prawn|seafood|tuna/i.test(r.title),
  Desserts: (r) => r.cuisine === 'Dessert' || r.meal === 'Dessert',
};

/** How many of the user's tastes this recipe matches (higher = more relevant). */
export function tasteScore(r: Recipe, tastes: string[]): number {
  let score = 0;
  for (const taste of tastes) {
    const m = MATCH[taste];
    // Known taste -> its predicate; otherwise fall back to a literal cuisine/tag hit.
    if (m ? m(r) : r.cuisine === taste || r.tags.includes(taste)) score += 1;
  }
  return score;
}

/** Return recipes reordered so taste-matching ones lead (stable; nothing dropped). */
export function rankByTaste(recipes: Recipe[], tastes: string[]): Recipe[] {
  if (!tastes.length) return recipes;
  return recipes
    .map((r, i) => ({ r, i, s: tasteScore(r, tastes) }))
    .sort((a, b) => b.s - a.s || a.i - b.i) // higher score first; stable for ties
    .map((x) => x.r);
}
