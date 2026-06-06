// recipes.ts — per-language overlay for the seed catalog's free-text fields.
// localizeRecipe() returns a copy with title/desc (and ingredients/steps when
// translated) replaced for the active language, falling back to the authored
// English for anything missing — so imported recipes and untranslated fields
// just stay as written. Enum-ish fields (cuisine, meal, difficulty, tags) are
// NOT touched here: they drive filtering/category logic and must stay English;
// localize them at render time with trEnum() instead.
import type { Recipe } from '../data/types';
import type { Lang } from './index';

interface RecipeOverlay {
  title: string;
  desc: string;
  ingredients?: { item: string; g: string }[]; // index-aligned with the recipe
  steps?: { t: string; d: string }[];           // index-aligned with the recipe
}

type Overlays = Record<string, RecipeOverlay>;

const fr: Overlays = {
  crepes: { title: 'Crêpes à l’orange et au miel', desc: 'De délicates crêpes françaises pliées sur des oranges chaudes au miel. Un brunch lumineux et acidulé, prêt en une seule poêle.' },
  curry: { title: 'Curry de poulet doré', desc: 'Un curry de coco doré et parfumé, avec du poulet tendre, du gingembre frais et une pointe de curcuma. Pensé pour la semaine, savoureux comme le week-end.' },
  salmon: { title: 'Saumon laqué au miel', desc: 'Saumon à la peau croustillante laqué d’un glaçage ail-miel-soja qui caramélise en quelques minutes. Digne d’un restaurant, sans effort.' },
  pasta: { title: 'Spaghetti Pomodoro', desc: 'Les pâtes à la tomate des puristes : San Marzano sucrées, bonne huile d’olive, basilic déchiré. Cinq ingrédients, réconfort infini.' },
  bowl: { title: 'Bol Green Goddess', desc: 'Verdure croquante, avocat crémeux et une sauce aux herbes. Le déjeuner qui donne l’impression d’avoir sa vie en main.' },
  pizza: { title: 'Pizza Margherita', desc: 'Croûte boursouflée, sauce San Marzano, mozzarella fraîche et basilic. Toute la raison d’avoir un four.' },
  tacos: { title: 'Tacos de rue', desc: 'Viande marinée et grillée glissée dans des tortillas de maïs chaudes avec oignon, coriandre et un trait de citron vert. Serviettes obligatoires.' },
  oats: { title: 'Overnight oats aux fruits rouges', desc: 'Préparez-les ce soir, attrapez-les demain. Flocons crémeux, chia et une cascade de fruits rouges — le petit-déjeuner en pilote automatique.' },
  lassi: { title: 'Lassi à la mangue', desc: 'Froid, crémeux et doré — mangue mûre mixée avec du yaourt et une pincée de cardamome.' },
  lava: { title: 'Fondant au chocolat', desc: 'Bords moelleux, cœur coulant. Mélangez dans un bol, enfournez douze minutes et passez pour un génie.' },
  matcha: { title: 'Latte matcha glacé', desc: 'Matcha cérémonial fouetté sur du lait froid et des glaçons. Plus calme que le café, et plus joli.' },
  roast: { title: 'Poulet rôti au citron et aux herbes', desc: 'Peau dorée et croustillante, beurre d’herbes citronné sous chaque centimètre. Le dîner du dimanche qui règne sur la table.' },
};

const es: Overlays = {
  crepes: { title: 'Crepes con naranja y miel', desc: 'Delicadas crepes francesas dobladas sobre naranjas calientes con miel. Un brunch luminoso y cítrico que se hace en una sola sartén.' },
  curry: { title: 'Curry de pollo dorado', desc: 'Un curry de coco dorado y aromático con muslos de pollo tiernos, jengibre fresco y un toque de cúrcuma. Pensado para entre semana, sabe a fin de semana.' },
  salmon: { title: 'Salmón glaseado con miel', desc: 'Salmón de piel crujiente lacado con un glaseado de ajo, miel y soja que carameliza en minutos. De restaurante, sin complicaciones.' },
  pasta: { title: 'Espaguetis Pomodoro', desc: 'La pasta de tomate de los puristas: San Marzano dulces, buen aceite de oliva, albahaca troceada. Cinco ingredientes, consuelo infinito.' },
  bowl: { title: 'Bowl Green Goddess', desc: 'Verduras crujientes, aguacate cremoso y un aliño de hierbas. El almuerzo que te hace sentir que tienes la vida resuelta.' },
  pizza: { title: 'Pizza Margarita', desc: 'Masa con ampollas, salsa San Marzano, mozzarella fresca y albahaca. El motivo de tener un horno.' },
  tacos: { title: 'Tacos callejeros', desc: 'Carne marinada y a la brasa en tortillas de maíz calientes con cebolla, cilantro y un chorrito de lima. Servilletas obligatorias.' },
  oats: { title: 'Avena nocturna con frutos rojos', desc: 'Remueve esta noche, cógela mañana. Avena cremosa, chía y un montón de frutos rojos — el desayuno en piloto automático.' },
  lassi: { title: 'Lassi de mango', desc: 'Frío, cremoso y dorado — mango maduro batido con yogur y una pizca de cardamomo.' },
  lava: { title: 'Coulant de chocolate', desc: 'Bordes esponjosos, centro fundido. Mezcla en un bol, hornea doce minutos y parece cosa de genios.' },
  matcha: { title: 'Latte de matcha helado', desc: 'Matcha ceremonial batido sobre leche fría y hielo. Más tranquilo que el café, y más bonito.' },
  roast: { title: 'Pollo asado al limón y hierbas', desc: 'Piel dorada y crujiente, mantequilla de hierbas al limón bajo cada centímetro. La cena de domingo que manda en la mesa.' },
};

