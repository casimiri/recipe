// auth.tsx — session context. When Supabase is configured it uses real
// email/password auth; otherwise the app runs in a local "guest" mode.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthCtx {
  session: Session | null;
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    const sb = supabase;
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));

    // Refresh tokens only while the app is in the foreground (RN best practice).
    const onAppState = (next: string) => {
      if (next === 'active') sb.auth.startAutoRefresh();
      else sb.auth.stopAutoRefresh();
    };
    if (AppState.currentState === 'active') sb.auth.startAutoRefresh();
    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      sub.subscription.unsubscribe();
      appSub.remove();
      sb.auth.stopAutoRefresh();
    };
  }, []);

  const value: AuthCtx = {
    session,
    user: session?.user ?? null,
    loading,
    configured: isSupabaseConfigured,
    signIn: async (email, password) => {
      if (!supabase) return {};
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    signUp: async (email, password) => {
      if (!supabase) return {};
      const { error } = await supabase.auth.signUp({ email, password });
      return { error: error?.message };
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      setSession(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used within AuthProvider');
  return v;
}
