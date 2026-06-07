// Seed content model — ported from the Recipe-Snap design (data.jsx).
// Used to populate Supabase on first run, and as the local fallback when no
// backend is configured.

import type {
  Recipe,
  Category,
  Cookbook,
  WeekPlan,
  GroceryAisle,
  AppNotification,
  Profile,
} from './types';

/** Stable Unsplash CDN image helper (graceful gradient fallback in <Dish/>). */
export const U = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const RECIPES: Recipe[] = [
  {
    id: 'crepes',
    title: 'Crepes with Orange & Honey',
    cuisine: 'Western', meal: 'Breakfast',
    time: 35, servings: 3, cal: 103, difficulty: 'Easy', rating: 4.5, reviews: 218,
    img: U('1519676867240-f03562e64548'),
    source: { kind: 'instagram', handle: '@brunchclub', name: 'Brunch Club' },
    saves: 1240, cooked: 312,
    desc: 'Delicate French crepes folded over warm honey-soaked oranges. A bright, citrus-forward brunch that comes together in one pan.',
    tags: ['Vegetarian', 'Brunch', 'Under 40 min'],
    nutrition: { cal: 103, protein: 4, carbs: 16, fat: 3, fiber: 1, sugar: 8 },
    ingredients: [
      { qty: 2, unit: '', item: 'eggs', g: 'Batter' },
      { qty: 1, unit: 'cup', item: 'all-purpose flour', g: 'Batter' },
      { qty: 0.5, unit: 'cup', item: 'whole milk', g: 'Batter' },
      { qty: 2, unit: 'tbsp', item: 'butter, melted', g: 'Batter' },
      { qty: 1, unit: 'pinch', item: 'salt', g: 'Batter' },
      { qty: 2, unit: '', item: 'oranges, segmented', g: 'To finish' },
      { qty: 3, unit: 'tbsp', item: 'honey', g: 'To finish' },
      { qty: 1, unit: 'tbsp', item: 'powdered sugar', g: 'To finish' },
    ],
    steps: [
      { t: 'Make the batter', d: 'In a large bowl, whisk the flour, eggs and salt. Gradually pour in the milk and water, whisking until smooth. Stir in the melted butter and rest 10 minutes.', timer: 600 },
      { t: 'Heat the pan', d: 'Set a non-stick pan over medium heat and lightly butter it. Ladle in a thin layer of batter, swirling to coat the base.' },
      { t: 'Cook the crepe', d: 'Cook 1–2 minutes until the edges lift, then flip and cook 30 seconds more. Repeat with the rest of the batter.', timer: 90 },
      { t: 'Warm the oranges', d: 'Gently warm the orange segments with honey until glossy and fragrant, about 2 minutes.', timer: 120 },
      { t: 'Plate & serve', d: 'Fold each crepe into quarters, spoon over the honeyed oranges and dust with powdered sugar.' },
    ],
  },
  {
    id: 'curry',
    title: 'Golden Chicken Curry',
    cuisine: 'Asian', meal: 'Dinner',
    time: 45, servings: 4, cal: 520, difficulty: 'Medium', rating: 4.8, reviews: 540,
    img: U('1631292784640-2b24be784d5d'),
    source: { kind: 'tiktok', handle: '@spicekitchen', name: 'Spice Kitchen' },
    saves: 3120, cooked: 980,
    desc: 'A fragrant, golden coconut curry with tender chicken thighs, fresh ginger and a whisper of turmeric. Built for weeknights, tastes like a weekend.',
    tags: ['High protein', 'Gluten-free', 'One pot'],
    nutrition: { cal: 520, protein: 38, carbs: 22, fat: 30, fiber: 4, sugar: 6 },
    ingredients: [
      { qty: 1.5, unit: 'lb', item: 'chicken thighs, diced', g: 'Main' },
      { qty: 1, unit: 'can', item: 'coconut milk', g: 'Main' },
      { qty: 2, unit: 'tbsp', item: 'yellow curry paste', g: 'Main' },
      { qty: 1, unit: '', item: 'onion, sliced', g: 'Aromatics' },
      { qty: 3, unit: 'cloves', item: 'garlic, minced', g: 'Aromatics' },
      { qty: 1, unit: 'tbsp', item: 'fresh ginger, grated', g: 'Aromatics' },
      { qty: 1, unit: 'tsp', item: 'turmeric', g: 'Spice' },
      { qty: 1, unit: 'cup', item: 'jasmine rice', g: 'To serve' },
    ],
    steps: [
      { t: 'Sear the chicken', d: 'Brown the diced chicken in a hot oiled pot until golden on all sides. Remove and set aside.', timer: 360 },
      { t: 'Build the base', d: 'Soften the onion, garlic and ginger, then stir in the curry paste and turmeric until fragrant.', timer: 120 },
      { t: 'Simmer', d: 'Pour in the coconut milk, return the chicken and simmer gently until thickened and cooked through.', timer: 1200 },
      { t: 'Serve', d: 'Spoon over steamed jasmine rice and finish with fresh coriander and lime.' },
    ],
  },
  {
    id: 'salmon',
    title: 'Honey Glazed Salmon',
    cuisine: 'Western', meal: 'Dinner',
    time: 30, servings: 2, cal: 410, difficulty: 'Medium', rating: 4.9, reviews: 712,
    img: U('1467003909585-2f8a72700288'),
    source: { kind: 'url', handle: 'seriouseats.com', name: 'Serious Eats' },
    saves: 4500, cooked: 1500,
    desc: 'Crisp-skinned salmon lacquered in a garlic-honey-soy glaze that caramelizes in minutes. Restaurant-grade, zero fuss.',
    tags: ['High protein', 'Under 30 min', 'Pescatarian'],
    nutrition: { cal: 410, protein: 34, carbs: 18, fat: 22, fiber: 0, sugar: 15 },
    ingredients: [
      { qty: 2, unit: 'fillets', item: 'salmon', g: 'Main' },
      { qty: 3, unit: 'tbsp', item: 'honey', g: 'Glaze' },
      { qty: 2, unit: 'tbsp', item: 'soy sauce', g: 'Glaze' },
      { qty: 2, unit: 'cloves', item: 'garlic, minced', g: 'Glaze' },
      { qty: 1, unit: 'tbsp', item: 'lemon juice', g: 'Glaze' },
      { qty: 1, unit: 'tbsp', item: 'olive oil', g: 'Main' },
    ],
    steps: [
      { t: 'Mix the glaze', d: 'Whisk together honey, soy, garlic and lemon juice in a small bowl.' },
      { t: 'Sear skin-side down', d: 'Sear the salmon in hot oil, skin-side down, until the skin is crisp, about 4 minutes.', timer: 240 },
      { t: 'Glaze & finish', d: 'Flip, pour in the glaze and spoon over the fish until thick and glossy, 2–3 minutes.', timer: 180 },
      { t: 'Rest & serve', d: 'Rest 2 minutes, then serve with greens and the pan sauce.' },
    ],
  },
  {
    id: 'pasta',
    title: 'Spaghetti Pomodoro',
    cuisine: 'Italian', meal: 'Dinner',
    time: 25, servings: 2, cal: 480, difficulty: 'Easy', rating: 4.6, reviews: 389,
    img: U('1551183053-bf91a1d81141'),
    source: { kind: 'manual', handle: 'You', name: 'My Recipe' },
    saves: 870, cooked: 410,
    desc: 'The purist’s tomato pasta: sweet San Marzanos, good olive oil, torn basil. Five ingredients, endless comfort.',
    tags: ['Vegetarian', 'Quick', 'Pantry'],
    nutrition: { cal: 480, protein: 14, carbs: 78, fat: 12, fiber: 6, sugar: 9 },
    ingredients: [
      { qty: 200, unit: 'g', item: 'spaghetti', g: 'Main' },
      { qty: 1, unit: 'can', item: 'San Marzano tomatoes', g: 'Sauce' },
      { qty: 3, unit: 'cloves', item: 'garlic, sliced', g: 'Sauce' },
      { qty: 3, unit: 'tbsp', item: 'olive oil', g: 'Sauce' },
      { qty: 1, unit: 'handful', item: 'fresh basil', g: 'To finish' },
    ],
    steps: [
      { t: 'Boil the pasta', d: 'Cook spaghetti in well-salted water until al dente. Reserve a cup of pasta water.', timer: 540 },
      { t: 'Start the sauce', d: 'Gently sizzle the garlic in olive oil, then add the crushed tomatoes and simmer.', timer: 600 },
      { t: 'Toss together', d: 'Toss the pasta in the sauce with a splash of pasta water until silky. Finish with basil.' },
    ],
  },
  {
    id: 'bowl',
    title: 'Green Goddess Bowl',
    cuisine: 'Healthy', meal: 'Lunch',
    time: 15, servings: 1, cal: 320, difficulty: 'Easy', rating: 4.7, reviews: 256,
    img: U('1512621776951-a57141f2eefd'),
    source: { kind: 'instagram', handle: '@plantplates', name: 'Plant Plates' },
    saves: 1980, cooked: 640,
    desc: 'Crunchy greens, creamy avocado and a herby goddess dressing. The lunch that makes you feel like you have your life together.',
    tags: ['Vegan', 'Under 15 min', 'High fiber'],
    nutrition: { cal: 320, protein: 9, carbs: 28, fat: 20, fiber: 11, sugar: 5 },
    ingredients: [
      { qty: 2, unit: 'cups', item: 'mixed greens', g: 'Bowl' },
      { qty: 1, unit: '', item: 'avocado, sliced', g: 'Bowl' },
      { qty: 0.5, unit: 'cup', item: 'cooked quinoa', g: 'Bowl' },
      { qty: 0.25, unit: 'cup', item: 'green goddess dressing', g: 'Dressing' },
      { qty: 1, unit: 'tbsp', item: 'pumpkin seeds', g: 'Bowl' },
    ],
    steps: [
      { t: 'Build the base', d: 'Layer the greens and quinoa in a wide bowl.' },
      { t: 'Top it', d: 'Fan over the avocado, scatter pumpkin seeds.' },
      { t: 'Dress & eat', d: 'Drizzle generously with goddess dressing and toss at the table.' },
    ],
  },
  {
    id: 'pizza',
    title: 'Margherita Pizza',
    cuisine: 'Italian', meal: 'Dinner',
    time: 40, servings: 4, cal: 600, difficulty: 'Medium', rating: 4.7, reviews: 901,
    img: U('1574071318508-1cdbab80d002'),
    source: { kind: 'youtube', handle: 'Pizza Nerd', name: 'Pizza Nerd' },
    saves: 5200, cooked: 1820,
    desc: 'Blistered crust, San Marzano sauce, fresh mozzarella and basil. The whole point of owning an oven.',
    tags: ['Vegetarian', 'Crowd-pleaser'],
    nutrition: { cal: 600, protein: 24, carbs: 72, fat: 24, fiber: 4, sugar: 6 },
    ingredients: [
      { qty: 1, unit: 'ball', item: 'pizza dough', g: 'Base' },
      { qty: 0.5, unit: 'cup', item: 'tomato sauce', g: 'Topping' },
      { qty: 8, unit: 'oz', item: 'fresh mozzarella', g: 'Topping' },
      { qty: 1, unit: 'handful', item: 'fresh basil', g: 'Topping' },
      { qty: 2, unit: 'tbsp', item: 'olive oil', g: 'Topping' },
    ],
    steps: [
      { t: 'Preheat hot', d: 'Heat the oven and a pizza steel as hot as it goes, at least 30 minutes.', timer: 1800 },
      { t: 'Stretch & top', d: 'Stretch the dough, spread sauce thinly and dot with torn mozzarella.' },
      { t: 'Bake', d: 'Bake until the crust is charred and the cheese bubbles, 6–8 minutes.', timer: 420 },
      { t: 'Finish', d: 'Top with fresh basil and a drizzle of olive oil.' },
    ],
  },
  {
    id: 'tacos',
    title: 'Street-Style Tacos',
    cuisine: 'Local', meal: 'Dinner',
    time: 30, servings: 3, cal: 450, difficulty: 'Easy', rating: 4.8, reviews: 633,
    img: U('1565299585323-38d6b0865b47'),
    source: { kind: 'tiktok', handle: '@tacotuesday', name: 'Taco Tuesday' },
    saves: 2700, cooked: 1100,
    desc: 'Charred, marinated meat tucked into warm corn tortillas with onion, cilantro and a squeeze of lime. Napkins mandatory.',
    tags: ['High protein', 'Quick'],
    nutrition: { cal: 450, protein: 28, carbs: 36, fat: 22, fiber: 5, sugar: 3 },
    ingredients: [
      { qty: 1, unit: 'lb', item: 'skirt steak', g: 'Main' },
      { qty: 8, unit: '', item: 'corn tortillas', g: 'Main' },
      { qty: 1, unit: '', item: 'white onion, diced', g: 'Toppings' },
      { qty: 1, unit: 'bunch', item: 'cilantro', g: 'Toppings' },
      { qty: 2, unit: '', item: 'limes', g: 'Toppings' },
    ],
    steps: [
      { t: 'Sear the steak', d: 'Sear the steak hard, then rest and chop into bite-size pieces.', timer: 480 },
      { t: 'Warm tortillas', d: 'Char the tortillas directly over the flame until soft and spotty.' },
      { t: 'Assemble', d: 'Pile on the meat, top with onion and cilantro, finish with lime.' },
    ],
  },
  {
    id: 'oats',
    title: 'Berry Overnight Oats',
    cuisine: 'Healthy', meal: 'Breakfast',
    time: 10, servings: 2, cal: 290, difficulty: 'Easy', rating: 4.4, reviews: 178,
    img: U('1490645935967-10de6ba17061'),
    source: { kind: 'manual', handle: 'You', name: 'My Recipe' },
    saves: 1320, cooked: 720,
    desc: 'Stir it tonight, grab it tomorrow. Creamy oats, chia and a tumble of berries — breakfast on autopilot.',
    tags: ['Vegan', 'Make ahead', 'High fiber'],
    nutrition: { cal: 290, protein: 10, carbs: 44, fat: 8, fiber: 9, sugar: 14 },
    ingredients: [
      { qty: 1, unit: 'cup', item: 'rolled oats', g: 'Base' },
      { qty: 1, unit: 'cup', item: 'almond milk', g: 'Base' },
      { qty: 2, unit: 'tbsp', item: 'chia seeds', g: 'Base' },
      { qty: 1, unit: 'cup', item: 'mixed berries', g: 'Top' },
      { qty: 1, unit: 'tbsp', item: 'maple syrup', g: 'Base' },
    ],
    steps: [
      { t: 'Combine', d: 'Stir oats, milk, chia and maple in a jar.' },
      { t: 'Chill overnight', d: 'Cover and refrigerate at least 4 hours, ideally overnight.', timer: 600 },
      { t: 'Top & go', d: 'Top with berries in the morning and eat cold.' },
    ],
  },
  {
    id: 'lassi',
    title: 'Mango Lassi',
    cuisine: 'Drinks', meal: 'Drink',
    time: 5, servings: 2, cal: 180, difficulty: 'Easy', rating: 4.5, reviews: 142,
    img: U('1601050690597-df0568f70950'),
    source: { kind: 'instagram', handle: '@cooldrinks', name: 'Cool Drinks' },
    saves: 640, cooked: 290,
    desc: 'Cold, creamy and golden — ripe mango blended with yogurt and a pinch of cardamom.',
    tags: ['Vegetarian', 'Under 5 min'],
    nutrition: { cal: 180, protein: 6, carbs: 32, fat: 4, fiber: 2, sugar: 28 },
    ingredients: [
      { qty: 2, unit: 'cups', item: 'ripe mango', g: 'Blend' },
      { qty: 1, unit: 'cup', item: 'yogurt', g: 'Blend' },
      { qty: 0.5, unit: 'cup', item: 'milk', g: 'Blend' },
      { qty: 1, unit: 'pinch', item: 'cardamom', g: 'Blend' },
    ],
    steps: [
      { t: 'Blend', d: 'Blend everything until completely smooth.' },
      { t: 'Serve', d: 'Pour over ice and dust with cardamom.' },
    ],
  },
  {
    id: 'lava',
    title: 'Chocolate Lava Cake',
    cuisine: 'Dessert', meal: 'Dessert',
    time: 25, servings: 2, cal: 480, difficulty: 'Medium', rating: 4.9, reviews: 820,
    img: U('1606313564200-e75d5e30476c'),
    source: { kind: 'url', handle: 'bonappetit.com', name: 'Bon Appétit' },
    saves: 6100, cooked: 2010,
    desc: 'Cakey edges, molten middle. Mix in one bowl, bake in twelve minutes, and look like a genius.',
    tags: ['Vegetarian', 'Date night'],
    nutrition: { cal: 480, protein: 8, carbs: 52, fat: 28, fiber: 3, sugar: 38 },
    ingredients: [
      { qty: 4, unit: 'oz', item: 'dark chocolate', g: 'Batter' },
      { qty: 0.5, unit: 'cup', item: 'butter', g: 'Batter' },
      { qty: 2, unit: '', item: 'eggs', g: 'Batter' },
      { qty: 0.5, unit: 'cup', item: 'sugar', g: 'Batter' },
      { qty: 0.25, unit: 'cup', item: 'flour', g: 'Batter' },
    ],
    steps: [
      { t: 'Melt', d: 'Melt chocolate and butter together until glossy.' },
      { t: 'Mix', d: 'Whisk in eggs and sugar, then fold in the flour.' },
      { t: 'Bake', d: 'Bake in buttered ramekins until the edges set but centers jiggle, 11–12 min.', timer: 720 },
      { t: 'Invert', d: 'Rest 1 minute, invert onto a plate and serve at once.' },
    ],
  },
  {
    id: 'matcha',
    title: 'Iced Matcha Latte',
    cuisine: 'Drinks', meal: 'Drink',
    time: 5, servings: 1, cal: 120, difficulty: 'Easy', rating: 4.3, reviews: 96,
    img: U('1536256263959-770b48d82b0a'),
    source: { kind: 'tiktok', handle: '@matchamood', name: 'Matcha Mood' },
    saves: 510, cooked: 230,
    desc: 'Whisked ceremonial matcha over cold milk and ice. Calmer than coffee, prettier too.',
    tags: ['Vegetarian', 'Under 5 min'],
    nutrition: { cal: 120, protein: 4, carbs: 14, fat: 5, fiber: 1, sugar: 10 },
    ingredients: [
      { qty: 1, unit: 'tsp', item: 'matcha powder', g: 'Drink' },
      { qty: 2, unit: 'tbsp', item: 'hot water', g: 'Drink' },
      { qty: 1, unit: 'cup', item: 'oat milk', g: 'Drink' },
      { qty: 1, unit: 'tsp', item: 'maple syrup', g: 'Drink' },
    ],
    steps: [
      { t: 'Whisk', d: 'Whisk matcha with hot water until frothy and lump-free.' },
      { t: 'Pour', d: 'Pour over iced milk and sweeten to taste.' },
    ],
  },
  {
    id: 'roast',
    title: 'Lemon Herb Roast Chicken',
    cuisine: 'Western', meal: 'Dinner',
    time: 90, servings: 5, cal: 650, difficulty: 'Medium', rating: 4.9, reviews: 1120,
    img: U('1598103442097-8b74394b95c6'),
    source: { kind: 'url', handle: 'nytcooking.com', name: 'NYT Cooking' },
    saves: 7300, cooked: 2400,
    desc: 'Golden, crackling skin and lemony herb butter under every inch. The Sunday dinner that owns the table.',
    tags: ['High protein', 'Gluten-free', 'Sunday'],
    nutrition: { cal: 650, protein: 52, carbs: 4, fat: 46, fiber: 1, sugar: 1 },
    ingredients: [
      { qty: 1, unit: '', item: 'whole chicken', g: 'Main' },
      { qty: 4, unit: 'tbsp', item: 'butter, softened', g: 'Herb butter' },
      { qty: 1, unit: '', item: 'lemon, halved', g: 'Main' },
      { qty: 4, unit: 'sprigs', item: 'thyme', g: 'Herb butter' },
      { qty: 1, unit: 'head', item: 'garlic', g: 'Main' },
    ],
    steps: [
      { t: 'Season', d: 'Rub the chicken all over and under the skin with herb butter; salt generously.' },
      { t: 'Roast', d: 'Roast at high heat, basting once, until the juices run clear, about 75 minutes.', timer: 4500 },
      { t: 'Rest', d: 'Rest 15 minutes before carving so the juices settle.', timer: 900 },
    ],
  },
];

