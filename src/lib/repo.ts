// repo.ts — data access layer. Reads recipes from Supabase when configured,
// otherwise the seeded list. Persists per-user app state (saved recipes, meal
// plan, grocery list, tastes) to the `user_state` table when signed in, with an
// AsyncStorage cache that also serves as the offline source of truth.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { RECIPES as SEED_RECIPES, MEAL_PLAN, COOKBOOKS as SEED_COOKBOOKS } from '../data/seed';
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

/** An app-generated activity/notification entry, newest first. */
export interface AppReminder {
  id: string;
  kind: 'cooked' | 'plan' | 'save' | 'import' | 'timer' | 'review';
  /** Optional pre-rendered text (cook timer); otherwise derived from kind + recipe. */
  text?: string;
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
  /** Recipe ids the user created/imported (the profile "Created" tab), newest first. */
  created: string[];
  /** App-generated notifications (cook-timer reminders etc.), newest first. */
  reminders: AppReminder[];
  /** Timestamp the notifications screen was last viewed (drives the unread badge). */
  notifsSeenAt: number;
  /** Recipe-Snap Pro (reconciled from the server for signed-in users). */
  pro: boolean;
  /** ISO date the Pro subscription is valid until (one month from purchase). */
  proRenewsAt: string;
  /** AI actions used in `aiPeriodKey` (free-tier quota counter). */
  aiUsed: number;
  /** The 'YYYY-MM' period `aiUsed` applies to; usage resets when it rolls over. */
  aiPeriodKey: string;
  /** Whether to schedule local notifications for planned meals. */
  mealReminders: boolean;
  /** The user's own 1–5 rating per recipe id (blended into the displayed rating). */
  ratings: Record<string, number>;
  /** Synced accent colour ('' = use the device/provider default). */
  accent: string;
  /** Synced dark-mode preference ('' = use the device/provider default). */
  dark: '' | 'system' | 'light' | 'dark';
  /** Synced UI language ('' = use the device locale). */
  lang: string;
}

export const DEFAULT_STATE: UserState = {
  saved: ['crepes', 'curry', 'salmon', 'bowl', 'lava', 'oats'],
  plan: JSON.parse(JSON.stringify(MEAL_PLAN)),
  groceryChecked: ['g:honey', 'g:salt'],
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
  // Real, deletable starter cookbooks for new accounts (built from the seed
  // catalog). Existing users keep their own stored `cookbooks` — the hydration
  // merge ({ ...DEFAULT_STATE, ...stored }) means this default only applies to
  // fresh state, so nobody is retro-fitted with starters they've never seen.
  cookbooks: SEED_COOKBOOKS.map((c) => ({ id: c.id, name: c.name, recipeIds: [...c.cover] })),
  recentSearches: [],
  created: ['pasta', 'oats'],
  reminders: [],
  notifsSeenAt: 0,
  pro: false,
  proRenewsAt: '',
  aiUsed: 0,
  aiPeriodKey: '',
  mealReminders: false,
  ratings: {},
  accent: '',
  dark: '',
  lang: '',
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
    baseRating: row.base_rating ?? row.rating,
    baseReviews: row.base_reviews ?? row.reviews,
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
    base_rating: r.baseRating ?? r.rating,
    base_reviews: r.baseReviews ?? r.reviews,
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

export async function listRecipes(force = false): Promise<Recipe[]> {
  if (recipeCache && !force) return recipeCache;
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

/** Update a user's own recipe (RLS scopes the DB update to owner = auth.uid()). */
export async function updateRecipe(r: Recipe, userId?: string): Promise<void> {
  if (recipeCache) recipeCache = recipeCache.map((x) => (x.id === r.id ? r : x));
  if (isSupabaseConfigured && supabase) {
    await supabase.from('recipes').update(recipeToRow(r, userId)).eq('id', r.id).then(() => {}, () => {});
  }
}

/** Delete a user's own recipe (RLS scopes the DB delete to owner = auth.uid()). */
export async function deleteRecipe(id: string): Promise<void> {
  if (recipeCache) recipeCache = recipeCache.filter((x) => x.id !== id);
  if (isSupabaseConfigured && supabase) {
    await supabase.from('recipes').delete().eq('id', id).then(() => {}, () => {});
  }
}

// ── Reviews ────────────────────────────────────────────────
export interface Review {
  id: string;
  recipeId: string;
  userId: string;
  rating: number;
  body: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
}

/** Community reviews for a recipe, newest first (empty when offline/unconfigured). */
export async function listReviews(recipeId: string): Promise<Review[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('recipe_reviews')
    .select('id, recipe_id, user_id, rating, body, author_name, author_avatar, created_at')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id,
    rating: row.rating,
    body: row.body ?? '',
    authorName: row.author_name || 'Anonymous',
    authorAvatar: row.author_avatar ?? null,
    createdAt: row.created_at,
  }));
}