const de: Overlays = {
  crepes: { title: 'Crêpes mit Orange & Honig', desc: 'Zarte französische Crêpes über warmen, honiggetränkten Orangen. Ein helles, zitroniges Brunch aus nur einer Pfanne.' },
  curry: { title: 'Goldenes Hähnchencurry', desc: 'Ein duftendes, goldenes Kokoscurry mit zarten Hähnchenschenkeln, frischem Ingwer und einem Hauch Kurkuma. Für unter der Woche, schmeckt nach Wochenende.' },
  salmon: { title: 'Honigglasierter Lachs', desc: 'Lachs mit knuspriger Haut, lackiert mit einer Knoblauch-Honig-Soja-Glasur, die in Minuten karamellisiert. Restaurantreif, ganz ohne Aufwand.' },
  pasta: { title: 'Spaghetti Pomodoro', desc: 'Die Tomatenpasta für Puristen: süße San-Marzano-Tomaten, gutes Olivenöl, gezupftes Basilikum. Fünf Zutaten, endloser Genuss.' },
  bowl: { title: 'Green-Goddess-Bowl', desc: 'Knackiges Grün, cremige Avocado und ein Kräuterdressing. Das Mittagessen, das dir das Gefühl gibt, alles im Griff zu haben.' },
  pizza: { title: 'Pizza Margherita', desc: 'Blasiger Teigrand, San-Marzano-Sauce, frischer Mozzarella und Basilikum. Der ganze Sinn eines Backofens.' },
  tacos: { title: 'Tacos im Streetfood-Stil', desc: 'Mariniertes, gegrilltes Fleisch in warmen Maistortillas mit Zwiebel, Koriander und einem Spritzer Limette. Servietten Pflicht.' },
  oats: { title: 'Overnight Oats mit Beeren', desc: 'Heute Abend rühren, morgen mitnehmen. Cremige Haferflocken, Chia und eine Ladung Beeren — Frühstück auf Autopilot.' },
  lassi: { title: 'Mango-Lassi', desc: 'Kalt, cremig und goldgelb — reife Mango mit Joghurt und einer Prise Kardamom gemixt.' },
  lava: { title: 'Schokoladen-Lavakuchen', desc: 'Kuchige Ränder, flüssiger Kern. In einer Schüssel anrühren, zwölf Minuten backen und wie ein Genie dastehen.' },
  matcha: { title: 'Eis-Matcha-Latte', desc: 'Aufgeschlagener Zeremonien-Matcha über kalter Milch und Eis. Ruhiger als Kaffee, und hübscher.' },
  roast: { title: 'Zitronen-Kräuter-Brathähnchen', desc: 'Goldene, knusprige Haut und zitronige Kräuterbutter unter jedem Zentimeter. Das Sonntagsessen, das den Tisch beherrscht.' },
};

const OVERLAYS: Record<Lang, Overlays> = { en: {}, fr, es, de };

/** Return the recipe with free-text fields localized for `lang` (English passes through). */
export function localizeRecipe(recipe: Recipe, lang: Lang): Recipe {
  if (lang === 'en') return recipe;
  const o = OVERLAYS[lang][recipe.id];
  if (!o) return recipe;
  return {
    ...recipe,
    title: o.title ?? recipe.title,
    desc: o.desc ?? recipe.desc,
    ingredients: o.ingredients
      ? recipe.ingredients.map((ing, i) => ({ ...ing, item: o.ingredients![i]?.item ?? ing.item, g: o.ingredients![i]?.g ?? ing.g }))
      : recipe.ingredients,
    steps: o.steps
      ? recipe.steps.map((st, i) => ({ ...st, t: o.steps![i]?.t ?? st.t, d: o.steps![i]?.d ?? st.d }))
      : recipe.steps,
  };
}