export const CATEGORIES: Category[] = [
  { id: 'popular', label: 'Popular', icon: 'flame' },
  { id: 'Breakfast', label: 'Breakfast', icon: 'egg' },
  { id: 'Western', label: 'Western', icon: 'pizza' },
  { id: 'Asian', label: 'Asian', icon: 'bowl' },
  { id: 'Drinks', label: 'Drinks', icon: 'cup' },
  { id: 'Local', label: 'Local', icon: 'chili' },
  { id: 'Dessert', label: 'Dessert', icon: 'cake' },
  { id: 'Healthy', label: 'Healthy', icon: 'leaf' },
];

export const COOKBOOKS: Cookbook[] = [
  { id: 'weeknight', name: 'Weeknight Dinners', count: 18, cover: ['curry', 'salmon', 'tacos', 'pasta'], color: '#F5B301' },
  { id: 'brunch', name: 'Lazy Brunch', count: 9, cover: ['crepes', 'oats', 'bowl'], color: '#F08A24' },
  { id: 'sweet', name: 'Sweet Tooth', count: 12, cover: ['lava', 'crepes'], color: '#E5484D' },
  { id: 'drinks', name: 'Sips', count: 7, cover: ['lassi', 'matcha'], color: '#16A34A' },
  { id: 'trynext', name: 'Want to Try', count: 24, cover: ['pizza', 'roast', 'curry'], color: '#6E56CF' },
];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MEAL_PLAN: WeekPlan = {
  Mon: { breakfast: 'oats', lunch: 'bowl', dinner: 'curry' },
  Tue: { breakfast: 'crepes', lunch: null, dinner: 'salmon' },
  Wed: { breakfast: 'oats', lunch: 'bowl', dinner: 'pasta' },
  Thu: { breakfast: null, lunch: 'tacos', dinner: null },
  Fri: { breakfast: 'crepes', lunch: null, dinner: 'pizza' },
  Sat: { breakfast: 'oats', lunch: null, dinner: 'roast' },
  Sun: { breakfast: null, lunch: 'bowl', dinner: null },
};

