// Shared ingredient visuals: an emoji icon (with a cached AI photo fading in
// over it when one exists) and a hook that drives the "view a large AI photo"
// flow — generation is quota-gated; cached hits are free. Used by the recipe
// detail screen and the grocery list.
import React, { useRef, useState } from 'react';
import { View, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useI18n } from '../i18n';
import { useApp } from '../store/AppState';
import { useAuth } from '../store/auth';
import { Txt } from './Txt';
import { Sheet } from './atoms';
import { ingredientImage, ingredientImageUrl } from '../lib/ai';
import { ingredientEmoji } from '../utils/ingredientIcon';
import type { Tokens } from '../theme/tokens';

/** Emoji icon by default; a cached AI photo (deterministic URL) fades in over it if present. */
export function IngredientIcon({ item, t, size = 30 }: { item: string; t: Tokens; size?: number }) {
  const [ok, setOk] = useState(false);
  const uri = ingredientImageUrl(item);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {!ok ? <Txt style={{ fontSize: size * 0.7 }}>{ingredientEmoji(item)}</Txt> : null}
      {uri ? (
        <Image source={{ uri }} onLoad={() => setOk(true)} onError={() => setOk(false)}
          style={{ width: size, height: size, borderRadius: size / 4.3, position: 'absolute', opacity: ok ? 1 : 0 }} />
      ) : null}
    </View>
  );
}

/**
 * Returns `view(item)` to open a large image of an ingredient (generates on
 * first view — counts against the AI quota — then caches for the session) and
 * `element`, the viewer sheet to render. `onPaywall` fires when the user is out
 * of quota so the host can show its Paywall.
 */
export function useIngredientImage(onPaywall: () => void) {
  const { t } = useTheme();
  const { tr } = useI18n();
  const { canUseAi, recordAiUse } = useApp();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const cache = useRef<Record<string, string>>({});

  const view = async (name: string) => {
    setItem(name);
    setError(false);
    setOpen(true);
    const hit = cache.current[name];
    if (hit) { setUrl(hit); setLoading(false); return; }
    setUrl(null);
    setLoading(true);
    // Guests are gated client-side; signed-in users are gated server-side.
    if (!session && !canUseAi) { setOpen(false); setLoading(false); onPaywall(); return; }
    const res = await ingredientImage(name);
    setLoading(false);
    if (res.quotaExceeded) { setOpen(false); onPaywall(); return; }
    if (!res.url) { setError(true); return; }
    if (res.generated) recordAiUse();
    cache.current[name] = res.url;
    setUrl(res.url);
  };

  const element = (
    <Sheet open={open} onClose={() => setOpen(false)} t={t} title={item ?? ''}>
      {loading ? (
        <View style={{ height: 240, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={t.accent} />
          <Txt style={{ color: t.muted, fontSize: 13 }}>{tr((s) => s.recipe.generatingImage)}</Txt>
        </View>
      ) : error || !url ? (
        <View style={{ height: 180, alignItems: 'center', justifyContent: 'center' }}>
          <Txt style={{ color: t.muted, fontSize: 14, textAlign: 'center' }}>{tr((s) => s.recipe.imageFailed)}</Txt>
        </View>
      ) : (
        <Image source={{ uri: url }} style={{ width: '100%', height: 300, borderRadius: t.radius, marginBottom: 4 }} resizeMode="cover" />
      )}
    </Sheet>
  );

  return { view, element };
}
