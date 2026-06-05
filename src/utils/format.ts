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