export const GROCERY: GroceryAisle[] = [
  { aisle: 'Produce', items: [
    { id: 'g1', name: 'Oranges', qty: '4', from: 'Crepes' },
    { id: 'g2', name: 'Avocado', qty: '2', from: 'Green Goddess Bowl' },
    { id: 'g3', name: 'Mixed greens', qty: '1 bag', from: 'Green Goddess Bowl' },
    { id: 'g4', name: 'Fresh ginger', qty: '1 knob', from: 'Chicken Curry' },
    { id: 'g5', name: 'Limes', qty: '4', from: 'Tacos' },
    { id: 'g6', name: 'Cilantro', qty: '1 bunch', from: 'Tacos' },
  ]},
  { aisle: 'Meat & Seafood', items: [
    { id: 'g7', name: 'Chicken thighs', qty: '1.5 lb', from: 'Chicken Curry' },
    { id: 'g8', name: 'Salmon fillets', qty: '2', from: 'Honey Glazed Salmon' },
    { id: 'g9', name: 'Skirt steak', qty: '1 lb', from: 'Tacos' },
  ]},
  { aisle: 'Dairy & Eggs', items: [
    { id: 'g10', name: 'Eggs', qty: '1 dozen', from: 'Crepes' },
    { id: 'g11', name: 'Whole milk', qty: '1 qt', from: 'Crepes' },
    { id: 'g12', name: 'Butter', qty: '1 block', from: 'Multiple' },
    { id: 'g13', name: 'Yogurt', qty: '2 cups', from: 'Mango Lassi' },
  ]},
  { aisle: 'Pantry', items: [
    { id: 'g14', name: 'All-purpose flour', qty: '1 bag', from: 'Crepes' },
    { id: 'g15', name: 'Coconut milk', qty: '1 can', from: 'Chicken Curry' },
    { id: 'g16', name: 'Yellow curry paste', qty: '1 jar', from: 'Chicken Curry' },
    { id: 'g17', name: 'Honey', qty: '1 jar', from: 'Multiple' },
    { id: 'g18', name: 'Jasmine rice', qty: '2 lb', from: 'Chicken Curry' },
  ]},
];

