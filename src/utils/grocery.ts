// Build a "smart" grocery list from the user's meal plan: collect the
// ingredients of every planned recipe, aggregate duplicates across recipes
// (summing quantities per unit), convert to the active unit system, and group
// the result by supermarket aisle. Replaces the old static seed list so the
// grocery tab actually reflects what you planned to cook.
import type { GroceryAisle, GroceryItem, Recipe, WeekPlan, MealSlot } from '../data/types';
import { convertUnit, fmtQty, type UnitSystem } from './format';

const SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

// Aisle order is also the display order. Classification picks the first aisle
// whose keyword the (cleaned) ingredient name contains.
const AISLE_ORDER = ['Produce', 'Meat & Seafood', 'Bakery', 'Dairy & Eggs', 'Pantry'] as const;

// Canned/jarred staples that contain a produce/dairy word ("coconut milk",
// "tomato sauce") but belong in the pantry — checked before the broad lists.
const PANTRY_FIRST = ['coconut milk', 'tomato sauce', 'curry paste', 'soy sauce', 'dressing'];

const KEYWORDS: Record<string, string[]> = {
  Produce: [
    'tomato', 'avocado', 'cilantro', 'ginger', 'garlic', 'lemon', 'lime', 'mango', 'berr',
    'greens', 'onion', 'orange', 'basil', 'thyme', 'herb', 'spinach', 'kale', 'pepper',
    'carrot', 'cucumber', 'apple', 'banana', 'potato', 'mushroom', 'scallion', 'chili',
    'parsley', 'mint', 'broccoli', 'zucchini', 'lettuce',
  ],
  'Meat & Seafood': ['chicken', 'beef', 'steak', 'pork', 'salmon', 'fish', 'shrimp', 'prawn', 'bacon', 'sausage', 'turkey', 'tofu', 'tuna', 'cod'],
  Bakery: ['bread', 'tortilla', 'dough', 'bun', 'baguette', 'pita', 'naan'],
  'Dairy & Eggs': ['egg', 'milk', 'butter', 'cheese', 'yogurt', 'cream', 'mozzarella', 'parmesan', 'feta'],
};

// Things you almost never shop for; drop them from the generated list.
const IGNORE = ['water', 'ice'];

function aisleFor(name: string): string {
  const n = name.toLowerCase();
  if (PANTRY_FIRST.some((k) => n.includes(k))) return 'Pantry';
  for (const aisle of AISLE_ORDER) {
    if (KEYWORDS[aisle]?.some((k) => n.includes(k))) return aisle;
  }
  return 'Pantry';
}

/** "chicken thighs, diced" -> "Chicken thighs": drop prep notes, capitalize. */
function cleanName(item: string): string {
  const base = item.split(',')[0].trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

interface Agg {
  name: string;
  from: Set<string>;
  /** summed quantity per (converted) unit, e.g. { g: 200, cup: 1 } */
  units: Record<string, number>;
}

/** Render an aggregate's per-unit totals, e.g. {g:200, '':3} -> "200 g + 3". */
function renderQty(units: Record<string, number>): string {
  const parts: string[] = [];
  for (const [u, q] of Object.entries(units)) {
    if (!q) { if (u) parts.push(u); continue; }
    const qty = fmtQty(q);
    parts.push(u ? `${qty} ${u}` : qty);
  }
  return parts.join(' + ') || '1';
}

/**
 * Build the grocery list for a week plan. A recipe planned on multiple slots is
 * cooked that many times, so its ingredient quantities are multiplied by the
 * number of slots it fills (plan tacos twice → buy twice the ingredients).
 */
export function buildGroceryList(
  plan: WeekPlan,
  byId: (id: string) => Recipe | undefined,
  units: UnitSystem,
  pantryStaples: string[] = [],
): GroceryAisle[] {
  const staples = new Set(pantryStaples);
  // Tally how many plan slots each recipe fills.
  const counts = new Map<string, number>();
  for (const day of Object.values(plan)) {
    for (const slot of SLOTS) {
      const id = day?.[slot];
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }

  const groups = new Map<string, Agg>();
  for (const [id, count] of counts) {
    const recipe = byId(id);
    if (!recipe) continue;
    for (const ing of recipe.ingredients) {
      const display = cleanName(ing.item);
      const key = slug(display);
      if (!key || IGNORE.some((w) => key === w || key.startsWith(w + '-'))) continue;
      let g = groups.get(key);
      if (!g) { g = { name: display, from: new Set(), units: {} }; groups.set(key, g); }
      g.from.add(recipe.title);
      const conv = ing.qty ? convertUnit(ing.qty, ing.unit, units) : { qty: 0, unit: ing.unit };
      const u = conv.unit.trim();
      g.units[u] = (g.units[u] ?? 0) + (conv.qty || 0) * count;
    }
  }

  const byAisle = new Map<string, GroceryItem[]>();
  for (const [key, g] of groups) {
    if (staples.has(`g:${key}`)) continue; // user always has this — hide it
    const aisle = aisleFor(g.name);
    const item: GroceryItem = {
      id: `g:${key}`,
      name: g.name,
      qty: renderQty(g.units),
      from: g.from.size === 1 ? [...g.from][0] : 'Multiple',
    };
    (byAisle.get(aisle) ?? byAisle.set(aisle, []).get(aisle)!).push(item);
  }

  return AISLE_ORDER
    .filter((a) => byAisle.has(a))
    .map((aisle) => ({
      aisle,
      items: byAisle.get(aisle)!.sort((a, b) => a.name.localeCompare(b.name)),
    }));
}
