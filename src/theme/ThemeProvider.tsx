import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeTokens, Tokens } from './tokens';

type DarkPref = 'system' | 'light' | 'dark';

interface ThemeCtx {
  t: Tokens;
  accent: string;
  darkPref: DarkPref;
  isDark: boolean;
  setAccent: (a: string) => void;
  setDarkPref: (d: DarkPref) => void;
  toggleDark: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);
const KEY = 'rs:theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [accent, setAccentState] = useState('#F5B301');
  const [darkPref, setDarkPrefState] = useState<DarkPref>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const v = JSON.parse(raw);
          if (v.accent) setAccentState(v.accent);
          if (v.darkPref) setDarkPrefState(v.darkPref);
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const persist = (accent: string, darkPref: DarkPref) => {
    AsyncStorage.setItem(KEY, JSON.stringify({ accent, darkPref })).catch(() => {});
  };

  const isDark = darkPref === 'system' ? system === 'dark' : darkPref === 'dark';
  const t = useMemo(() => makeTokens({ accent, dark: isDark }), [accent, isDark]);

  const value: ThemeCtx = {
    t,
    accent,
    darkPref,
    isDark,
    setAccent: (a) => { setAccentState(a); persist(a, darkPref); },
    setDarkPref: (d) => { setDarkPrefState(d); persist(accent, d); },
    toggleDark: () => {
      const next: DarkPref = isDark ? 'light' : 'dark';
      setDarkPrefState(next);
      persist(accent, next);
    },
  };

  // Avoid a flash of the wrong theme before prefs load.
  if (!loaded) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme must be used within ThemeProvider');
  return v;
}