export const NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', kind: 'cooked', who: 'Maya', text: 'cooked your Golden Chicken Curry', time: '2h', recipe: 'curry' },
  { id: 'n2', kind: 'follow', who: 'Liam', text: 'started following you', time: '5h' },
  { id: 'n3', kind: 'save', who: 'Sofia', text: 'saved your Crepes with Orange & Honey', time: '1d', recipe: 'crepes' },
  { id: 'n4', kind: 'plan', who: 'Recipe-Snap', text: 'Time to plan next week’s meals ✨', time: '2d' },
];

export const PROFILE: Profile = {
  name: 'Teresa Lin',
  handle: '@teresacooks',
  avatar: U('1438761681033-6461ffad8d80', 200),
  bio: 'Home cook · brunch enthusiast · collecting recipes faster than I can cook them.',
  stats: { recipes: 64, cookbooks: 5 },
  created: ['pasta', 'oats'],
};

export const FILTERS: Record<string, string[]> = {
  diet: ['Vegetarian', 'Vegan', 'Gluten-free', 'Pescatarian', 'High protein'],
  time: ['Under 15 min', 'Under 30 min', 'Under 1 hr'],
  difficulty: ['Easy', 'Medium', 'Hard'],
  meal: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Drink'],
};

export const TASTES = ['Italian', 'Asian', 'Mexican', 'Vegetarian', 'Vegan', 'High protein', 'Quick & easy', 'Baking', 'Healthy', 'Comfort food', 'Seafood', 'Desserts'];

export const ONB_SLIDES = [
  { img: U('1495521821757-a1efb6729352'), icon: 'link', title: 'Save recipes from anywhere', body: 'Paste a link from Instagram, TikTok, YouTube or any website — we pull out the ingredients and steps in seconds.' },
  { img: U('1490645935967-10de6ba17061'), icon: 'calendar', title: 'Plan your whole week', body: 'Drag recipes onto a calendar and let Recipe-Snap build the schedule around your life.' },
  { img: U('1543339308-43e59d6b73a6'), icon: 'cart', title: 'Shop without the guesswork', body: 'Your meal plan becomes a smart grocery list, grouped by aisle and ready to order.' },
];

export const ONB_HERO = U('1504674900247-0877df9cc836');
