// i18n — language context. Mirrors ThemeProvider: defaults to the device
// locale (expo-localization), lets the user override it in Settings, and
// persists the choice to AsyncStorage. Translation is done via a type-safe
// selector — tr((s) => s.settings.title) — so keys are checked at compile time
// and every language is guaranteed to implement the full UIStrings shape.
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { en, type UIStrings } from './ui/en';
import { fr } from './ui/fr';
import { es } from './ui/es';
import { de } from './ui/de';

export type Lang = 'en' | 'fr' | 'es' | 'de';

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'de', label: 'German', native: 'Deutsch' },
];

const DICTS: Record<Lang, UIStrings> = { en, fr, es, de };
const SUPPORTED = new Set<Lang>(['en', 'fr', 'es', 'de']);

/** Pick the device's preferred language if we support it, else English. */
function deviceLang(): Lang {
  for (const loc of getLocales()) {
    const code = loc.languageCode?.toLowerCase() as Lang | undefined;
    if (code && SUPPORTED.has(code)) return code;
  }
  return 'en';
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export type Tr = (select: (s: UIStrings) => string, vars?: Record<string, string | number>) => string;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  tr: Tr;
}

const Ctx = createContext<I18nCtx | null>(null);
const KEY = 'rs:lang';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw && SUPPORTED.has(raw as Lang)) setLangState(raw as Lang);
      setLoaded(true);
    });
  }, []);

  const value: I18nCtx = useMemo(() => ({
    lang,
    setLang: (l) => { setLangState(l); AsyncStorage.setItem(KEY, l).catch(() => {}); },
    tr: (select, vars) => interpolate(select(DICTS[lang]), vars),
  }), [lang]);

  // Avoid a flash of the wrong language before the saved choice loads.
  if (!loaded) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used within I18nProvider');
  return v;
}
