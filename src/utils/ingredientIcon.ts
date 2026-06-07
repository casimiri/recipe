// Map an ingredient name to a relevant food emoji (first keyword match wins).
// Used as the per-ingredient icon on the recipe screen; a cached AI photo, when
// one exists, is shown over it as a thumbnail.

const MAP: [string, string][] = [
  // proteins
  ['chicken', '🍗'], ['turkey', '🦃'], ['duck', '🦆'], ['steak', '🥩'], ['beef', '🥩'],
  ['bacon', '🥓'], ['pork', '🥓'], ['ham', '🍖'], ['lamb', '🍖'], ['sausage', '🌭'],
  ['shrimp', '🦐'], ['prawn', '🦐'], ['crab', '🦀'], ['lobster', '🦞'],
  ['salmon', '🐟'], ['tuna', '🐟'], ['cod', '🐟'], ['fish', '🐟'], ['tofu', '🧊'],
  // dairy & eggs
  ['egg', '🥚'], ['butter', '🧈'], ['cheese', '🧀'], ['mozzarella', '🧀'], ['parmesan', '🧀'],
  ['feta', '🧀'], ['yogurt', '🥛'], ['cream', '🥛'], ['milk', '🥛'],
  // produce
  ['tomato', '🍅'], ['potato', '🥔'], ['onion', '🧅'], ['garlic', '🧄'], ['carrot', '🥕'],
  ['chili', '🌶️'], ['pepper', '🫑'], ['corn', '🌽'], ['broccoli', '🥦'], ['cucumber', '🥒'],
  ['zucchini', '🥒'], ['courgette', '🥒'], ['lettuce', '🥬'], ['spinach', '🥬'], ['kale', '🥬'],
  ['greens', '🥬'], ['mushroom', '🍄'], ['eggplant', '🍆'], ['aubergine', '🍆'], ['avocado', '🥑'],
  ['olive', '🫒'], ['peas', '🟢'], ['bean', '🫘'],
  // fruit
  ['lemon', '🍋'], ['lime', '🍋'], ['orange', '🍊'], ['apple', '🍎'], ['banana', '🍌'],
  ['blueberr', '🫐'], ['strawberr', '🍓'], ['berr', '🍓'], ['mango', '🥭'], ['pineapple', '🍍'],
  ['peach', '🍑'], ['grape', '🍇'], ['cherr', '🍒'], ['coconut', '🥥'], ['watermelon', '🍉'],
  // grains & bakery
  ['baguette', '🥖'], ['bread', '🍞'], ['tortilla', '🫓'], ['naan', '🫓'], ['pita', '🫓'],
  ['rice', '🍚'], ['spaghetti', '🍝'], ['pasta', '🍝'], ['noodle', '🍜'], ['flour', '🌾'],
  ['oat', '🌾'], ['wheat', '🌾'],
  // pantry & aromatics
  ['salt', '🧂'], ['sugar', '🍬'], ['honey', '🍯'], ['vinegar', '🍶'], ['soy', '🍶'],
  ['oil', '🫗'], ['wine', '🍷'], ['coffee', '☕'], ['matcha', '🍵'], ['tea', '🍵'],
  ['chocolate', '🍫'], ['cocoa', '🍫'], ['nut', '🥜'], ['peanut', '🥜'], ['almond', '🥜'],
  ['ginger', '🫚'], ['basil', '🌿'], ['parsley', '🌿'], ['cilantro', '🌿'], ['coriander', '🌿'],
  ['mint', '🌿'], ['thyme', '🌿'], ['rosemary', '🌿'], ['herb', '🌿'], ['curry', '🍛'],
  ['water', '💧'],
];

/** Best-match food emoji for an ingredient name, or a generic spoon fallback. */
export function ingredientEmoji(item: string): string {
  const n = item.toLowerCase();
  for (const [k, e] of MAP) if (n.includes(k)) return e;
  return '🥄';
}
