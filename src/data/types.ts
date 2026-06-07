// Core content model types for Recipe-Snap.

export type SourceKind =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'url'
  | 'manual'
  | 'pinterest'
  | 'camera';

export interface RecipeSource {
  kind: SourceKind;
  handle: string;
  name: string;
}

export interface Ingredient {
  qty: number;
  unit: string;
  item: string;
  /** ingredient group label, e.g. "Batter" / "Sauce" */
  g: string;
}

export interface Step {
  t: string;
  d: string;
  /** optional countdown timer in seconds */
  timer?: number;
}

export interface Nutrition {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  meal: string;
  time: number;
  servings: number;
  cal: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  reviews: number;
  /** Seed baseline (pre-review) rating/count, used as a prior when blending real reviews. */
  baseRating?: number;
  baseReviews?: number;
  img: string;
  source: RecipeSource;
  saves: number;
  cooked: number;
  desc: string;
  tags: string[];
  nutrition: Nutrition;
  ingredients: Ingredient[];
  steps: Step[];
  imported?: boolean;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface Cookbook {
  id: string;
  name: string;
  count: number;
  cover: string[];
  color: string;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';
export type WeekPlan = Record<string, Partial<Record<MealSlot, string | null>>>;

export interface GroceryItem {
  id: string;
  name: string;
  qty: string;
  from: string;
}
export interface GroceryAisle {
  aisle: string;
  items: GroceryItem[];
}

export interface AppNotification {
  id: string;
  kind: 'cooked' | 'follow' | 'save' | 'plan';
  who: string;
  text: string;
  time: string;
  recipe?: string;
}

export interface Profile {
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  stats: { recipes: number; cookbooks: number };
  created: string[];
}