/** Create or update the signed-in user's review (one per recipe). */
export async function addReview(
  recipeId: string,
  userId: string,
  rating: number,
  body: string,
  author: { name: string; avatar: string | null },
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from('recipe_reviews').upsert(
    { recipe_id: recipeId, user_id: userId, rating, body, author_name: author.name, author_avatar: author.avatar },
    { onConflict: 'recipe_id,user_id' },
  );
  return !error;
}

/**
 * Quick rating (a review without text) — upserts only the rating so an existing
 * review's body is preserved. Used by the recipe screen's "Your rating" stars.
 */
export async function setReviewRating(
  recipeId: string,
  userId: string,
  rating: number,
  author: { name: string; avatar: string | null },
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  // Omitting `body` means it isn't in the ON CONFLICT update set, so existing text survives.
  const { error } = await supabase.from('recipe_reviews').upsert(
    { recipe_id: recipeId, user_id: userId, rating, author_name: author.name, author_avatar: author.avatar },
    { onConflict: 'recipe_id,user_id' },
  );
  return !error;
}

/** Recipe ids the user has reviewed, newest first (for their profile). */
export async function listMyReviews(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('recipe_reviews')
    .select('recipe_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => row.recipe_id as string);
}

/** Delete the signed-in user's review for a recipe (RLS scopes to the author). */
export async function deleteReview(recipeId: string, userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase
    .from('recipe_reviews')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('user_id', userId);
  return !error;
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
    const file = `avatar-${Date.now()}.jpg`;
    const path = `${userId}/${file}`;
    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    // Remove the user's previous avatars so the folder doesn't grow unbounded.
    supabase.storage.from('avatars').list(userId).then(({ data }) => {
      const stale = (data ?? []).filter((o) => o.name !== file).map((o) => `${userId}/${o.name}`);
      if (stale.length) supabase!.storage.from('avatars').remove(stale).then(() => {}, () => {});
    }, () => {});
    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl ?? null;
  } catch {
    return null;
  }
}

// ── Billing ────────────────────────────────────────────────
export interface BillingConfig {
  priceCents: number;
  currency: string;
  freeAiQuota: number;
}

/** The current month as 'YYYY-MM' — the window the AI quota resets on. */
export function aiPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

const DEFAULT_BILLING: BillingConfig = { priceCents: 199, currency: 'EUR', freeAiQuota: 5 };

/** Read the admin-configurable price + free AI quota (world-readable). */
export async function getBillingConfig(): Promise<BillingConfig> {
  if (!isSupabaseConfigured || !supabase) return DEFAULT_BILLING;
  try {
    const { data } = await supabase
      .from('app_config')
      .select('price_cents, currency, free_ai_quota')
      .eq('id', 'default')
      .maybeSingle();
    if (!data) return DEFAULT_BILLING;
    return { priceCents: data.price_cents, currency: data.currency, freeAiQuota: data.free_ai_quota };
  } catch {
    return DEFAULT_BILLING;
  }
}

/** Read the signed-in user's Pro state, renewal date + this period's AI usage. */
export async function getSubscription(userId: string): Promise<{ pro: boolean; renewsAt: string | null; aiUsed: number } | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase
      .from('subscriptions')
      .select('pro, renews_at, ai_period, ai_count')
      .eq('user_id', userId)
      .maybeSingle();
    if (!data) return { pro: false, renewsAt: null, aiUsed: 0 };
    const pro = !!data.pro && (!data.renews_at || new Date(data.renews_at).getTime() > Date.now());
    const aiUsed = data.ai_period === aiPeriod() ? (data.ai_count ?? 0) : 0;
    return { pro, renewsAt: data.renews_at ?? null, aiUsed };
  } catch {
    return null;
  }
}

/** One calendar month from now as an ISO string — the guest mock's validity. */
export function oneMonthFromNow(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

/**
 * Mock "purchase" — calls the subscribe function which flips Pro server-side.
 * Returns the renewal date (valid-until) on success, or null on failure.
 */
export async function startSubscription(): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.functions.invoke('subscribe', { body: {} });
    if (error || !data?.subscription?.pro) return null;
    return data.subscription.renews_at ?? null;
  } catch {
    return null;
  }
}

/** Format a price for display, e.g. (199, 'EUR') -> "€1.99". */
export function formatPrice(cents: number, currency: string): string {
  const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency + ' ';
  return `${symbol}${(cents / 100).toFixed(2)}`;
}
