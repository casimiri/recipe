// Shared helpers for sharing/exporting recipes as HTML (for print + PDF export).
import { fmtQty, convertUnit, type UnitSystem } from '../utils/format';
import type { Recipe } from '../data/types';

export const recipeUrl = (id: string) => `https://recipe-snap.app/r/${id}`;

const ingredientLine = (i: Recipe['ingredients'][number], units: UnitSystem) => {
  const c = convertUnit(i.qty, i.unit, units);
  const q = fmtQty(c.qty);
  return `<li>${q}${c.unit ? ' ' + c.unit : ''} ${i.item}</li>`;
};

/** A standalone HTML document for a single recipe. */
export function recipeHtml(r: Recipe, units: UnitSystem): string {
  const ing = r.ingredients.map((i) => ingredientLine(i, units)).join('');
  const steps = r.steps.map((s) => `<li><strong>${s.t}</strong><br/>${s.d}</li>`).join('');
  return `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/>
    ${STYLE}</head><body>
    <img src="${r.img}"/><h1>${r.title}</h1>
    <div class="meta">${r.cuisine} · ${r.time} mins · ${r.servings} servings · ${r.cal} cal</div>
    <p>${r.desc}</p>
    <h2>Ingredients</h2><ul>${ing}</ul>
    <h2>Directions</h2><ol>${steps}</ol>
    <p class="meta">${recipeUrl(r.id)}</p></body></html>`;
}

/** A multi-recipe HTML document (used by "Export my recipes"). */
export function recipesHtml(list: Recipe[], title: string, units: UnitSystem): string {
  const sections = list.map((r) => {
    const ing = r.ingredients.map((i) => ingredientLine(i, units)).join('');
    const steps = r.steps.map((s) => `<li><strong>${s.t}</strong><br/>${s.d}</li>`).join('');
    return `<section><img src="${r.img}"/><h1>${r.title}</h1>
      <div class="meta">${r.cuisine} · ${r.time} mins · ${r.servings} servings · ${r.cal} cal</div>
      <p>${r.desc}</p>
      <h2>Ingredients</h2><ul>${ing}</ul>
      <h2>Directions</h2><ol>${steps}</ol></section>`;
  }).join('<div class="break"></div>');
  return `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/>
    ${STYLE}</head><body>
    <h1 class="cover">${title}</h1>
    <div class="meta">${list.length} recipe${list.length === 1 ? '' : 's'} · Recipe-Snap</div>
    <div class="break"></div>${sections}</body></html>`;
}

const STYLE = `<style>
  body{font-family:-apple-system,Helvetica,Arial,sans-serif;padding:28px;color:#1a1a1a}
  h1{font-size:26px;margin:0 0 4px}h1.cover{font-size:34px;margin-top:40px}
  .meta{color:#888;margin-bottom:18px;font-size:13px}
  h2{font-size:18px;margin:24px 0 8px}li{margin-bottom:8px;line-height:1.45}
  img{width:100%;max-height:280px;object-fit:cover;border-radius:14px;margin-bottom:18px}
  .break{page-break-after:always}
</style>`;
