import type { Recipe } from '../data/types';

/**
 * True if a recipe matches a free-text query. Searches the title, cuisine,
 * tags, and ingredient names (case-insensitive). An empty query matches all.
 * Shared by the search screen and the home inline search so they stay in sync.
 */
export function matchesQuery(r: Recipe, q: string): boolean {
  const ql = q.trim().toLowerCase();
  if (!ql) return true;
  return r.title.toLowerCase().includes(ql)
    || r.cuisine.toLowerCase().includes(ql)
    || r.tags.some((tg) => tg.toLowerCase().includes(ql))
    || r.ingredients.some((i) => i.item.toLowerCase().includes(ql));
}
