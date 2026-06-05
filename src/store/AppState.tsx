// AppState.tsx — central client state for recipes + user lists. Offline-first:
// hydrates from the repo (Supabase when configured, else seed/AsyncStorage),
// applies updates locally, and persists in the background.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  listRecipes, addRecipe, loadUserState, saveUserState, DEFAULT_STATE, UserState,
} from '../lib/repo';
import { RECIPES as SEED_RECIPES, NOTIFICATIONS } from '../data/seed';
import { useAuth } from './auth';
import type { Recipe, WeekPlan, MealSlot, GroceryItem } from '../data/types';

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
  unread: number;
  markNotificationsRead: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>(SEED_RECIPES);
  const [state, setState] = useState<UserState>(DEFAULT_STATE);
  const [unread, setUnread] = useState(NOTIFICATIONS.length);

  useEffect(() => {
    let active = true;
    (async () => {
      const [rs, us] = await Promise.all([listRecipes(), loadUserState(user?.id)]);
      if (!active) return;
      setRecipes([...rs]);
      setState(us);
      setReady(true);
    })();
    return () => { active = false; };
  }, [user?.id]);

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
    unread,
    markNotificationsRead: () => setUnread(0),
  }), [ready, recipes, state, unread, user?.id]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppStateProvider');
  return v;
}
