// AppState.tsx — central client state for recipes + user lists. Offline-first:
// hydrates from the repo (Supabase when configured, else seed/AsyncStorage),
// applies updates locally, and persists in the background.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  listRecipes, addRecipe, updateRecipe as updateRecipeRepo, deleteRecipe, loadUserState, saveUserState, getProfile, upsertProfile,
  addReview as addReviewRepo,
  DEFAULT_STATE, UserState, ProfileRow, CookLog, UserCookbook, AppReminder,
  getBillingConfig, getSubscription, startSubscription, aiPeriod, oneMonthFromNow, type BillingConfig,
} from '../lib/repo';
import { RECIPES as SEED_RECIPES, PROFILE } from '../data/seed';
import { useI18n } from '../i18n';
import { localizeRecipe } from '../i18n/recipes';
import { syncMealReminders, clearMealReminders, type MealReminder } from '../lib/notify';
import { buildGroceryList } from '../utils/grocery';
import { useAuth } from './auth';
import type { Recipe, WeekPlan, MealSlot, GroceryItem, GroceryAisle, Profile } from '../data/types';

interface AppCtx {
  ready: boolean;
  recipes: Recipe[];
  byId: (id: string) => Recipe | undefined;
  saved: string[];
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  saveRecipe: (r: Recipe) => Promise<void>;
  /** Patch an owned recipe's editable fields (merged into the base, then synced). */
  updateRecipe: (id: string, patch: Partial<Recipe>) => Promise<void>;
  deleteCreatedRecipe: (id: string) => void;
  plan: WeekPlan;
  setPlan: (p: WeekPlan) => void;
  addToPlan: (day: string, meal: MealSlot, id: string | null) => void;
  mealReminders: boolean;
  setMealReminders: (v: boolean) => void;
  /** Grocery list generated from the meal plan, grouped by aisle. */
  groceryAisles: GroceryAisle[];
  groceryChecked: string[];
  setGroceryChecked: (ids: string[]) => void;
  toggleGrocery: (id: string) => void;
  groceryExtra: GroceryItem[];
  addGroceryItem: (name: string) => void;
  removeGroceryItem: (id: string) => void;
  tastes: string[];
  setTastes: (t: string[]) => void;
  cooked: CookLog[];
  logCook: (id: string, rating: number) => void;
  rateCook: (id: string, rating: number) => void;
  ratings: Record<string, number>;
  setRecipeRating: (id: string, rating: number) => void;
  /** Post the signed-in user's review (rating + text); false if not signed in. */
  addReview: (recipeId: string, rating: number, body: string) => Promise<boolean>;
  diet: string[];
  setDiet: (d: string[]) => void;
  units: 'metric' | 'imperial';
  setUnits: (u: 'metric' | 'imperial') => void;
  cookbooks: UserCookbook[];
  createCookbook: (name: string) => string;
  addToCookbook: (cookbookId: string, recipeId: string) => void;
  removeFromCookbook: (cookbookId: string, recipeId: string) => void;
  deleteCookbook: (cookbookId: string) => void;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  reminders: AppReminder[];
  addReminder: (r: Omit<AppReminder, 'id' | 'at'>) => void;
  unread: number;
  markNotificationsRead: () => void;
  profile: Profile;
  updateProfile: (patch: Partial<ProfileRow>) => Promise<void>;
  // Billing / Pro
  pro: boolean;
  /** ISO date Pro is valid until, or '' when not subscribed. */
  proRenewsAt: string;
  priceCents: number;
  currency: string;
  freeAiQuota: number;
  /** Remaining free AI actions this month; null when Pro (unlimited). */
  aiRemaining: number | null;
  /** Whether the user may run an AI action now (Pro or quota remaining). */
  canUseAi: boolean;
  /** Record one AI action against the monthly quota (no-op when Pro). */
  recordAiUse: () => void;
  /** Mock purchase of Pro; resolves true on success. */
  subscribe: () => Promise<boolean>;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { lang, tr } = useI18n();
  const [ready, setReady] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>(SEED_RECIPES);
  const [state, setState] = useState<UserState>(DEFAULT_STATE);
  const [dbProfile, setDbProfile] = useState<ProfileRow | null>(null);
  const [billing, setBilling] = useState<BillingConfig>({ priceCents: 199, currency: 'EUR', freeAiQuota: 5 });

  // Unread = app-generated reminders newer than the last time the screen was seen.
  const unread = useMemo(
    () => state.reminders.filter((n) => n.at > state.notifsSeenAt).length,
    [state.reminders, state.notifsSeenAt],
  );

