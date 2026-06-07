import type { Recipe } from '../data/types';
import type { Lang } from '../i18n';
import { trEnum } from '../i18n/enums';

/**
 * True if a recipe matches a free-text query. Searches the title, cuisine,
 * tags, and ingredient names (case-insensitive). Cuisine and tags are stored in
 * English but localized for display, so they're matched against BOTH the
 * English value and its localized label — letting users search the words they
 * actually see. An empty query matches all. Shared by the search screen and the
 * home inline search so they stay in sync.
 */
export function matchesQuery(r: Recipe, q: string, lang: Lang): boolean {
  const ql = q.trim().toLowerCase();
  if (!ql) return true;
  return r.title.toLowerCase().includes(ql)
    || r.cuisine.toLowerCase().includes(ql)
    || trEnum(r.cuisine, lang).toLowerCase().includes(ql)
    || r.tags.some((tg) => tg.toLowerCase().includes(ql) || trEnum(tg, lang).toLowerCase().includes(ql))
    || r.ingredients.some((i) => i.item.toLowerCase().includes(ql));
}
