// AppState.tsx — central client state for recipes + user lists. Offline-first:
// hydrates from the repo (Supabase when configured, else seed/AsyncStorage),
// applies updates locally, and persists in the background.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  listRecipes, addRecipe, loadUserState, saveUserState, getProfile, upsertProfile,
  DEFAULT_STATE, UserState, ProfileRow, CookLog,
} from '../lib/repo';
import { RECIPES as SEED_RECIPES, NOTIFICATIONS, PROFILE } from '../data/seed';
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
  unread: number;
  markNotificationsRead: () => void;
  profile: Profile;
  updateProfile: (patch: Partial<ProfileRow>) => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>(SEED_RECIPES);
  const [state, setState] = useState<UserState>(DEFAULT_STATE);
  const [unread, setUnread] = useState(NOTIFICATIONS.length);
  const [dbProfile, setDbProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    let active = true;
    setReady(false);
    (async () => {
      const [rs, us, prof] = await Promise.all([
        listRecipes(),
        loadUserState(user?.id),
        user?.id ? getProfile(user.id) : Promise.resolve(null),
      ]);
      if (!active) return;
      setRecipes([...rs]);
      setState(us);
      setDbProfile(prof);
      setReady(true);
    })();
    return () => { active = false; };
  }, [user?.id]);

  // Merge the DB profile over the seed profile (stats stay from seed for now).
  const profile: Profile = useMemo(() => (
    dbProfile
      ? {
          ...PROFILE,
          name: dbProfile.name || PROFILE.name,
          handle: dbProfile.handle || PROFILE.handle,
          avatar: dbProfile.avatar || PROFILE.avatar,
          bio: dbProfile.bio || PROFILE.bio,
        }
      : PROFILE
  ), [dbProfile]);

  // Persist whenever user state changes (after initial hydration).
  useEffect(() => {
    if (ready) saveUserState(state, user?.id);
  }, [state, ready, user?.id]);

  const update = (patch: Partial<UserState>) => setState((s) => ({ ...s, ...patch }));

  const value: AppCtx = useMemo(() => ({
    ready,
    recipes,
    byId: (id) => recipes.find((r) => r.id === id),
    saved: state.saved,
    isSaved: (id) => state.saved.includes(id),
    toggleSave: (id) =>
      setState((s) => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })),
    saveRecipe: async (r) => {
      setRecipes((rs) => (rs.find((x) => x.id === r.id) ? rs : [r, ...rs]));
      setState((s) => ({ ...s, saved: s.saved.includes(r.id) ? s.saved : [r.id, ...s.saved] }));
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
    unread,
    markNotificationsRead: () => setUnread(0),
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
  }), [ready, recipes, state, unread, user?.id, profile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppStateProvider');
  return v;
}
