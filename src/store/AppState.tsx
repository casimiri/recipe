// AppState.tsx — central client state for recipes + user lists. Offline-first:
// hydrates from the repo (Supabase when configured, else seed/AsyncStorage),
// applies updates locally, and persists in the background.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  listRecipes, addRecipe, loadUserState, saveUserState, getProfile, upsertProfile,
  DEFAULT_STATE, UserState, ProfileRow, CookLog, UserCookbook, AppReminder,
  getBillingConfig, getSubscription, startSubscription, aiPeriod, oneMonthFromNow, type BillingConfig,
} from '../lib/repo';
import { RECIPES as SEED_RECIPES, PROFILE } from '../data/seed';
import { useI18n } from '../i18n';
import { localizeRecipe } from '../i18n/recipes';
import { useAuth } from './auth';
import type { Recipe, WeekPlan, MealSlot, GroceryItem, Profile } from '../data/types';

interface AppCtx {
  ready: boolean;
  recipes: Recipe[];
  byId: (id: string) => Recipe | undefined;
  saved: string[];
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  saveRecipe: (r: Recipe) => Promise<void>;
  plan: WeekPlan;
  setPlan: (p: WeekPlan) => void;
  addToPlan: (day: string, meal: MealSlot, id: string | null) => void;
  groceryChecked: string[];
  setGroceryChecked: (ids: string[]) => void;
  toggleGrocery: (id: string) => void;
  groceryExtra: GroceryItem[];
  addGroceryItem: (name: string) => void;
  tastes: string[];
  setTastes: (t: string[]) => void;
  cooked: CookLog[];
  logCook: (id: string, rating: number) => void;
  diet: string[];
  setDiet: (d: string[]) => void;
  units: 'metric' | 'imperial';
  setUnits: (u: 'metric' | 'imperial') => void;
  cookbooks: UserCookbook[];
  createCookbook: (name: string) => string;
  addToCookbook: (cookbookId: string, recipeId: string) => void;
  removeFromCookbook: (cookbookId: string, recipeId: string) => void;
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
  const { lang } = useI18n();
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
  // imported/own recipes; cookbooks = the user's own cookbooks). Followers/
  // following stay seeded — there's no social graph yet.
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

  // Localize the catalog's free-text fields for the active language. Enum-ish
  // fields (cuisine/meal/difficulty/tags) stay English here so the search and
  // category filters keep matching; screens localize those labels via trEnum.
  const localizedRecipes = useMemo(() => recipes.map((r) => localizeRecipe(r, lang)), [recipes, lang]);

  // Pro lapses one month after purchase: honour the validity window client-side
  // too (the server is authoritative and reconciles on next load).
  const proActive = state.pro && (!state.proRenewsAt || new Date(state.proRenewsAt).getTime() > Date.now());

  // Free-tier AI quota: usage resets when the month rolls over.
  const usedThisPeriod = state.aiPeriodKey === aiPeriod() ? state.aiUsed : 0;
  const aiRemaining = proActive ? null : Math.max(0, billing.freeAiQuota - usedThisPeriod);
  const canUseAi = proActive || usedThisPeriod < billing.freeAiQuota;

  const value: AppCtx = useMemo(() => ({
    ready,
    recipes: localizedRecipes,
    byId: (id) => localizedRecipes.find((r) => r.id === id),
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
      await addRecipe(r, user?.id);
    },
    plan: state.plan,
    setPlan: (p) => update({ plan: p }),
    addToPlan: (day, meal, id) =>
      setState((s) => ({ ...s, plan: { ...s.plan, [day]: { ...s.plan[day], [meal]: id } } })),
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
    tastes: state.tastes,
    setTastes: (t) => update({ tastes: t }),
    cooked: state.cooked,
    // Record a finished cook; most recent first, de-duped so re-cooking a
    // recipe moves it to the front and updates its rating.
    logCook: (id, rating) =>
      setState((s) => ({
        ...s,
        cooked: [{ id, rating, at: Date.now() }, ...s.cooked.filter((c) => c.id !== id)],
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
    addToCookbook: (cookbookId, recipeId) =>
      setState((s) => ({
        ...s,
        cookbooks: s.cookbooks.map((c) =>
          c.id === cookbookId && !c.recipeIds.includes(recipeId)
            ? { ...c, recipeIds: [recipeId, ...c.recipeIds] }
            : c),
      })),
    removeFromCookbook: (cookbookId, recipeId) =>
      setState((s) => ({
        ...s,
        cookbooks: s.cookbooks.map((c) =>
          c.id === cookbookId ? { ...c, recipeIds: c.recipeIds.filter((x) => x !== recipeId) } : c),
      })),
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
  }), [ready, localizedRecipes, state, unread, user?.id, profile, billing, aiRemaining, canUseAi, proActive]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppStateProvider');
  return v;
}