  useEffect(() => {
    let active = true;
    setReady(false);
    (async () => {
      const [rs, us, prof, cfg, sub] = await Promise.all([
        listRecipes(),
        loadUserState(user?.id),
        user?.id ? getProfile(user.id) : Promise.resolve(null),
        getBillingConfig(),
        user?.id ? getSubscription(user.id) : Promise.resolve(null),
      ]);
      if (!active) return;
      setRecipes([...rs]);
      // Reconcile Pro state + AI usage from the server (authoritative for
      // signed-in users); guests keep whatever is in their local state.
      setState(sub ? { ...us, pro: sub.pro, proRenewsAt: sub.renewsAt ?? '', aiUsed: sub.aiUsed, aiPeriodKey: aiPeriod() } : us);
      setDbProfile(prof);
      setBilling(cfg);
      setReady(true);
    })();
    return () => { active = false; };
  }, [user?.id]);

  // Merge the DB profile over the seed profile, with the created list and the
  // recipes/cookbooks stat counts derived from real state (created = the user's
  // imported/own recipes; cookbooks = the user's own cookbooks). The profile
  // header also shows a live "cooked" count read straight from state.
  const profile: Profile = useMemo(() => {
    const base: Profile = dbProfile
      ? {
          ...PROFILE,
          name: dbProfile.name || PROFILE.name,
          handle: dbProfile.handle || PROFILE.handle,
          avatar: dbProfile.avatar || PROFILE.avatar,
          bio: dbProfile.bio || PROFILE.bio,
        }
      : PROFILE;
    return {
      ...base,
      created: state.created,
      stats: { ...base.stats, recipes: state.created.length, cookbooks: state.cookbooks.length },
    };
  }, [dbProfile, state.created, state.cookbooks.length]);

  // Persist whenever user state changes (after initial hydration).
  useEffect(() => {
    if (ready) saveUserState(state, user?.id);
  }, [state, ready, user?.id]);

  const update = (patch: Partial<UserState>) => setState((s) => ({ ...s, ...patch }));

  // Append a real activity entry (cooked/planned/saved/imported) to the feed.
  const logActivity = (kind: AppReminder['kind'], recipe: string) =>
    setState((s) => ({ ...s, reminders: [{ id: 'rem' + Date.now(), at: Date.now(), kind, recipe }, ...s.reminders].slice(0, 50) }));

  // Localize the catalog's free-text fields for the active language. Enum-ish
  // fields (cuisine/meal/difficulty/tags) stay English here so the search and
  // category filters keep matching; screens localize those labels via trEnum.
  const localizedRecipes = useMemo(() => recipes.map((r) => localizeRecipe(r, lang)), [recipes, lang]);

  // Smart grocery list: derived from the planned recipes' ingredients (in the
  // active unit system). Built from the base catalog — like the rest of the
  // grocery tab, item names stay in English.
  const groceryAisles = useMemo(
    () => buildGroceryList(state.plan, (id) => recipes.find((r) => r.id === id), state.units),
    [state.plan, recipes, state.units],
  );

  // Blend the user's own 1–5 rating into each recipe's displayed score, counted
  // as one extra review so it nudges (rather than replaces) the catalog average.
  const ratedRecipes = useMemo(
    () => localizedRecipes.map((r) => {
      const mine = state.ratings[r.id];
      if (!mine) return r;
      const reviews = r.reviews + 1;
      return { ...r, rating: Math.round(((r.rating * r.reviews + mine) / reviews) * 10) / 10, reviews };
    }),
    [localizedRecipes, state.ratings],
  );

  // Pro lapses one month after purchase: honour the validity window client-side
  // too (the server is authoritative and reconciles on next load).
  const proActive = state.pro && (!state.proRenewsAt || new Date(state.proRenewsAt).getTime() > Date.now());

  // Free-tier AI quota: usage resets when the month rolls over.
  const usedThisPeriod = state.aiPeriodKey === aiPeriod() ? state.aiUsed : 0;
  const aiRemaining = proActive ? null : Math.max(0, billing.freeAiQuota - usedThisPeriod);
  const canUseAi = proActive || usedThisPeriod < billing.freeAiQuota;

  // Keep local meal-reminder notifications in sync with the plan + the toggle.
  // (No-ops where notifications are unsupported, e.g. Expo Go on Android.)
  useEffect(() => {
    if (!ready) return;
    if (!state.mealReminders) { clearMealReminders(); return; }
    const WEEKDAY: Record<string, number> = { Sun: 1, Mon: 2, Tue: 3, Wed: 4, Thu: 5, Fri: 6, Sat: 7 };
    const MEAL_TIME: Record<MealSlot, { h: number; m: number }> = {
      breakfast: { h: 8, m: 0 }, lunch: { h: 12, m: 30 }, dinner: { h: 18, m: 30 },
    };
    const meals: MealReminder[] = [];
    for (const [day, slots] of Object.entries(state.plan)) {
      const weekday = WEEKDAY[day];
      if (!weekday) continue;
      (['breakfast', 'lunch', 'dinner'] as MealSlot[]).forEach((slot) => {
        const id = slots[slot];
        if (!id) return;
        const r = localizedRecipes.find((x) => x.id === id);
        if (!r) return;
        const tm = MEAL_TIME[slot];
        meals.push({
          weekday, hour: tm.h, minute: tm.m,
          title: tr((s) => s.planner[slot]),
          body: tr((s) => s.planner.timeToCook, { title: r.title }),
        });
      });
    }
    syncMealReminders(meals);
  }, [ready, state.mealReminders, state.plan, lang, localizedRecipes, tr]);

