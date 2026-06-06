// Formatting + small pure helpers ported from the design.

/** Pretty-print a fractional quantity using unicode fractions. */
export function fmtQty(n: number): string {
  if (n == null || n === 0 || isNaN(n)) return '';
  const whole = Math.floor(n);
  const frac = n - whole;
  const map: Record<number, string> = {
    0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔', 0.125: '⅛',
  };
  let fr = '';
  for (const k in map) if (Math.abs(frac - Number(k)) < 0.04) fr = map[k as unknown as number];
  if (fr) return (whole ? whole + ' ' : '') + fr;
  if (frac < 0.04) return String(whole);
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace('.0', '');
}

// ── Unit system conversion ─────────────────────────────────
// Convert between metric and imperial *within the same dimension* (weight↔weight,
// volume↔volume) — never across (that needs per-ingredient density). tbsp/tsp are
// common to both systems, so they're left untouched.
export type UnitSystem = 'metric' | 'imperial';

const TO_GRAMS: Record<string, number> = { g: 1, gram: 1, grams: 1, kg: 1000, oz: 28.3495, lb: 453.592, lbs: 453.592, pound: 453.592, pounds: 453.592 };
const TO_ML: Record<string, number> = { ml: 1, l: 1000, cup: 236.588, cups: 236.588, 'fl oz': 29.5735 };
const METRIC = new Set(['g', 'gram', 'grams', 'kg', 'ml', 'l']);
const IMPERIAL = new Set(['oz', 'lb', 'lbs', 'pound', 'pounds', 'cup', 'cups', 'fl oz']);

/** Convert an ingredient quantity+unit into the requested system. Unknown/shared
 *  units (can, clove, pinch, tbsp, tsp, …) pass through unchanged. */
export function convertUnit(qty: number, unit: string, system: UnitSystem): { qty: number; unit: string } {
  const u = unit.trim().toLowerCase();
  if (system === 'imperial' && METRIC.has(u)) {
    if (u in TO_GRAMS) {
      const g = qty * TO_GRAMS[u];
      return g >= 453.592 ? { qty: g / 453.592, unit: 'lb' } : { qty: g / 28.3495, unit: 'oz' };
    }
    const ml = qty * TO_ML[u];
    return ml >= 120 ? { qty: ml / 236.588, unit: 'cup' } : { qty: ml / 14.7868, unit: 'tbsp' };
  }
  if (system === 'metric' && IMPERIAL.has(u)) {
    if (u in TO_GRAMS) {
      const g = qty * TO_GRAMS[u];
      return g >= 1000 ? { qty: g / 1000, unit: 'kg' } : { qty: Math.round(g), unit: 'g' };
    }
    const ml = qty * (TO_ML[u] ?? 0);
    return ml >= 1000 ? { qty: ml / 1000, unit: 'l' } : { qty: Math.round(ml), unit: 'ml' };
  }
  return { qty, unit };
}

/** Offline substitution suggestions (used as a fallback before AI runs). */
const SUBS: Record<string, string[]> = {
  butter: ['olive oil (¾ amount)', 'coconut oil', 'Greek yogurt'],
  'whole milk': ['oat milk', 'almond milk', 'half cream + half water'],
  honey: ['maple syrup', 'agave nectar', 'brown sugar + splash of water'],
  eggs: ['flax egg (1 tbsp flax + 3 tbsp water)', 'applesauce (¼ cup)'],
  'all-purpose flour': ['gluten-free 1:1 blend', 'oat flour', 'spelt flour'],
  'soy sauce': ['tamari (gluten-free)', 'coconut aminos'],
  'heavy cream': ['coconut cream', 'evaporated milk'],
  sugar: ['coconut sugar', 'honey (¾ amount)', 'maple syrup'],
};

export function subFor(item: string): string[] {
  const key = Object.keys(SUBS).find((k) => item.toLowerCase().includes(k));
  return key ? SUBS[key] : ['a 1:1 plant-based version', 'your preferred alternative', 'omit and adjust to taste'];
}

/** mm:ss for a countdown. */
export function mmss(left: number): string {
  return `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
}

/** Compact a follower-style count (1280 -> "1.3k"). */
export function compact(v: number): string {
  return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : String(v);
}
