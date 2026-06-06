// repo.ts — data access layer. Reads recipes from Supabase when configured,
// otherwise the seeded list. Persists per-user app state (saved recipes, meal
// plan, grocery list, tastes) to the `user_state` table when signed in, with an
// AsyncStorage cache that also serves as the offline source of truth.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { RECIPES as SEED_RECIPES, MEAL_PLAN } from '../data/seed';
import type { Recipe, WeekPlan } from '../data/types';

/** A logged cook: which recipe, the star rating (0 = unrated), and when. */
export interface CookLog {
  id: string;
  rating: number;
  at: number;
}

/** A user-created cookbook (a named collection of recipe ids). */
export interface UserCookbook {
  id: string;
  name: string;
  recipeIds: string[];
}

/** An app-generated notification (e.g. a finished cook timer), newest first. */
export interface AppReminder {
  id: string;
  kind: 'cooked' | 'plan';
  text: string;
  recipe?: string;
  at: number;
}

export interface UserState {
  saved: string[];
  plan: WeekPlan;
  groceryChecked: string[];
  groceryExtra: { id: string; name: string; qty: string; from: string }[];
  tastes: string[];
  cooked: CookLog[];
  /** Dietary preferences (recipe tags); recipes shown must match all of these. */
  diet: string[];
  /** Measurement system for ingredient quantities. */
  units: 'metric' | 'imperial';
  /** User-created cookbooks. */
  cookbooks: UserCookbook[];
  /** Recent search queries, most recent first. */
  recentSearches: string[];
  /** App-generated notifications (cook-timer reminders etc.), newest first. */
  reminders: AppReminder[];
  /** Timestamp the notifications screen was last viewed (drives the unread badge). */
  notifsSeenAt: number;
}

export const DEFAULT_STATE: UserState = {
  saved: ['crepes', 'curry', 'salmon', 'bowl', 'lava', 'oats'],
  plan: JSON.parse(JSON.stringify(MEAL_PLAN)),
  groceryChecked: ['g14', 'g17'],
  groceryExtra: [],
  tastes: [],
  cooked: [
    { id: 'curry', rating: 5, at: 0 },
    { id: 'crepes', rating: 4, at: 0 },
    { id: 'salmon', rating: 5, at: 0 },
    { id: 'tacos', rating: 4, at: 0 },
  ],
  diet: [],
  units: 'metric',
  cookbooks: [],
  recentSearches: [],
  reminders: [],
  notifsSeenAt: 0,
};

const GUEST = 'guest';
// Per-user local cache key so one account never reads another's cached data.
const stateKey = (userId?: string) => `rs:userState:${userId || GUEST}`;

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

async function readLocal(userId?: string): Promise<UserState | null> {
  const raw = await AsyncStorage.getItem(stateKey(userId)).catch(() => null);
  if (!raw) return null;
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

// ── User state ─────────────────────────────────────────────
// Resolution order when signed in:
//   1. remote user_state (source of truth across devices)
//   2. if remote is empty, migrate the local guest state up (first login)
//   3. otherwise fall back to this user's local cache, then defaults
export async function loadUserState(userId?: string): Promise<UserState> {
  if (isSupabaseConfigured && supabase && userId) {
    const { data } = await supabase.from('user_state').select('state').eq('user_id', userId).maybeSingle();
    if (data?.state) {
      const merged = { ...DEFAULT_STATE, ...data.state };
      await AsyncStorage.setItem(stateKey(userId), JSON.stringify(merged)).catch(() => {});
      return merged;
    }
    // First login for this account: adopt whatever the user built as a guest.
    const guestState = await readLocal(GUEST);
    if (guestState) {
      await supabase
        .from('user_state')
        .upsert({ user_id: userId, state: guestState, updated_at: new Date().toISOString() })
        .then(() => {}, () => {});
      await AsyncStorage.setItem(stateKey(userId), JSON.stringify(guestState)).catch(() => {});
      return guestState;
    }
  }
  return (await readLocal(userId)) ?? { ...DEFAULT_STATE };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function saveUserState(state: UserState, userId?: string) {
  // Local cache immediately, scoped to this user (or the guest bucket).
  AsyncStorage.setItem(stateKey(userId), JSON.stringify(state)).catch(() => {});
  // Debounced remote sync when signed in.
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

// ── Profiles ───────────────────────────────────────────────
export interface ProfileRow {
  name: string;
  handle: string;
  avatar: string | null;
  bio: string | null;
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from('profiles')
    .select('name, handle, avatar, bio')
    .eq('id', userId)
    .maybeSingle();
  return (data as ProfileRow) ?? null;
}

export async function upsertProfile(userId: string, patch: Partial<ProfileRow>): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase
    .from('profiles')
    .upsert({ id: userId, ...patch })
    .then(() => {}, () => {});
}

/**
 * Upload a base64 avatar to the public `avatars` bucket and return its public
 * URL, or null if Supabase isn't configured or the upload fails (callers then
 * keep the device-local URI as a graceful fallback). The path is namespaced
 * under the user's folder (RLS) and timestamped to bust the CDN cache.
 */
export async function uploadAvatar(userId: string, base64: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const clean = base64.includes(',') ? base64.split(',')[1] : base64;
    const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
    const path = `${userId}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl ?? null;
  } catch {
    return null;
  }
}
