// repo.ts — data access layer. Reads recipes from Supabase when configured,
// otherwise the seeded list. Persists per-user app state (saved recipes, meal
// plan, grocery list, tastes) to the `user_state` table when signed in, with an
// AsyncStorage cache that also serves as the offline source of truth.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { RECIPES as SEED_RECIPES, MEAL_PLAN } from '../data/seed';
import type { Recipe, WeekPlan } from '../data/types';

export interface UserState {
  saved: string[];
  plan: WeekPlan;
  groceryChecked: string[];
  groceryExtra: { id: string; name: string; qty: string; from: string }[];
  tastes: string[];
}

export const DEFAULT_STATE: UserState = {
  saved: ['crepes', 'curry', 'salmon', 'bowl', 'lava', 'oats'],
  plan: JSON.parse(JSON.stringify(MEAL_PLAN)),
  groceryChecked: ['g14', 'g17'],
  groceryExtra: [],
  tastes: [],
};

const LOCAL_STATE_KEY = 'rs:userState';

// ── Recipes ────────────────────────────────────────────────
let recipeCache: Recipe[] | null = null;

/** Map a DB row to a Recipe (snake_case columns -> camel model). */
function rowToRecipe(row: any): Recipe {
  return {
    id: row.id,
    title: row.title,
    cuisine: row.cuisine,
    meal: row.meal,
    time: row.time,
    servings: row.servings,
    cal: row.cal,
    difficulty: row.difficulty,
    rating: row.rating,
    reviews: row.reviews,
    img: row.img,
    source: row.source,
    saves: row.saves,
    cooked: row.cooked,
    desc: row.description,
    tags: row.tags,
    nutrition: row.nutrition,
    ingredients: row.ingredients,
    steps: row.steps,
    imported: row.imported ?? false,
  };
}

function recipeToRow(r: Recipe, userId?: string) {
  return {
    id: r.id,
    title: r.title,
    cuisine: r.cuisine,
    meal: r.meal,
    time: r.time,
    servings: r.servings,
    cal: r.cal,
    difficulty: r.difficulty,
    rating: r.rating,
    reviews: r.reviews,
    img: r.img,
    source: r.source,
    saves: r.saves,
    cooked: r.cooked,
    description: r.desc,
    tags: r.tags,
    nutrition: r.nutrition,
    ingredients: r.ingredients,
    steps: r.steps,
    imported: r.imported ?? false,
    owner: userId ?? null,
  };
}

export async function listRecipes(): Promise<Recipe[]> {
  if (recipeCache) return recipeCache;
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('recipes').select('*');
    if (!error && data && data.length) {
      recipeCache = data.map(rowToRecipe);
      return recipeCache;
    }
  }
  recipeCache = [...SEED_RECIPES];
  return recipeCache;
}

/** Add a recipe to the in-memory cache and persist it when possible. */
export async function addRecipe(r: Recipe, userId?: string): Promise<void> {
  if (!recipeCache) await listRecipes();
  if (recipeCache && !recipeCache.find((x) => x.id === r.id)) recipeCache.unshift(r);
  if (isSupabaseConfigured && supabase) {
    await supabase.from('recipes').upsert(recipeToRow(r, userId)).then(() => {}, () => {});
  }
}

// ── User state ─────────────────────────────────────────────
export async function loadUserState(userId?: string): Promise<UserState> {
  // Try remote first when signed in.
  if (isSupabaseConfigured && supabase && userId) {
    const { data } = await supabase.from('user_state').select('state').eq('user_id', userId).maybeSingle();
    if (data?.state) {
      const merged = { ...DEFAULT_STATE, ...data.state };
      await AsyncStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(merged)).catch(() => {});
      return merged;
    }
  }
  const raw = await AsyncStorage.getItem(LOCAL_STATE_KEY).catch(() => null);
  if (raw) {
    try {
      return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {}
  }
  return { ...DEFAULT_STATE };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function saveUserState(state: UserState, userId?: string) {
  // Local cache immediately.
  AsyncStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state)).catch(() => {});
  // Debounced remote sync.
  if (isSupabaseConfigured && supabase && userId) {
    const sb = supabase;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      sb.from('user_state')
        .upsert({ user_id: userId, state, updated_at: new Date().toISOString() })
        .then(() => {}, () => {});
    }, 600);
  }
}