  const value: AppCtx = useMemo(() => ({
    ready,
    recipes: ratedRecipes,
    byId: (id) => ratedRecipes.find((r) => r.id === id),
    saved: state.saved,
    isSaved: (id) => state.saved.includes(id),
    toggleSave: (id) =>
      setState((s) => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
    saveRecipe: async (r) => {
      setRecipes((rs) => (rs.find((x) => x.id === r.id) ? rs : [r, ...rs]));
      setState((s) => ({
        ...s,
        saved: s.saved.includes(r.id) ? s.saved : [r.id, ...s.saved],
        // saveRecipe is the import/"write your own" path, so the recipe is the
        // user's own — surface it in the Created tab + recipes stat.
        created: s.created.includes(r.id) ? s.created : [r.id, ...s.created],
      }));
      logActivity('import', r.id);
      await addRecipe(r, user?.id);
    },
    // Edit an owned recipe. Patch is merged into the BASE (un-localized,
    // un-rated) recipe so we never persist display-time overlays back to source.
    updateRecipe: async (id, patch) => {
      const base = recipes.find((x) => x.id === id);
      if (!base) return;
      const next = { ...base, ...patch };
      setRecipes((rs) => rs.map((x) => (x.id === id ? next : x)));
      await updateRecipeRepo(next, user?.id);
    },
    // Delete a recipe from the user's Created collection. If it's an owned
    // import, also remove it from the catalog/DB and purge references; seed
    // recipes are only dropped from `created` (the shared catalog is left intact).
    deleteCreatedRecipe: (id) => {
      const owned = !!localizedRecipes.find((x) => x.id === id)?.imported;
      if (owned) {
        setRecipes((rs) => rs.filter((x) => x.id !== id));
        deleteRecipe(id);
      }
      setState((s) => {
        const next = { ...s, created: s.created.filter((x) => x !== id) };
        if (!owned) return next;
        next.saved = s.saved.filter((x) => x !== id);
        next.cooked = s.cooked.filter((c) => c.id !== id);
        const ratings = { ...s.ratings };
        delete ratings[id];
        next.ratings = ratings;
        next.cookbooks = s.cookbooks.map((c) => ({ ...c, recipeIds: c.recipeIds.filter((x) => x !== id) }));
        const plan: WeekPlan = {};
        for (const [day, slots] of Object.entries(s.plan)) {
          const ns: Partial<Record<MealSlot, string | null>> = {};
          for (const [m, rid] of Object.entries(slots)) ns[m as MealSlot] = rid === id ? null : rid;
          plan[day] = ns;
        }
        next.plan = plan;
        return next;
      });
    },
    plan: state.plan,
    setPlan: (p) => update({ plan: p }),
    addToPlan: (day, meal, id) => {
      setState((s) => ({ ...s, plan: { ...s.plan, [day]: { ...s.plan[day], [meal]: id } } }));
      if (id) logActivity('plan', id);
    },
    mealReminders: state.mealReminders,
    setMealReminders: (v) => update({ mealReminders: v }),
    groceryAisles,
    groceryChecked: state.groceryChecked,
    setGroceryChecked: (ids) => update({ groceryChecked: ids }),
    toggleGrocery: (id) =>
      setState((s) => ({
        ...s,
        groceryChecked: s.groceryChecked.includes(id)
          ? s.groceryChecked.filter((x) => x !== id)
          : [...s.groceryChecked, id],
      })),
    groceryExtra: state.groceryExtra,
    addGroceryItem: (name) =>
      setState((s) => ({
        ...s,
        groceryExtra: [...s.groceryExtra, { id: 'x' + Date.now(), name: name.trim(), qty: '1', from: 'Added by you' }],
      })),
    removeGroceryItem: (id) =>
      setState((s) => ({
        ...s,
        groceryExtra: s.groceryExtra.filter((g) => g.id !== id),
        groceryChecked: s.groceryChecked.filter((x) => x !== id),
      })),
    tastes: state.tastes,
    setTastes: (t) => update({ tastes: t }),
    cooked: state.cooked,
    // Record a finished cook; most recent first, de-duped so re-cooking a
    // recipe moves it to the front and updates its rating.
    logCook: (id, rating) => {
      setState((s) => ({
        ...s,
        cooked: [{ id, rating, at: Date.now() }, ...s.cooked.filter((c) => c.id !== id)],
      }));
      logActivity('cooked', id);
    },
    ratings: state.ratings,
    setRecipeRating: (id, rating) =>
      setState((s) => ({ ...s, ratings: { ...s.ratings, [id]: rating } })),
    addReview: async (recipeId, rating, body) => {
      if (!user?.id) return false;
      // Keep the user's private star rating in sync with their review rating.
      setState((s) => ({ ...s, ratings: { ...s.ratings, [recipeId]: rating } }));
      return addReviewRepo(recipeId, user.id, rating, body, { name: profile.name, avatar: profile.avatar || null });
    },
    // Re-rate an existing cook in place (keeps its date + position).
    rateCook: (id, rating) =>
      setState((s) => ({
        ...s,
        cooked: s.cooked.map((c) => (c.id === id ? { ...c, rating } : c)),
      })),
    diet: state.diet,
    setDiet: (d) => update({ diet: d }),
    units: state.units,
    setUnits: (u) => update({ units: u }),
    cookbooks: state.cookbooks,
    createCookbook: (name) => {
      const id = 'cb' + Date.now();
      setState((s) => ({ ...s, cookbooks: [{ id, name: name.trim(), recipeIds: [] }, ...s.cookbooks] }));
      return id;
    },
    addToCookbook: (cookbookId, recipeId) => {
      setState((s) => ({
        ...s,
        cookbooks: s.cookbooks.map((c) =>
          c.id === cookbookId && !c.recipeIds.includes(recipeId)
            ? { ...c, recipeIds: [recipeId, ...c.recipeIds] }
            : c),
      }));
      logActivity('save', recipeId);
    },
    removeFromCookbook: (cookbookId, recipeId) =>
      setState((s) => ({
        ...s,
        cookbooks: s.cookbooks.map((c) =>
          c.id === cookbookId ? { ...c, recipeIds: c.recipeIds.filter((x) => x !== recipeId) } : c),
      })),
    deleteCookbook: (cookbookId) =>
      setState((s) => ({ ...s, cookbooks: s.cookbooks.filter((c) => c.id !== cookbookId) })),
    recentSearches: state.recentSearches,
    // Record a query; dedupe case-insensitively (re-searching moves it to the
    // front) and cap at the 8 most recent.
    addRecentSearch: (q) => {
      const term = q.trim();
      if (!term) return;
      setState((s) => ({
        ...s,
        recentSearches: [term, ...s.recentSearches.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, 8),
      }));
    },
    clearRecentSearches: () => update({ recentSearches: [] }),
    reminders: state.reminders,
    addReminder: (r) =>
      setState((s) => ({
        ...s,
        reminders: [{ ...r, id: 'rem' + Date.now(), at: Date.now() }, ...s.reminders].slice(0, 50),
      })),
    unread,
    markNotificationsRead: () => update({ notifsSeenAt: Date.now() }),
    profile,
    updateProfile: async (patch) => {
      setDbProfile((p) => ({
        name: patch.name ?? p?.name ?? PROFILE.name,
        handle: patch.handle ?? p?.handle ?? PROFILE.handle,
        avatar: patch.avatar ?? p?.avatar ?? PROFILE.avatar,
        bio: patch.bio ?? p?.bio ?? PROFILE.bio,
      }));
      if (user?.id) await upsertProfile(user.id, patch);
    },
    pro: proActive,
    proRenewsAt: proActive ? state.proRenewsAt : '',
    priceCents: billing.priceCents,
    currency: billing.currency,
    freeAiQuota: billing.freeAiQuota,
    aiRemaining,
    canUseAi,
    recordAiUse: () =>
      setState((s) => {
        if (proActive) return s;
        const p = aiPeriod();
        return s.aiPeriodKey === p ? { ...s, aiUsed: s.aiUsed + 1 } : { ...s, aiPeriodKey: p, aiUsed: 1 };
      }),
    subscribe: async () => {
      // Signed-in: server flips Pro and returns the one-month validity date.
      // Guest: local mock with the same one-month window.
      if (user?.id) {
        const renewsAt = await startSubscription();
        if (!renewsAt) return false;
        setState((s) => ({ ...s, pro: true, proRenewsAt: renewsAt }));
        return true;
      }
      setState((s) => ({ ...s, pro: true, proRenewsAt: oneMonthFromNow() }));
      return true;
    },
  }), [ready, recipes, localizedRecipes, ratedRecipes, groceryAisles, state, unread, user?.id, profile, billing, aiRemaining, canUseAi, proActive]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppStateProvider');
  return v;
}
